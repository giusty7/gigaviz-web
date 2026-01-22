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
import { resolveConnectionForThread } from "@/lib/meta/wa-connections";
import { getWhatsappSandboxSettings } from "@/lib/meta/wa-settings";

const schema = z.object({
  workspaceSlug: z.string().min(1),
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

  const { workspaceSlug, threadId, text } = parsed.data;

  const db = supabaseAdmin();

  const { data: workspaceRow, error: workspaceError } = await db
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

  // Enforce plan gating and demo override
  const devEmails = (process.env.DEV_FULL_ACCESS_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const devOverride = devEmails.includes((userData.user.email || "").toLowerCase());

  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const planId = (subscription?.plan_id as string | null) ?? "free_locked";
  if (planId === "free_locked" && !devOverride) {
    return withCookies(
      NextResponse.json(
        {
          error: "write_disabled",
          reason: "plan_locked",
          message: "Upgrade plan or request demo override to send messages.",
        },
        { status: 403 }
      )
    );
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

  const { data: thread } = await db
    .from("wa_threads")
    .select("id, phone_number_id, contact_wa_id, connection_id")
    .eq("workspace_id", workspaceId)
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) {
    return withCookies(
      NextResponse.json({ error: "not_found", reason: "thread_not_found" }, { status: 404 })
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

  const now = new Date().toISOString();

  // Enforce WhatsApp 24h session window and opt-out handling
  const { data: lastInbound } = await db
    .from("wa_messages")
    .select("text_body, wa_timestamp, created_at")
    .eq("workspace_id", workspaceId)
    .eq("thread_id", threadId)
    .eq("direction", "inbound")
    .order("wa_timestamp", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastInboundAt = lastInbound?.wa_timestamp ?? lastInbound?.created_at;
  const lastInboundMs = lastInboundAt ? Date.parse(lastInboundAt) : null;
  const sessionActive = lastInboundMs ? Date.now() - lastInboundMs < 24 * 60 * 60 * 1000 : false;

  if (!sessionActive) {
    return withCookies(
      NextResponse.json(
        {
          error: "session_expired",
          reason: "outside_24h_window",
          lastInboundAt,
        },
        { status: 403 }
      )
    );
  }

  const inboundText = (lastInbound?.text_body ?? "").trim().toLowerCase();
  const optOutKeywords = ["stop", "unsubscribe", "cancel", "end", "quit"];
  const optedOut = inboundText
    ? optOutKeywords.some((kw) =>
        inboundText === kw || inboundText.startsWith(`${kw} `) || inboundText.includes(` ${kw} `)
      )
    : false;

  if (optedOut) {
    await db
      .from("wa_threads")
      .update({ status: "opt_out", updated_at: now })
      .eq("workspace_id", workspaceId)
      .eq("id", threadId);

    return withCookies(
      NextResponse.json(
        { error: "opt_out", reason: "recipient_opted_out", lastInboundAt },
        { status: 403 }
      )
    );
  }

  const sandbox = await getWhatsappSandboxSettings(workspaceId);
  const toPhone = thread.contact_wa_id ?? thread.phone_number_id;
  if (sandbox.sandboxEnabled && toPhone && !sandbox.whitelist.includes(toPhone)) {
    return withCookies(
      NextResponse.json(
        { error: "forbidden", reason: "not_whitelisted", whitelist: sandbox.whitelist },
        { status: 403 }
      )
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
      `https://graph.facebook.com/v20.0/${encodeURIComponent(resolvedConnection.phone_number_id!)}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resolvedToken}`,
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

  const statusValue = waMessageId ? "sent" : "pending";

  const insertPayload = {
    workspace_id: workspaceId,
    thread_id: threadId,
    phone_number_id: resolvedConnection.phone_number_id,
    connection_id: resolvedConnection.id, // FK to wa_phone_numbers for deterministic routing
    wa_message_id: waMessageId,
    direction: "outbound",
    type: "text",
    msg_type: "text",
    status: statusValue,
    status_at: now,
    status_updated_at: now,
    delivered_at: null as string | null,
    read_at: null as string | null,
    failed_at: null as string | null,
    error_code: null as string | null,
    error_message: null as string | null,
    text_body: text,
    payload_json: { request: requestPayload, response: waResponse ?? {} },
    wa_timestamp: now,
    created_at: now,
    sent_at: now,
    from_wa_id: resolvedConnection.phone_number_id,
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
        status: "pending",
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
