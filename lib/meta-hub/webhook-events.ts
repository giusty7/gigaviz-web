import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export type WebhookEventRow = {
  id: string;
  channel: string | null;
  event_type: string | null;
  external_event_id?: string | null;
  received_at: string | null;
  processed_at?: string | null;
  error_text?: string | null;
  payload_json?: unknown;
};

export type WebhookEvent = {
  id: string;
  channel: string;
  event_type: string;
  external_event_id: string | null;
  received_at: string | null;
  processed_at: string | null;
  error_text: string | null;
  payload_json: Record<string, unknown>;
};

export type WebhookEventSummary = {
  events: WebhookEvent[];
  total24h: number;
  errors24h: number;
  lastEventAt: string | null;
  source: "meta" | "legacy";
};

type FetchOptions = {
  workspaceId: string;
  limit?: number;
  channel?: string | null;
  includeLegacy?: boolean;
  fallbackChannel?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeWebhookEvent(row: WebhookEventRow, fallbackChannel: string): WebhookEvent {
  return {
    id: row.id,
    channel: row.channel ?? fallbackChannel,
    event_type: row.event_type ?? "unknown",
    external_event_id: row.external_event_id ?? null,
    received_at: row.received_at ?? null,
    processed_at: row.processed_at ?? null,
    error_text: row.error_text ?? null,
    payload_json:
      typeof row.payload_json === "object" && row.payload_json !== null
        ? (row.payload_json as Record<string, unknown>)
        : {},
  };
}

async function fetchMetaEvents(opts: FetchOptions, now: Date) {
  const db = supabaseAdmin();
  const dayAgo = new Date(now.getTime() - DAY_MS).toISOString();
  const baseMetaQuery = db
    .from("meta_webhook_events")
    .select(
      "id, channel, event_type, external_event_id, received_at, processed_at, error_text, payload_json"
    )
    .eq("workspace_id", opts.workspaceId);
  const eventsQuery = opts.channel ? baseMetaQuery.eq("channel", opts.channel) : baseMetaQuery;

  const { data: events } = await eventsQuery
    .order("received_at", { ascending: false })
    .limit(opts.limit ?? 25);

  const fallbackChannel = opts.fallbackChannel ?? "unknown";
  const normalizedEvents = (events ?? []).map((e) => normalizeWebhookEvent(e as WebhookEventRow, fallbackChannel));

  const baseCountsQuery = opts.channel
    ? db
        .from("meta_webhook_events")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", opts.workspaceId)
        .eq("channel", opts.channel)
    : db
        .from("meta_webhook_events")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", opts.workspaceId);

  const { count: total24h } = await baseCountsQuery.gte("received_at", dayAgo);

  const errorsCountsQuery = opts.channel
    ? db
        .from("meta_webhook_events")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", opts.workspaceId)
        .eq("channel", opts.channel)
    : db
        .from("meta_webhook_events")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", opts.workspaceId);

  const { count: errors24h } = await errorsCountsQuery
    .not("error_text", "is", null)
    .gte("received_at", dayAgo);

  const lastQuery = db
    .from("meta_webhook_events")
    .select("received_at")
    .eq("workspace_id", opts.workspaceId);

  const { data: last } = await (opts.channel ? lastQuery.eq("channel", opts.channel) : lastQuery)
    .order("received_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    events: normalizedEvents,
    total24h: total24h ?? 0,
    errors24h: errors24h ?? 0,
    lastEventAt: last?.received_at ?? null,
    source: "meta" as const,
  };
}

async function fetchLegacyEvents(opts: FetchOptions, now: Date) {
  const db = supabaseAdmin();
  const dayAgo = new Date(now.getTime() - DAY_MS).toISOString();
  const baseLegacyQuery = db
    .from("wa_webhook_events")
    .select("id, channel, event_type, received_at, payload_json")
    .eq("workspace_id", opts.workspaceId);
  const eventsQuery = opts.channel ? baseLegacyQuery.eq("channel", opts.channel) : baseLegacyQuery;

  const { data: events } = await eventsQuery
    .order("received_at", { ascending: false })
    .limit(opts.limit ?? 25);

  const baseLegacyCountQuery = opts.channel
    ? db
        .from("wa_webhook_events")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", opts.workspaceId)
        .eq("channel", opts.channel)
    : db
        .from("wa_webhook_events")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", opts.workspaceId);

  const { count: total24h } = await baseLegacyCountQuery.gte("received_at", dayAgo);

  const lastLegacyQuery = db
    .from("wa_webhook_events")
    .select("received_at")
    .eq("workspace_id", opts.workspaceId);

  const { data: last } = await (opts.channel
    ? lastLegacyQuery.eq("channel", opts.channel)
    : lastLegacyQuery)
    .order("received_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const fallbackChannel = opts.fallbackChannel ?? "unknown";
  const mapped = (events ?? []).map((e) =>
    normalizeWebhookEvent(
      {
        id: e.id,
        channel: (e as { channel?: string | null }).channel ?? null,
        event_type: e.event_type ?? null,
        external_event_id: null,
        received_at: e.received_at ?? null,
        processed_at: null,
        error_text: null,
        payload_json: (e as { payload_json?: unknown }).payload_json ?? null,
      },
      fallbackChannel
    )
  );

  return {
    events: mapped,
    total24h: total24h ?? 0,
    errors24h: 0,
    lastEventAt: last?.received_at ?? null,
    source: "legacy" as const,
  };
}

export async function getWebhookEventsSummary(opts: FetchOptions): Promise<WebhookEventSummary> {
  const now = new Date();
  const meta = await fetchMetaEvents(opts, now);
  if (meta.events.length > 0 || !opts.includeLegacy) {
    return meta;
  }
  return fetchLegacyEvents(opts, now);
}

/* ═══════════════════════════════════════════════════════════════════════════
   EVENT STATS BREAKDOWN - Sent / Delivered / Read / Failed (last 24h)
   ═══════════════════════════════════════════════════════════════════════════ */

export type EventStatsBreakdown = {
  messageSent: number;
  messageDelivered: number;
  messageRead: number;
  messageFailed: number;
};

/**
 * Queries meta_webhook_events for status breakdown by extracting
 * status values from the event payloads stored with event_type = "messages"
 * and the statuses array within the payload.
 */
export async function getEventStatsBreakdown(workspaceId: string): Promise<EventStatsBreakdown> {
  const db = supabaseAdmin();
  const dayAgo = new Date(Date.now() - DAY_MS).toISOString();

  // Query meta_webhook_events for events in the last 24h
  const { data: events } = await db
    .from("meta_webhook_events")
    .select("payload_json")
    .eq("workspace_id", workspaceId)
    .gte("received_at", dayAgo);

  const result: EventStatsBreakdown = {
    messageSent: 0,
    messageDelivered: 0,
    messageRead: 0,
    messageFailed: 0,
  };

  if (!events || events.length === 0) return result;

  for (const row of events) {
    const payload = row.payload_json as Record<string, unknown> | null;
    if (!payload) continue;

    // Extract statuses from the WhatsApp webhook payload structure
    type WaChange = { value?: { statuses?: Array<{ status?: string }>; messages?: unknown[] } };
    type WaEntry = { changes?: WaChange[] };
    const entry = (payload as { entry?: WaEntry[] })?.entry;
    const changeValue = entry?.[0]?.changes?.[0]?.value;
    const statuses = changeValue?.statuses;
    if (Array.isArray(statuses)) {
      for (const s of statuses) {
        const status = (s as { status?: string })?.status;
        if (status === "sent") result.messageSent++;
        else if (status === "delivered") result.messageDelivered++;
        else if (status === "read") result.messageRead++;
        else if (status === "failed") result.messageFailed++;
      }
    }

    // Count incoming messages as "received/sent" from the platform's perspective
    const incomingMessages = changeValue?.messages;
    if (Array.isArray(incomingMessages) && incomingMessages.length > 0) {
      // Incoming messages count as delivered to platform
      result.messageDelivered += incomingMessages.length;
    }
  }

  return result;
}
