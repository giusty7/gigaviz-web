import { randomUUID } from "crypto";
import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { forbiddenResponse, requireWorkspaceMember, unauthorizedResponse } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

/**
 * Loose row type â€“ we use select('*') so columns may or may not exist yet.
 * All fields are optional to avoid runtime errors if DB schema is behind.
 */
type MessageRow = {
  id: string;
  thread_id?: string | null;
  direction?: string | null;
  text_body?: string | null;
  status?: string | null;
  status_at?: string | null;
  status_updated_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  failed_at?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  error_reason?: string | null;
  msg_type?: string | null;
  type?: string | null;
  payload_json?: Record<string, unknown> | null;
  wa_message_id?: string | null;
  wa_timestamp?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
  from_wa_id?: string | null;
  to_wa_id?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  media_mime_type?: string | null;
  media_filename?: string | null;
  media_size?: number | null;
};

export const GET = withErrorHandler(async (req: NextRequest) => {
  const requestId = randomUUID();
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const url = new URL(req.url);
  const rawThreadId = url.searchParams.get("threadId");
  const rawWorkspaceSlug = url.searchParams.get("workspaceSlug");
  const rawWorkspaceId = url.searchParams.get("workspaceId");

  const missing: string[] = [];
  if (!rawThreadId) missing.push("threadId");
  if (!rawWorkspaceSlug && !rawWorkspaceId) missing.push("workspaceSlug or workspaceId");

  const isDev = process.env.NODE_ENV !== "production";

  if (missing.length > 0) {
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          code: "bad_request",
          requestId,
          details: { missing },
        },
        { status: 400 }
      )
    );
  }

  const paramsSchema = z.object({
    threadId: z.string().uuid(),
    workspaceSlug: z.string().min(1).optional(),
    workspaceId: z.string().uuid().optional(),
  });

  const parsed = paramsSchema.safeParse({
    threadId: rawThreadId,
    workspaceSlug: rawWorkspaceSlug || undefined,
    workspaceId: rawWorkspaceId || undefined,
  });

  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          code: "bad_request",
          requestId,
          details: isDev ? { issues: parsed.error.flatten() } : { invalid: ["threadId"] },
        },
        { status: 400 }
      )
    );
  }

  const { threadId, workspaceSlug, workspaceId: providedWorkspaceId } = parsed.data;

  const adminDb = supabaseAdmin();
  let workspaceId = providedWorkspaceId ?? null;

  if (!workspaceId && workspaceSlug) {
    const { data: workspaceRow, error: workspaceError } = await adminDb
      .from("workspaces")
      .select("id, slug")
      .eq("slug", workspaceSlug)
      .maybeSingle();

    if (workspaceError) {
      logger.error("[wa-thread-messages] workspace lookup failed", { requestId, workspaceSlug, error: workspaceError });
      return withCookies(
        NextResponse.json(
          {
            ok: false,
            code: "db_error",
            requestId,
            details: { message: workspaceError.message, hint: workspaceError.hint, code: workspaceError.code },
          },
          { status: 500 }
        )
      );
    }

    if (!workspaceRow?.id) {
      return withCookies(
        NextResponse.json(
          {
            ok: false,
            code: "not_found",
            requestId,
            details: { message: "Workspace not found for slug" },
          },
          { status: 404 }
        )
      );
    }

    workspaceId = workspaceRow.id;
  }

  if (!workspaceId) {
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          code: "bad_request",
          requestId,
          details: { missing: ["workspaceSlug or workspaceId"] },
        },
        { status: 400 }
      )
    );
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok) {
    return forbiddenResponse(withCookies);
  }

  const { data: messages, error: messageError } = await adminDb
    .from("wa_messages")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (messageError) {
    logger.error("[wa-thread-messages] message list failed", { requestId, workspaceId, threadId, error: messageError });
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          code: "db_error",
          requestId,
          details: { message: messageError.message, hint: messageError.hint, code: messageError.code },
        },
        { status: 500 }
      )
    );
  }

  const waMessageIds = (messages ?? [])
    .map((m) => m.wa_message_id)
    .filter((id): id is string => Boolean(id));

  type StatusEvent = {
    external_message_id: string;
    status: string | null;
    payload_json: Record<string, unknown> | null;
    created_at: string;
  };

  const statusByWaId: Record<string, { status: string | null; updatedAt: string | null; errorReason: string | null }> = {};

  if (waMessageIds.length > 0) {
    const { data: statusEvents, error: statusError } = await adminDb
      .from("wa_message_status_events")
      .select("external_message_id, status, payload_json, created_at")
      .eq("workspace_id", workspaceId)
      .in("external_message_id", waMessageIds);

    if (statusError) {
      logger.error("[wa-thread-messages] status events failed", { requestId, workspaceId, threadId, error: statusError });
      return withCookies(
        NextResponse.json(
          {
            ok: false,
            code: "db_error",
            requestId,
            details: { message: statusError.message, hint: statusError.hint, code: statusError.code },
          },
          { status: 500 }
        )
      );
    }

    if (Array.isArray(statusEvents)) {
      for (const event of statusEvents as StatusEvent[]) {
        const key = event.external_message_id;
        const current = statusByWaId[key];
        const updatedAt = event.created_at;
        const errorReason = extractErrorReason(event.payload_json ?? {});

        if (!current || Date.parse(updatedAt) > Date.parse(current.updatedAt ?? "")) {
          statusByWaId[key] = {
            status: event.status ?? current?.status ?? null,
            updatedAt,
            errorReason: errorReason ?? current?.errorReason ?? null,
          };
        }
      }
    }
  }

  const { data: tags, error: tagsError } = await adminDb
    .from("wa_thread_tags")
    .select("tag")
    .eq("workspace_id", workspaceId)
    .eq("thread_id", threadId);

  if (tagsError) {
    logger.error("[wa-thread-messages] tags fetch failed", { requestId, workspaceId, threadId, error: tagsError });
    return withCookies(
      NextResponse.json(
        {
          ok: false,
          code: "db_error",
          requestId,
          details: { message: tagsError.message, hint: tagsError.hint, code: tagsError.code },
        },
        { status: 500 }
      )
    );
  }

  const { data: notes, error: notesError } = await adminDb
    .from("wa_thread_notes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (notesError) {
    // Log but don't fail - notes are not critical for message display
    logger.error("[wa-thread-messages] notes fetch failed", { requestId, workspaceId, threadId, error: notesError });
  }

  const normalizedMessages =
    messages?.map((m) => normalizeMessage(m as MessageRow, statusByWaId)) ?? [];

  // Sort deterministically: by computed status_updated_at desc, then created_at desc, then id desc
  normalizedMessages.sort((a, b) => {
    const aSortKey = toSortKey(a.status_updated_at ?? a.created_at);
    const bSortKey = toSortKey(b.status_updated_at ?? b.created_at);
    if (aSortKey !== bSortKey) return aSortKey - bSortKey; // ascending for chat order
    const aCreated = toSortKey(a.created_at);
    const bCreated = toSortKey(b.created_at);
    if (aCreated !== bCreated) return aCreated - bCreated;
    return a.id.localeCompare(b.id);
  });

  const session = computeSessionSummary(normalizedMessages);

  return withCookies(
    NextResponse.json({
      ok: true,
      requestId,
      count: normalizedMessages.length,
      messages: normalizedMessages,
      tags: tags?.map((t) => t.tag) ?? [],
      notes: notes ?? [],
      session,
    })
  );
});

