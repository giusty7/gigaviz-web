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

const schema = z.object({
  workspaceId: z.string().uuid(),
  threadId: z.string().uuid(),
  text: z.string().min(1),
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

  const { workspaceId: bodyWorkspaceId, threadId, text } = parsed.data;
  const workspaceId = getWorkspaceId(req, undefined, bodyWorkspaceId);
  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin", "member"])) {
    return forbiddenResponse(withCookies);
  }

  const limiter = rateLimit(`wa-send-text:${workspaceId}:${userData.user.id}`, {
    windowMs: 60_000,
    max: 10,
  });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  const db = supabaseAdmin();
  const { data: thread } = await db
    .from("wa_threads")
    .select("id, phone_number_id, contact_wa_id")
    .eq("workspace_id", workspaceId)
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) {
    return withCookies(
      NextResponse.json({ error: "not_found", reason: "thread_not_found" }, { status: 404 })
    );
  }

  const now = new Date().toISOString();
  const phoneNumberId = thread.phone_number_id || process.env.WA_PHONE_NUMBER_ID || "unknown";

  const accessToken = process.env.WA_ACCESS_TOKEN;
  if (!accessToken) {
    return withCookies(
      NextResponse.json({ error: "server_error", reason: "wa_token_missing" }, { status: 500 })
    );
  }

  let waMessageId: string | null = null;
  let waResponse: Record<string, unknown> | null = null;
  const requestPayload = {
    messaging_product: "whatsapp",
    to: thread.contact_wa_id ?? thread.phone_number_id,
    type: "text",
    text: { body: text },
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestPayload),
      }
    );

    const payload = await res.json().catch(() => ({}));
    waResponse = payload as Record<string, unknown>;
    if (!res.ok) {
      return withCookies(
        NextResponse.json(
          {
            error: "wa_send_failed",
            reason: payload?.error?.message ?? "Graph API error",
            details: payload?.error ?? null,
          },
          { status: 502 }
        )
      );
    }
    waMessageId = payload?.messages?.[0]?.id ?? null;
  } catch (err) {
    return withCookies(
      NextResponse.json(
        {
          error: "wa_send_failed",
          reason: err instanceof Error ? err.message : "unknown_error",
        },
        { status: 502 }
      )
    );
  }

  const insertPayload = {
    workspace_id: workspaceId,
    thread_id: threadId,
    phone_number_id: phoneNumberId,
    wa_message_id: waMessageId,
    direction: "outbound",
    type: "text",
    msg_type: "text",
    text_body: text,
    payload_json: { request: requestPayload, response: waResponse ?? {} },
    wa_timestamp: now,
    created_at: now,
    sent_at: now,
    from_wa_id: phoneNumberId,
    to_wa_id: thread.contact_wa_id ?? null,
  };

  try {
    const writeQuery = waMessageId
      ? db
          .from("wa_messages")
          .upsert(insertPayload, {
            onConflict: "workspace_id,phone_number_id,wa_message_id",
          })
          .select("id, thread_id, direction, text_body, wa_timestamp, wa_message_id")
          .single()
      : db
          .from("wa_messages")
          .insert(insertPayload)
          .select("id, thread_id, direction, text_body, wa_timestamp, wa_message_id")
          .single();

    const { data: insertedMessage, error: insertErr } = await writeQuery;
    if (insertErr) {
      return withCookies(
        NextResponse.json(
          {
            ok: false,
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

    await db
      .from("wa_threads")
      .update({
        last_message_at: now,
        last_message_preview: text.slice(0, 160),
        updated_at: now,
      })
      .eq("workspace_id", workspaceId)
      .eq("id", threadId);

    return withCookies(
      NextResponse.json({
        ok: true,
        status: "sent",
        waMessageId,
        insertedMessage,
      })
    );
  } catch (err) {
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          error: "db_error",
          reason: "insert_failed",
          message: err instanceof Error ? err.message : "unknown",
        },
        { status: 500 }
      )
    );
  }
}
