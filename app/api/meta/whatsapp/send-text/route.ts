import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "node:crypto";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  forbiddenResponse,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
} from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimitDb } from "@/lib/rate-limit";
import { resolveConnectionForThread } from "@/lib/meta/wa-connections";
import { getWaSettings } from "@/lib/meta/wa-settings";

const schema = z.object({
  workspaceSlug: z.string().min(1),
  threadId: z.string().uuid(),
  text: z.string().min(1),
});

function hashText(text: string) {
  return createHash("sha256").update(text).digest("hex").slice(0, 12);
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

  const limiter = await rateLimitDb(`wa-send-text:${workspaceId}:${userData.user.id}`, {
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

  const sandbox = await getWaSettings(workspaceId);
  const toPhone = thread.contact_wa_id ?? thread.phone_number_id;
  if (sandbox.sandboxEnabled && toPhone && !sandbox.whitelist.includes(toPhone)) {
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

  const insertPayload = {
    workspace_id: workspaceId,
    thread_id: threadId,
    phone_number_id: resolvedConnection.phone_number_id,
    connection_id: resolvedConnection.id, // FK to wa_phone_numbers for deterministic routing
    wa_message_id: null as string | null,
    direction: "outbound",
    type: "text",
    msg_type: "text",
    status: "queued" as const,
    status_at: now,
    status_updated_at: now,
    delivered_at: null as string | null,
    read_at: null as string | null,
    failed_at: null as string | null,
    error_code: null as string | null,
    error_message: null as string | null,
    text_body: text,
    payload_json: { request: { to: thread.contact_wa_id ?? thread.phone_number_id, text } },
    wa_timestamp: now,
    created_at: now,
    sent_at: null as string | null,
    from_wa_id: resolvedConnection.phone_number_id,
    to_wa_id: thread.contact_wa_id ?? null,
  };

  try {
    const { data: insertedMessage, error: insertErr } = await db
      .from("wa_messages")
      .insert(insertPayload)
      .select("id, thread_id, direction, text_body, wa_timestamp, wa_message_id, status")
      .single();
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

    const toPhone = thread.contact_wa_id ?? thread.phone_number_id ?? "";
    const idempotencyKey = `wa-send-text:${workspaceId}:${threadId}:${hashText(text)}:${Math.floor(Date.now() / 30000)}`;

    const nextAttemptAt = new Date().toISOString();
    const { data: outboxInsert, error: outboxError } = await db
      .from("outbox_messages")
      .upsert(
        {
          workspace_id: workspaceId,
          thread_id: threadId,
          connection_id: resolvedConnection.id,
          to_phone: toPhone,
          message_type: "text",
          payload: {
            message_id: insertedMessage.id,
            text,
            phone_number_id: resolvedConnection.phone_number_id,
            connection_id: resolvedConnection.id,
          },
          idempotency_key: idempotencyKey,
          status: "queued",
          attempts: 0,
          next_run_at: nextAttemptAt,
          next_attempt_at: nextAttemptAt,
        },
        { onConflict: "idempotency_key" }
      )
      .select("id, status, next_attempt_at, last_error")
      .single();

    if (outboxError || !outboxInsert) {
      console.error("[send-text] outbox insert failed:", outboxError);
      return withCookies(
        NextResponse.json(
          {
            ok: false,
            error: "outbox_error",
            reason: "enqueue_failed",
            message: outboxError?.message ?? "Failed to enqueue message",
            details: outboxError?.details,
            hint: outboxError?.hint,
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

    // Record metric for dashboard
    try {
      const { incrementQuotaUsage, recordMetric } = await import("@/lib/quotas");
      await incrementQuotaUsage(workspaceId, "wa_messages_monthly", 1);
      await recordMetric(workspaceId, "wa_messages_sent", 1, { thread_id: threadId, queued: true });
    } catch {
      // Best effort
    }

    const responseMessage = insertedMessage
      ? { ...insertedMessage, outbox_id: outboxInsert.id, idempotency_key: idempotencyKey }
      : null;

    return withCookies(
      NextResponse.json({
        ok: true,
        status: "queued",
        queued: true,
        message: responseMessage ?? insertedMessage,
        outboxId: outboxInsert.id,
        idempotencyKey,
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