function normalizeMessage(
  message: MessageRow,
  statusOverrides?: Record<string, { status: string | null; updatedAt: string | null; errorReason: string | null }>
) {
  const payload = message.payload_json ?? {};
  const textBody =
    message.text_body ??
    extractText(payload) ??
    "[non-text message]";

  // Derive mediaType from best available source
  const mediaType = message.media_type ?? message.msg_type ?? message.type ?? null;

  // Derive status with fallback for outbound messages
  const isOutbound = ["out", "outbound", "outgoing"].includes((message.direction ?? "").toLowerCase());
  let derivedStatus = message.wa_message_id
    ? statusOverrides?.[message.wa_message_id]?.status ?? message.status ?? null
    : message.status ?? null;
  // If no status but outbound with sent_at, infer 'sent'
  if (!derivedStatus && isOutbound && message.sent_at) {
    derivedStatus = "sent";
  }

  // Compute status_updated_at with full fallback chain
  const rawStatusUpdatedAt = message.wa_message_id
    ? statusOverrides?.[message.wa_message_id]?.updatedAt ?? message.status_updated_at ?? null
    : message.status_updated_at ?? null;
  const computedStatusUpdatedAt =
    rawStatusUpdatedAt ??
    message.status_at ??
    message.delivered_at ??
    message.read_at ??
    message.failed_at ??
    message.sent_at ??
    message.wa_timestamp ??
    message.created_at ??
    null;

  const fallbackError = message.error_message ?? message.error_reason ?? message.error_code ?? null;
  const errorReason = message.wa_message_id
    ? statusOverrides?.[message.wa_message_id]?.errorReason ?? fallbackError
    : fallbackError;

  return {
    id: message.id,
    thread_id: message.thread_id ?? null,
    direction: message.direction ?? "inbound",
    text_body: textBody,
    status: derivedStatus,
    status_at: message.status_at ?? null,
    status_updated_at: computedStatusUpdatedAt,
    delivered_at: message.delivered_at ?? null,
    read_at: message.read_at ?? null,
    failed_at: message.failed_at ?? null,
    error_code: message.error_code ?? null,
    error_message: message.error_message ?? null,
    error_reason: errorReason,
    msg_type: message.msg_type ?? null,
    payload_json: payload,
    content_json: payload,
    wa_message_id: message.wa_message_id ?? null,
    wa_timestamp: message.wa_timestamp ?? null,
    sent_at: message.sent_at ?? null,
    created_at: message.created_at ?? null,
    from_wa_id: message.from_wa_id ?? null,
    to_wa_id: message.to_wa_id ?? null,
    media_url: message.media_url ?? null,
    media_type: mediaType,
    media_mime_type: message.media_mime_type ?? null,
    media_filename: message.media_filename ?? null,
    media_size: message.media_size ?? null,
  };
}

