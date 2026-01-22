import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  forbiddenResponse,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
} from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { logMetaAdminAudit } from "@/lib/meta/audit";
import { resolveConnectionForThread } from "@/lib/meta/wa-connections";
import { getWhatsappSandboxSettings } from "@/lib/meta/wa-settings";

const schema = z.object({
  workspaceSlug: z.string().min(1),
  threadId: z.string().uuid(),
  templateName: z.string().min(1),
  language: z.string().min(2),
  variables: z.array(z.string()).default([]),
});

const placeholderRegex = /{{\s*(\d+)\s*}}/g;

function countPlaceholders(body?: string | null) {
  if (!body) return 0;
  const regex = new RegExp(placeholderRegex.source, "g");
  const matches = Array.from(body.matchAll(regex));
  if (!matches.length) return 0;
  return matches.reduce((max, match) => {
    const idx = Number(match[1]);
    return Number.isFinite(idx) ? Math.max(max, idx) : max;
  }, 0);
}

function renderTemplateBody(body: string | null | undefined, variables: string[]) {
  if (!body) return "";
  const regex = new RegExp(placeholderRegex.source, "g");
  return body.replace(regex, (_, rawIdx) => {
    const idx = Number(rawIdx) - 1;
    const value = variables[idx];
    return typeof value === "string" && value.trim().length > 0 ? value : `{{${rawIdx}}}`;
  });
}

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

  const { workspaceSlug, threadId, templateName, language, variables } = parsed.data;

  const adminDb = supabaseAdmin();

  const { data: workspaceRow, error: workspaceError } = await adminDb
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (workspaceError) {
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: "workspace_lookup_failed", message: workspaceError.message },
        { status: 500 }
      )
    );
  }

  if (!workspaceRow?.id) {
    return withCookies(NextResponse.json({ error: "not_found", reason: "workspace_not_found" }, { status: 404 }));
  }

  const workspaceId = workspaceRow.id;

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
    .select("name, language, status, body")
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

  // Resolve connection deterministically from thread.connection_id
  const connectionResult = await resolveConnectionForThread(threadId, workspaceId);
  if (!connectionResult.ok || !connectionResult.connection || !connectionResult.token) {
    return withCookies(
      NextResponse.json(
        {
          error: connectionResult.code ?? "connection_error",
          reason: connectionResult.error ?? "No connection for thread",
        },
        { status: 409 }
      )
    );
  }

  const resolvedConnection = connectionResult.connection;
  const resolvedToken = connectionResult.token;

  const sandbox = await getWhatsappSandboxSettings(workspaceId);
  if (sandbox.sandboxEnabled && !sandbox.whitelist.includes(thread.contact_wa_id)) {
    return withCookies(
      NextResponse.json(
        { error: "forbidden", reason: "not_whitelisted", whitelist: sandbox.whitelist },
        { status: 403 }
      )
    );
  }

  const cleanedVars = (variables || []).map((text) => text.trim());
  const placeholderCount = countPlaceholders(template.body);
  const missingRequired = placeholderCount > 0 && cleanedVars.slice(0, placeholderCount).some((v) => !v);

  if (missingRequired) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "missing_template_variables", placeholderCount },
        { status: 400 }
      )
    );
  }

  const parameters = cleanedVars
    .slice(0, Math.max(placeholderCount, cleanedVars.length))
    .map((text) => ({ type: "text", text }));
  const renderedText = renderTemplateBody(template.body, cleanedVars);
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
      `https://graph.facebook.com/v19.0/${resolvedConnection.phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resolvedToken}`,
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
  const statusValue = messageId ? "sent" : "pending";

  const insertPayload = {
    workspace_id: workspaceId,
    thread_id: threadId,
    wa_message_id: messageId ?? null,
    direction: "outbound",
    type: "template",
    msg_type: "template",
    status: statusValue,
    status_at: now,
    status_updated_at: now,
    delivered_at: null as string | null,
    read_at: null as string | null,
    failed_at: null as string | null,
    error_code: null as string | null,
    error_message: null as string | null,
    text_body: renderedText || `Template: ${template.name}`,
    payload_json: { request: payload, response: waResponse ?? {}, template_variables: cleanedVars, rendered_text: renderedText },
    created_at: now,
    sent_at: now,
    wa_timestamp: now,
    phone_number_id: resolvedConnection.phone_number_id,
    connection_id: resolvedConnection.id, // FK to wa_phone_numbers for deterministic routing
    from_wa_id: resolvedConnection.phone_number_id,
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
