import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { forbiddenResponse, requireUser, requireWorkspaceMember } from "@/lib/auth/guard";
import { getHelperSettings } from "@/lib/helper/settings";
import { insertToolRun, isIntentAllowed, signN8nPayload } from "@/lib/helper/tools";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const userRes = await requireUser(req);
  if (!userRes.ok) return userRes.response;
  const { user, withCookies } = userRes;
  const body = await req.json().catch(() => ({}));

  const workspaceSlug = (body?.workspace_slug as string | undefined)?.trim();
  if (!workspaceSlug) {
    return withCookies(NextResponse.json({ ok: false, error: "workspace_slug required" }, { status: 400 }));
  }

  const db = supabaseAdmin();
  const { data: workspace } = await db
    .from("workspaces")
    .select("id, slug")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (!workspace) {
    return withCookies(NextResponse.json({ ok: false, error: "workspace not found" }, { status: 404 }));
  }

  const membership = await requireWorkspaceMember(user.id, workspace.id);
  if (!membership.ok) {
    return withCookies(forbiddenResponse(withCookies));
  }

  const settings = await getHelperSettings(workspace.id);
  if (!settings.allow_automation) {
    return withCookies(
      NextResponse.json({ ok: false, error: "automation_disabled" }, { status: 403 })
    );
  }

  const limiter = rateLimit(`helper:tools:${workspace.id}:${user.id}`, { windowMs: 60_000, max: 10 });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json(
        { ok: false, error: "rate_limited", resetAt: limiter.resetAt },
        { status: 429 }
      )
    );
  }

  const payload = {
    workspace_slug: workspace.slug,
    workspace_id: workspace.id,
    conversation_id: body?.conversation_id as string | undefined,
    intent: (body?.intent as string | undefined)?.trim() ?? "",
    params: (body?.params as Record<string, unknown> | undefined) ?? {},
    correlation_id: (body?.correlation_id as string | undefined) ?? crypto.randomUUID(),
    idempotency_key: (body?.idempotency_key as string | undefined) ?? crypto.randomUUID(),
    requested_by: (body?.requested_by as "user" | "assistant" | undefined) ?? "user",
  } as const;

  if (!payload.intent) {
    return withCookies(NextResponse.json({ ok: false, error: "intent required" }, { status: 400 }));
  }
  if (!isIntentAllowed(payload.intent)) {
    return withCookies(NextResponse.json({ ok: false, error: "intent_not_allowed" }, { status: 400 }));
  }

  const runId = await insertToolRun({
    workspaceId: workspace.id,
    conversationId: payload.conversation_id,
    intent: payload.intent,
    params: payload.params,
    status: "queued",
    correlationId: payload.correlation_id,
    idempotencyKey: payload.idempotency_key,
  });

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const sharedSecret = process.env.N8N_SHARED_SECRET;

  let result: Record<string, unknown> | null = null;
  let error: Record<string, unknown> | null = null;
  let status: "queued" | "running" | "success" | "error" = "queued";

  if (webhookUrl) {
    status = "running";
    try {
      const signature = sharedSecret ? signN8nPayload(sharedSecret, payload) : undefined;
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gv-workspace-id": workspace.id,
          "x-gv-workspace-slug": workspace.slug,
          ...(signature ? { "x-gv-signature": signature } : {}),
        },
        body: JSON.stringify(payload),
      });
      status = "success";
      result = { forwarded: true };
    } catch (err) {
      status = "error";
      error = { message: err instanceof Error ? err.message : "webhook_failed" };
    }
  } else {
    // Local mock runner
    status = "success";
    result = {
      message: `Intent ${payload.intent} accepted (mock runner)`,
      params: payload.params,
    };
  }

  await insertToolRun({
    workspaceId: workspace.id,
    conversationId: payload.conversation_id,
    intent: payload.intent,
    params: payload.params,
    status,
    correlationId: payload.correlation_id,
    idempotencyKey: payload.idempotency_key,
    result,
    error,
  });

  return withCookies(
    NextResponse.json({
      ok: status === "success",
      status,
      result,
      error,
      audit_ref: runId,
    })
  );
}
