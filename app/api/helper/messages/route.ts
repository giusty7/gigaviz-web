import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { runHelperModel } from "@/lib/helper/providers/router";
import { recordHelperUsage } from "@/lib/helper/usage";
import { rateLimit } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const postBodySchema = z.object({
  conversationId: z.string().min(1, "conversationId required"),
  content: z.string().min(1, "content required").max(32_000),
  role: z.string().trim().optional().default("user"),
  mode: z.enum(["chat", "copy", "summary"]).optional().default("chat"),
  provider: z.enum(["auto", "openai", "anthropic", "gemini", "local"]).optional().default("auto"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const runtime = "nodejs";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId) {
    return withCookies(NextResponse.json({ ok: false, error: "conversationId required" }, { status: 400 }));
  }

  const { data: convo } = await db
    .from("helper_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!convo) {
    return withCookies(NextResponse.json({ ok: false, error: "Conversation not found" }, { status: 404 }));
  }

  const { data, error } = await db
    .from("helper_messages")
    .select("id, role, content, metadata, created_at, status, provider_key")
    .eq("workspace_id", workspaceId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, messages: data ?? [] }));
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, user, withCookies, supabase: db } = guard;

  const raw = await req.json().catch(() => ({}));
  const parsed = postBodySchema.safeParse(raw);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { ok: false, error: "validation_error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    );
  }
  const { conversationId, content, role, mode, provider } = parsed.data;
  const body = raw;

  const limiter = rateLimit(`helper:messages:${workspaceId}:${user.id}`, { windowMs: 15_000, max: 20 });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json(
        { ok: false, error: "rate_limited", resetAt: limiter.resetAt },
        { status: 429 }
      )
    );
  }

  // Budget check: verify workspace has not exceeded monthly cap
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";

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
      return withCookies(
        NextResponse.json(
          { ok: false, error: "budget_exceeded", message: "Monthly token budget exceeded" },
          { status: 403 }
        )
      );
    }
  }

  const { data: convo } = await db
    .from("helper_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (!convo) {
    return withCookies(NextResponse.json({ ok: false, error: "Conversation not found" }, { status: 404 }));
  }

  const { data: inserted, error } = await db
    .from("helper_messages")
    .insert({
      conversation_id: conversationId,
      workspace_id: workspaceId,
      role,
      content,
      metadata: body?.metadata ?? {},
    })
    .select("id, role, content, metadata, created_at")
    .maybeSingle();

  if (error || !inserted) {
    return withCookies(
      NextResponse.json({ ok: false, error: error?.message ?? "failed" }, { status: 500 })
    );
  }

  // Update conversation timestamp
  await db
    .from("helper_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("workspace_id", workspaceId);

  let assistantMessage: typeof inserted | null = null;

  if (role === "user") {
    try {
      const ai = await runHelperModel({ content, mode, provider });
      const { data: assistantRow } = await db
        .from("helper_messages")
        .insert({
          conversation_id: conversationId,
          workspace_id: workspaceId,
          role: "assistant",
          content: ai.text,
          metadata: { provider: ai.provider, mode },
        })
        .select("id, role, content, metadata, created_at")
        .maybeSingle();
      assistantMessage = assistantRow ?? null;

      await recordHelperUsage({
        workspaceId,
        tokensIn: ai.tokensIn,
        tokensOut: ai.tokensOut,
        provider: ai.provider,
      });
    } catch (err) {
      // Do not fail the user message if assistant generation fails
      const message = err instanceof Error ? err.message : "Assistant generation failed";
      await db.from("helper_messages").insert({
        conversation_id: conversationId,
        workspace_id: workspaceId,
        role: "assistant",
        content: "Assistant unavailable right now. Please try again.",
        metadata: { error: message },
      });
    }
  }

  return withCookies(
    NextResponse.json({
      ok: true,
      message: inserted,
      assistant: assistantMessage,
    })
  );
});
