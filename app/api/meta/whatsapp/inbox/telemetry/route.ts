import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const TELEMETRY_LOOKBACK_HOURS = 24;
const DEFAULT_SLA_HOURS = Number(process.env.NEXT_PUBLIC_INBOX_SLA_HOURS ?? 24);

type MessageRow = {
  id: string;
  thread_id: string;
  direction: string | null;
  msg_type?: string | null;
  payload_json?: Record<string, unknown> | null;
  wa_timestamp?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
};

type ThroughputBucket = {
  hour: string;
  count: number;
};

export const GET = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  const db = supabaseAdmin();

  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const lookbackStart = new Date(now.getTime() - TELEMETRY_LOOKBACK_HOURS * 60 * 60 * 1000);

  // Incoming today (inbound directions only)
  const { count: inboundTodayCount } = await db
    .from("wa_messages")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .in("direction", ["in", "inbound"])
    .gte("created_at", startOfDay.toISOString());

  // Recent messages for response/automation/throughput calculations
  const { data: recentMessages, error: recentError } = await db
    .from("wa_messages")
    .select("id, thread_id, direction, msg_type, payload_json, wa_timestamp, sent_at, created_at")
    .eq("workspace_id", workspaceId)
    .gte("created_at", lookbackStart.toISOString())
    .limit(5000);

  if (recentError) {
    return withCookies(
      NextResponse.json(
        { ok: false, error: "db_error", reason: "message_stats_failed" },
        { status: 500 }
      )
    );
  }

  const normalized = (recentMessages ?? [])
    .map((m) => ({
      ...m,
      ts: toTimestamp(m),
      direction: (m.direction ?? "").toLowerCase(),
    }))
    .filter((m) => m.ts !== null) as Array<MessageRow & { ts: number; direction: string }>;

  const responseMs = computeAverageResponse(normalized);
  const automationRate = computeAutomationRate(normalized);
  const throughput = computeThroughput(normalized);

  return withCookies(
    NextResponse.json({
      ok: true,
      incomingToday: inboundTodayCount ?? 0,
      avgResponseMs: responseMs,
      automationRate,
      throughput,
      slaHours: DEFAULT_SLA_HOURS,
      generatedAt: now.toISOString(),
    })
  );
});

function toTimestamp(message: MessageRow) {
  const ts =
    message.wa_timestamp ??
    message.sent_at ??
    message.created_at;
  if (!ts) return null;
  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? null : parsed;
}

function computeAverageResponse(messages: Array<MessageRow & { ts: number; direction: string }>) {
  const byThread = new Map<string, Array<MessageRow & { ts: number; direction: string }>>();
  messages.forEach((m) => {
    const list = byThread.get(m.thread_id) ?? [];
    list.push(m);
    byThread.set(m.thread_id, list);
  });

  const diffs: number[] = [];
  byThread.forEach((threadMessages) => {
    threadMessages.sort((a, b) => a.ts - b.ts);
    let lastInbound: number | null = null;

    for (const m of threadMessages) {
      if (m.direction === "in" || m.direction === "inbound") {
        lastInbound = m.ts;
      } else if ((m.direction === "out" || m.direction === "outbound" || m.direction === "outgoing") && lastInbound) {
        const diff = m.ts - lastInbound;
        if (diff >= 0) diffs.push(diff);
        lastInbound = null;
      }
    }
  });

  if (!diffs.length) return null;
  const avg = diffs.reduce((sum, d) => sum + d, 0) / diffs.length;
  return Math.round(avg);
}

function computeAutomationRate(messages: Array<MessageRow & { ts: number; direction: string }>) {
  const outbound = messages.filter((m) => m.direction === "out" || m.direction === "outbound" || m.direction === "outgoing");
  if (!outbound.length) return 0;

  const automated = outbound.filter((m) => {
    const payload = (m.payload_json ?? {}) as Record<string, unknown>;
    const source = typeof payload.source === "string" ? payload.source.toLowerCase() : "";
    const automationFlag =
      payload.automation === true ||
      payload.ai === true ||
      source === "automation" ||
      source === "flow" ||
      source === "bot";
    const isTemplate = (m.msg_type ?? "").toLowerCase() === "template";
    return automationFlag || isTemplate;
  });

  return Math.round((automated.length / outbound.length) * 100);
}

function computeThroughput(messages: Array<MessageRow & { ts: number; direction: string }>): ThroughputBucket[] {
  const buckets = new Map<number, number>();
  messages.forEach((m) => {
    const hourStart = Math.floor(m.ts / (60 * 60 * 1000)) * 60 * 60 * 1000;
    buckets.set(hourStart, (buckets.get(hourStart) ?? 0) + 1);
  });

  return Array.from(buckets.entries())
    .map(([hourMs, count]) => ({
      hour: new Date(hourMs).toISOString(),
      count,
    }))
    .sort((a, b) => Date.parse(a.hour) - Date.parse(b.hour));
}
