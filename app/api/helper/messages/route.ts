import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace } from "@/lib/auth/guard";
import { runHelperModel } from "@/lib/helper/providers/router";
import { HelperMode, ProviderName } from "@/lib/helper/providers/types";
import { recordHelperUsage } from "@/lib/helper/usage";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId) {
    return withCookies(NextResponse.json({ ok: false, error: "conversationId required" }, { status: 400 }));
  }

  const db = supabaseAdmin();
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
}

export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, user, withCookies } = guard;

  const body = await req.json().catch(() => ({}));
  const conversationId = (body?.conversationId as string | undefined) ?? null;
  const content = (body?.content as string | undefined)?.trim() ?? "";
  const role = (body?.role as string | undefined)?.trim() || "user";
  const mode = (body?.mode as HelperMode | undefined) ?? "chat";
  const provider = (body?.provider as ProviderName | undefined) ?? "auto";

  if (!conversationId) {
    return withCookies(NextResponse.json({ ok: false, error: "conversationId required" }, { status: 400 }));
  }
  if (!content) {
    return withCookies(NextResponse.json({ ok: false, error: "content required" }, { status: 400 }));
  }

  const limiter = rateLimit(`helper:messages:${workspaceId}:${user.id}`, { windowMs: 15_000, max: 20 });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json(
        { ok: false, error: "rate_limited", resetAt: limiter.resetAt },
        { status: 429 }
      )
    );
  }

  const db = supabaseAdmin();

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
}
