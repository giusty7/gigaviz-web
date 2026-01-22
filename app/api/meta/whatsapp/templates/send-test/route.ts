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
import { findConnectionById, getWorkspaceWhatsappConnectionOrThrow } from "@/lib/meta/wa-connections";
import { getWaSettings } from "@/lib/meta/wa-settings";
import { sendWhatsappMessage } from "@/lib/meta/wa-graph";

const schema = z.object({
  workspaceId: z.string().uuid(),
  connectionId: z.string().uuid().optional(),
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

  const {
    workspaceId: bodyWorkspaceId,
    connectionId,
    templateName,
    language,
    toPhone,
    variables,
  } = parsed.data;
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
  const sandbox = await getWaSettings(workspaceId);

  if (sandbox.sandboxEnabled && !sandbox.whitelist.includes(toPhone)) {
    return withCookies(
      NextResponse.json(
        {
          error: "sandbox_blocked",
          reason: "not_whitelisted",
          message: "Sandbox enabled. Add recipient to whitelist or disable sandbox.",
          whitelist: sandbox.whitelist,
        },
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

  if (connectionId) {
    const connection = await findConnectionById(adminDb, connectionId);
    if (connection.error || !connection.data) {
      return withCookies(
        NextResponse.json(
          { error: "not_found", reason: "connection_not_found" },
          { status: 404 }
        )
      );
    }
  }

  const connection = await getWorkspaceWhatsappConnectionOrThrow({
    workspaceId,
    connectionId: connectionId ?? null,
    requireActive: true,
  });

  if (!connection.ok) {
    return withCookies(
      NextResponse.json({ error: connection.code, reason: connection.message }, { status: 400 })
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

  const sendResult = await sendWhatsappMessage({
    phoneNumberId: connection.connection.phoneNumberId,
    token: connection.connection.token,
    payload,
  });

  if (sendResult.ok) {
    success = true;
    messageId = sendResult.messageId ?? null;
  } else {
    errorText = sendResult.errorMessage ?? "send_failed";
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
