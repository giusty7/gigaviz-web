import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  forbiddenResponse,
  getWorkspaceId,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logging";
import { logMetaAdminAudit } from "@/lib/meta/audit";

const schema = z.object({
  workspaceId: z.string().uuid(),
  templateName: z.string().min(1),
  language: z.string().min(2),
  toPhone: z.string().min(6),
  variables: z.array(z.string()).default([]),
});

export const runtime = "nodejs";

const ALLOW_PENDING = process.env.META_HUB_ALLOW_PENDING_TEST === "true";

export async function POST(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { workspaceId: bodyWorkspaceId, templateName, language, toPhone, variables } = parsed.data;
  const workspaceId = getWorkspaceId(req, undefined, bodyWorkspaceId);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const limiter = rateLimit(`wa-template-send-test:${workspaceId}:${userData.user.id}`, {
    windowMs: 60_000,
    max: 5,
  });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  const adminDb = supabaseAdmin();

  const { data: settings } = await adminDb
    .from("wa_settings")
    .select("sandbox_enabled, test_whitelist")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const whitelist: string[] = Array.isArray(settings?.test_whitelist)
    ? settings?.test_whitelist
    : [];
  const sandboxEnabled = settings?.sandbox_enabled !== false; // default true

  if (sandboxEnabled && !whitelist.includes(toPhone)) {
    return withCookies(
      NextResponse.json(
        { error: "forbidden", reason: "not_whitelisted", whitelist },
        { status: 403 }
      )
    );
  }

  const { data: template, error: tplError } = await adminDb
    .from("wa_templates")
    .select("name, language, status, components_json")
    .eq("workspace_id", workspaceId)
    .eq("name", templateName)
    .eq("language", language)
    .maybeSingle();

  if (tplError || !template) {
    return withCookies(
      NextResponse.json({ error: "not_found", reason: "template_not_found" }, { status: 404 })
    );
  }

  if (
    template.status &&
    template.status.toUpperCase() !== "APPROVED" &&
    !(ALLOW_PENDING && template.status.toUpperCase() === "PENDING")
  ) {
    return withCookies(
      NextResponse.json(
        { error: "forbidden", reason: "template_not_approved", status: template.status },
        { status: 403 }
      )
    );
  }

  const { data: phone } = await adminDb
    .from("wa_phone_numbers")
    .select("phone_number_id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (!phone?.phone_number_id) {
    return withCookies(
      NextResponse.json({ error: "bad_request", reason: "phone_not_found" }, { status: 400 })
    );
  }

  const { data: tokenRow } = await adminDb
    .from("meta_tokens")
    .select("token_encrypted")
    .eq("workspace_id", workspaceId)
    .eq("provider", "meta_whatsapp")
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (!tokenRow?.token_encrypted) {
    return withCookies(
      NextResponse.json({ error: "bad_request", reason: "token_missing" }, { status: 400 })
    );
  }

  // Build parameters (text only) from variables in order
  const parameters = (variables || []).map((value) => ({
    type: "text",
    text: value,
  }));

  const payload = {
    messaging_product: "whatsapp",
    to: toPhone,
    type: "template",
    template: {
      name: template.name,
      language: { code: template.language },
      components: [
        {
          type: "body",
          parameters,
        },
      ],
    },
  };

  let success = false;
  let messageId: string | null = null;
  let errorText: string | null = null;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phone.phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenRow.token_encrypted}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json().catch(() => null);
    if (res.ok) {
      success = true;
      messageId = json?.messages?.[0]?.id ?? null;
    } else {
      errorText = json?.error?.message ?? `send_failed_${res.status}`;
    }
  } catch (err) {
    errorText = err instanceof Error ? err.message : "unknown_error";
  }

  await logMetaAdminAudit({
    db: adminDb,
    workspaceId,
    userId: userData.user.id,
    action: "wa_template_send_test",
    ok: success,
    detail: { template: templateName, language, toPhone },
    error: success ? null : errorText,
  });

  if (!success) {
    return withCookies(
      NextResponse.json(
        { error: "send_failed", reason: errorText ?? "unknown" },
        { status: 502 }
      )
    );
  }

  // Optional log into meta_webhook_events for traceability
  const { error: logError } = await adminDb.from("meta_webhook_events").insert({
    workspace_id: workspaceId,
    channel: "whatsapp",
    object: "message",
    event_type: "test_template_send",
    external_event_id: messageId,
    payload_json: { to: toPhone, template: templateName, language },
    received_at: new Date().toISOString(),
  });
  if (logError) {
    logger.warn("[wa-template-send-test] logging failed", { message: logError.message });
  }

  return withCookies(
    NextResponse.json({
      success: true,
      messageId,
      to: toPhone,
    })
  );
}
