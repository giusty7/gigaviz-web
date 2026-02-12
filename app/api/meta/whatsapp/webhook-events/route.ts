import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

/**
 * GET /api/meta/whatsapp/webhook-events
 * Query params:
 *   workspaceId (required)
 *   limit (optional, default 50, max 200)
 *   status (optional): "ok" | "failed" | "all"
 *   type (optional): filter by event_type
 *   from (optional): ISO date for lower bound
 *   to (optional): ISO date for upper bound
 *
 * Returns: { ok: boolean, events: [...], stats: { total24h, errors24h, lastEventAt } }
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  const url = new URL(req.url);

  const limitParam = url.searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam ?? "50", 10) || 50, 1), 200);
  const statusParam = url.searchParams.get("status") ?? "all";
  const typeParam = url.searchParams.get("type");
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const db = supabaseAdmin();

  // Build main query
  let query = db
    .from("meta_webhook_events")
    .select("id, channel, event_type, external_event_id, received_at, processed_at, error_text, payload_json")
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .order("received_at", { ascending: false })
    .limit(limit);

  if (statusParam === "ok") {
    query = query.is("error_text", null).not("processed_at", "is", null);
  } else if (statusParam === "failed") {
    query = query.not("error_text", "is", null);
  }
  if (typeParam) {
    query = query.eq("event_type", typeParam);
  }
  if (fromParam) {
    query = query.gte("received_at", fromParam);
  }
  if (toParam) {
    query = query.lte("received_at", toParam);
  }

  const { data: events, error: eventsErr } = await query;
  if (eventsErr) {
    return withCookies(
      NextResponse.json({ ok: false, error: eventsErr.message }, { status: 500 })
    );
  }

  // Compute stats for last 24h
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count: total24h } = await db
    .from("meta_webhook_events")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .gte("received_at", dayAgo);

  const { count: errors24h } = await db
    .from("meta_webhook_events")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .not("error_text", "is", null)
    .gte("received_at", dayAgo);

  const { data: lastRow } = await db
    .from("meta_webhook_events")
    .select("received_at")
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .order("received_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const stats = {
    total24h: total24h ?? 0,
    errors24h: errors24h ?? 0,
    lastEventAt: lastRow?.received_at ?? null,
  };

  return withCookies(NextResponse.json({ ok: true, events: events ?? [], stats }));
});
