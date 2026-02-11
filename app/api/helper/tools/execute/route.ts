import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { getHelperSettings } from "@/lib/helper/settings";
import { insertToolRun, isIntentAllowed, signN8nPayload } from "@/lib/helper/tools";
import { rateLimit } from "@/lib/rate-limit";

const executeSchema = z.object({
  workspace_slug: z.string().trim().min(1, "workspace_slug required"),
  conversation_id: z.string().optional(),
  intent: z.string().trim().min(1, "intent required"),
  params: z.record(z.string(), z.unknown()).optional().default({}),
  correlation_id: z.string().optional(),
  idempotency_key: z.string().optional(),
  requested_by: z.enum(["user", "assistant"]).optional().default("user"),
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, user, withCookies, supabase: db } = guard;

  const raw = guard.body ?? await req.json().catch(() => ({}));
  const parsed = executeSchema.safeParse(raw);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { ok: false, error: "validation_error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    );
  }
  const body = parsed.data;

  // Resolve workspace slug to get the slug for payload
  const { data: workspace } = await db
    .from("workspaces")
    .select("id, slug")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace) {
    return withCookies(NextResponse.json({ ok: false, error: "workspace not found" }, { status: 404 }));
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
    conversation_id: body.conversation_id,
    intent: body.intent,
    params: body.params,
    correlation_id: body.correlation_id ?? crypto.randomUUID(),
    idempotency_key: body.idempotency_key ?? crypto.randomUUID(),
    requested_by: body.requested_by,
  } as const;
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