function extractText(payload: Record<string, unknown>) {
  const p = payload as {
    text?: { body?: string };
    entry?: Array<{
      changes?: Array<{
        value?: { messages?: Array<{ text?: { body?: string } }> };
      }>;
    }>;
  };

  if (p.text?.body) return p.text.body;
  const nested =
    p.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;
  return nested ?? null;
}

function toSortKey(value?: string | null) {
  if (!value) return 0;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
}

function extractErrorReason(payload: Record<string, unknown> | null) {
  const p = payload as { errors?: Array<{ title?: string; message?: string }> };
  const firstError = p?.errors?.[0];
  return firstError?.message ?? firstError?.title ?? null;
}

function computeSessionSummary(messages: ReturnType<typeof normalizeMessage>[]) {
  let lastInboundAt: string | null = null;
  let lastOutboundAt: string | null = null;

  const setLatest = (current: string | null, candidate?: string | null) => {
    if (!candidate) return current;
    if (!current) return candidate;
    return Date.parse(candidate) > Date.parse(current) ? candidate : current;
  };

  for (const msg of messages) {
    const ts = msg.wa_timestamp ?? msg.sent_at ?? msg.created_at;
    if (!ts) continue;
    if (["in", "inbound"].includes(msg.direction)) {
      lastInboundAt = setLatest(lastInboundAt, ts);
    } else {
      lastOutboundAt = setLatest(lastOutboundAt, ts);
    }
  }

  const expiresAt = lastInboundAt
    ? new Date(Date.parse(lastInboundAt) + 24 * 60 * 60 * 1000).toISOString()
    : null;
  const remainingMs = expiresAt ? Date.parse(expiresAt) - Date.now() : null;
  const active = expiresAt ? Date.parse(expiresAt) > Date.now() : null;
  const state = lastInboundAt ? (active ? "active" : "expired") : "unknown";

  return {
    state,
    active,
    lastInboundAt,
    lastOutboundAt,
    expiresAt,
    remainingMinutes: remainingMs !== null ? Math.max(0, Math.floor(remainingMs / 60000)) : null,
  };
}
