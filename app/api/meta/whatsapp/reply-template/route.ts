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
import { logMetaAdminAudit } from "@/lib/meta/audit";

const schema = z.object({
  workspaceId: z.string().uuid(),
  threadId: z.string().uuid(),
  templateName: z.string().min(1),
  language: z.string().min(2),
  variables: z.array(z.string()).default([]),
});

export const runtime = "nodejs";

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

  const { workspaceId: bodyWorkspaceId, threadId, templateName, language, variables } = parsed.data;
  const workspaceId = getWorkspaceId(req, undefined, bodyWorkspaceId);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin", "member"])) {
    return forbiddenResponse(withCookies);
  }

  const limiter = rateLimit(`wa-reply:${workspaceId}:${userData.user.id}`, { windowMs: 60_000, max: 5 });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  const adminDb = supabaseAdmin();

  const { data: thread, error: threadError } = await adminDb
    .from("wa_threads")
    .select("id, contact_wa_id, phone_number_id")
    .eq("workspace_id", workspaceId)
    .eq("id", threadId)
    .maybeSingle();

  if (threadError || !thread) {
    return withCookies(
      NextResponse.json({ error: "not_found", reason: "thread_not_found" }, { status: 404 })
    );
  }

  if (!thread.contact_wa_id) {
    return withCookies(
      NextResponse.json({ error: "bad_request", reason: "contact_missing_phone" }, { status: 400 })
    );
  }

  const { data: template } = await adminDb
    .from("wa_templates")
    .select("name, language, status")
    .eq("workspace_id", workspaceId)
    .eq("name", templateName)
    .eq("language", language)
    .maybeSingle();

  if (!template) {
    return withCookies(
      NextResponse.json({ error: "not_found", reason: "template_not_found" }, { status: 404 })
    );
  }

  if (template.status && template.status.toUpperCase() !== "APPROVED") {
    return withCookies(
      NextResponse.json(
        { error: "forbidden", reason: "template_not_approved", status: template.status },
        { status: 403 }
      )
    );
  }

  const phoneNumberId = thread.phone_number_id;

  const { data: tokenRow } = await adminDb
    .from("meta_tokens")
    .select("token_encrypted")
    .eq("workspace_id", workspaceId)
    .eq("provider", "meta_whatsapp")
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (!phoneNumberId || !tokenRow?.token_encrypted) {
    return withCookies(
      NextResponse.json({ error: "bad_request", reason: "phone_or_token_missing" }, { status: 400 })
    );
  }

  const parameters = (variables || []).map((text) => ({ type: "text", text }));
  const payload = {
    messaging_product: "whatsapp",
    to: thread.contact_wa_id,
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
  let waResponse: Record<string, unknown> | null = null;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
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
    waResponse = (json as Record<string, unknown>) ?? {};
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
    action: "wa_reply_template",
    ok: success,
    detail: { threadId, template: templateName },
    error: success ? null : errorText,
  });

  if (!success) {
    return withCookies(
      NextResponse.json({ error: "send_failed", reason: errorText ?? "unknown" }, { status: 502 })
    );
  }

  const now = new Date().toISOString();
  const insertPayload = {
    workspace_id: workspaceId,
    thread_id: threadId,
    wa_message_id: messageId ?? null,
    direction: "outbound",
    type: "template",
    msg_type: "template",
    text_body: `Template: ${template.name}`,
    payload_json: { request: payload, response: waResponse ?? {} },
    created_at: now,
    sent_at: now,
    wa_timestamp: now,
    phone_number_id: phoneNumberId,
    from_wa_id: phoneNumberId,
    to_wa_id: thread.contact_wa_id ?? null,
  };

  const writeQuery = messageId
    ? adminDb
        .from("wa_messages")
        .upsert(insertPayload, { onConflict: "workspace_id,phone_number_id,wa_message_id" })
        .select("id, thread_id, direction, text_body, wa_timestamp, wa_message_id")
        .single()
    : adminDb
        .from("wa_messages")
        .insert(insertPayload)
        .select("id, thread_id, direction, text_body, wa_timestamp, wa_message_id")
        .single();

  const { data: insertedMessage, error: insertErr } = await writeQuery;
  if (insertErr) {
    return withCookies(
      NextResponse.json(
        {
          error: "db_error",
          reason: "insert_failed",
          message: insertErr.message,
          details: insertErr.details,
          hint: insertErr.hint,
        },
        { status: 500 }
      )
    );
  }

  await adminDb
    .from("wa_threads")
    .update({ last_message_at: now, last_message_preview: `Template: ${template.name}` })
    .eq("workspace_id", workspaceId)
    .eq("id", threadId);

  return withCookies(
    NextResponse.json({
      success: true,
      messageId,
      insertedMessage,
    })
  );
}
