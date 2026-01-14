import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireWorkspaceMember } from "@/lib/auth/guard";
import { streamHelperModel } from "@/lib/helper/providers/stream-router";
import { recordHelperUsage } from "@/lib/helper/usage";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { HelperMode, ProviderName } from "@/lib/helper/providers/types";

export const runtime = "nodejs";

// SSE headers
const SSE_HEADERS: Record<string, string> = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

// Helper to send SSE event
function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sseError(status: number, code: string, message: string) {
  return new NextResponse(sseEvent("error", { code, message }), {
    status,
    headers: SSE_HEADERS,
  });
}

// Checkpoint interval (characters or time)
const CHECKPOINT_CHARS = 300;
const CHECKPOINT_MS = 2000;

interface RouteParams {
  params: { id: string };
}

type UsageShape = { inputTokens: number; outputTokens: number; totalTokens: number };
type NextResponseType = import("next/server").NextResponse<unknown>;

export async function POST(req: NextRequest, { params }: RouteParams) {
  // Parse body first (before consuming request)
  let body: {
    workspaceSlug?: string;
    workspaceId?: string;
    content?: string;
    providerKey?: ProviderName;
    modeKey?: HelperMode;
  };

  try {
    body = await req.json();
  } catch {
    return sseError(400, "invalid_json", "Invalid request body");
  }

  // Auth check
  const userRes = await requireUser(req);
  if (!userRes.ok) {
    return sseError(401, "unauthorized", "Authentication required");
  }
  const { user, withCookies } = userRes;

  // Get conversation ID from params
  const conversationId = params.id;

  // Resolve workspace
  const workspaceId = body.workspaceId ?? body.workspaceSlug;
  if (!workspaceId) {
    return sseError(400, "workspace_required", "Workspace ID required");
  }

  // Verify membership
  const membership = await requireWorkspaceMember(user.id, workspaceId);
  if (!membership.ok) {
    return sseError(403, "forbidden", "Workspace access denied");
  }

  // Validate required fields
  const content = body.content?.trim();
  if (!content) {
    return sseError(400, "content_required", "Message content required");
  }

  const providerKey: ProviderName = body.providerKey ?? "auto";
  const modeKey: HelperMode = body.modeKey ?? "chat";

  const db = supabaseAdmin();

  // Verify conversation exists and belongs to workspace
  const { data: conversation } = await db
    .from("helper_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!conversation) {
    return sseError(404, "conversation_not_found", "Conversation not found");
  }

  // Budget pre-check
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;

  const { data: settings } = await db
    .from("helper_settings")
    .select("monthly_cap")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const monthlyCap = Number(settings?.monthly_cap ?? 0);

  if (monthlyCap > 0) {
    const { data: monthlyData } = await db
      .from("helper_usage_daily")
      .select("tokens_in, tokens_out")
      .eq("workspace_id", workspaceId)
      .gte("date", monthStart)
      .lte("date", today);

    const monthlyTotal = (monthlyData ?? []).reduce(
      (sum, row) => sum + (row.tokens_in ?? 0) + (row.tokens_out ?? 0),
      0
    );

    if (monthlyTotal >= monthlyCap) {
      return sseError(403, "budget_exceeded", "Monthly token budget exceeded");
    }
  }

  // Insert user message
  const { data: userMessage, error: userMsgError } = await db
    .from("helper_messages")
    .insert({
      conversation_id: conversationId,
      workspace_id: workspaceId,
      role: "user",
      content,
      provider_key: null,
      mode_key: modeKey,
      status: "done",
    })
    .select("id")
    .single();

  if (userMsgError || !userMessage) {
    return sseError(500, "db_error", "Failed to save user message");
  }

  // Insert assistant message with streaming status
  const { data: assistantMessage, error: assistantMsgError } = await db
    .from("helper_messages")
    .insert({
      conversation_id: conversationId,
      workspace_id: workspaceId,
      role: "assistant",
      content: "",
      provider_key: providerKey === "auto" ? null : providerKey,
      mode_key: modeKey,
      status: "streaming",
    })
    .select("id")
    .single();

  if (assistantMsgError || !assistantMessage) {
    return sseError(500, "db_error", "Failed to create assistant message");
  }

  // Update conversation timestamp
  await db
    .from("helper_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  // Create ReadableStream for SSE
  const encoder = new TextEncoder();
  let aborted = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Send meta event with IDs
      controller.enqueue(
        encoder.encode(
          sseEvent("meta", {
            conversationId,
            userMessageId: userMessage.id,
            assistantMessageId: assistantMessage.id,
          })
        )
      );

      let accumulatedContent = "";
      let lastCheckpointLen = 0;
      let lastCheckpointTime = Date.now();
      let finalProvider: string | null = null;
      let usage: UsageShape | null = null;
      let hasError = false;

      const abortController = new AbortController();

      // Listen for client disconnect
      req.signal.addEventListener("abort", () => {
        aborted = true;
        abortController.abort();
      });

      try {
        for await (const chunk of streamHelperModel({
          content,
          mode: modeKey,
          provider: providerKey,
          signal: abortController.signal,
        })) {
          if (aborted) break;

          if (chunk.error) {
            hasError = true;
            controller.enqueue(
              encoder.encode(
                sseEvent("error", {
                  code: "provider_error",
                  message: chunk.error,
                })
              )
            );
            break;
          }

          if (chunk.delta) {
            accumulatedContent += chunk.delta;
            controller.enqueue(encoder.encode(sseEvent("delta", { text: chunk.delta })));

            const charsSinceCheckpoint = accumulatedContent.length - lastCheckpointLen;
            const timeSinceCheckpoint = Date.now() - lastCheckpointTime;

            if (charsSinceCheckpoint >= CHECKPOINT_CHARS || timeSinceCheckpoint >= CHECKPOINT_MS) {
              await db
                .from("helper_messages")
                .update({ content: accumulatedContent })
                .eq("id", assistantMessage.id);

              lastCheckpointLen = accumulatedContent.length;
              lastCheckpointTime = Date.now();
            }
          }

          if (chunk.done) {
            if (chunk.provider) finalProvider = chunk.provider;
            if (chunk.usage) usage = chunk.usage;
            break;
          }
        }
      } catch (err) {
        hasError = true;
        const message = err instanceof Error ? err.message : "Streaming failed";
        controller.enqueue(encoder.encode(sseEvent("error", { code: "stream_error", message })));
      }

      const finalStatus = aborted ? "cancelled" : hasError ? "error" : "done";

      await db
        .from("helper_messages")
        .update({
          content: accumulatedContent,
          status: finalStatus,
          provider_key: finalProvider,
          usage_input_tokens: usage?.inputTokens ?? null,
          usage_output_tokens: usage?.outputTokens ?? null,
          usage_total_tokens: usage?.totalTokens ?? null,
        })
        .eq("id", assistantMessage.id);

      if (!hasError && !aborted && usage && finalProvider) {
        await recordHelperUsage({
          workspaceId,
          tokensIn: usage.inputTokens,
          tokensOut: usage.outputTokens,
          provider: finalProvider,
        });
      }

      if (!hasError) {
        controller.enqueue(
          encoder.encode(
            sseEvent("done", {
              assistantMessageId: assistantMessage.id,
              status: finalStatus,
              usage: usage ?? null,
              provider: finalProvider,
            })
          )
        );
      }

      controller.close();
    },
  });

  // ✅ IMPORTANT: force this to be NextResponse type for withCookies()
  const response = new NextResponse(stream, { headers: SSE_HEADERS });
  return withCookies(response as unknown as NextResponseType);
}
