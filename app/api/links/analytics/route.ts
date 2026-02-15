import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace } from "@/lib/auth/guard";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

/** GET /api/links/analytics — click analytics for workspace's link pages */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const url = new URL(req.url);
  const pageId = url.searchParams.get("pageId");
  const days = Math.min(Number(url.searchParams.get("days")) || 30, 90);
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  // Total clicks per page
  let pagesQuery = db
    .from("link_clicks")
    .select("page_id, item_id, clicked_at, device_type, session_id")
    .eq("workspace_id", workspaceId)
    .gte("clicked_at", since)
    .order("clicked_at", { ascending: false })
    .limit(10000);

  if (pageId) {
    pagesQuery = pagesQuery.eq("page_id", pageId);
  }

  const { data: clicks, error } = await pagesQuery;
  if (error) {
    logger.error("links/analytics GET error", { error: error.message, workspaceId });
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  const allClicks = clicks ?? [];

  // Aggregate: total, by day, by device, by item
  const byDay: Record<string, number> = {};
  const byDevice: Record<string, number> = {};
  const byItem: Record<string, number> = {};
  const uniqueVisitors = new Set<string>();

  for (const c of allClicks) {
    // By day
    const day = (c.clicked_at as string).slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;

    // By device
    const device = (c.device_type as string) ?? "unknown";
    byDevice[device] = (byDevice[device] ?? 0) + 1;

    // By item
    const itemKey = c.item_id as string;
    byItem[itemKey] = (byItem[itemKey] ?? 0) + 1;

    // Unique visitors via session ID
    const sid = c.session_id as string | null;
    if (sid) uniqueVisitors.add(sid);
  }

  // Get item names for top items
  const topItemIds = Object.entries(byItem)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => id);

  let topItems: { item_id: string; title: string; clicks: number }[] = [];
  if (topItemIds.length > 0) {
    const { data: items } = await db
      .from("link_items")
      .select("id, title")
      .in("id", topItemIds);

    topItems = topItemIds.map((id) => {
      const item = items?.find((i: { id: string }) => i.id === id);
      return { item_id: id, title: item?.title ?? "Unknown", clicks: byItem[id] };
    });
  }

  return withCookies(
    NextResponse.json({
      ok: true,
      analytics: {
        total_clicks: allClicks.length,
        unique_visitors: uniqueVisitors.size,
        period_days: days,
        clicks_by_day: Object.entries(byDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, clicks]) => ({ date, clicks })),
        devices: Object.entries(byDevice).map(([device_type, count]) => ({ device_type, count })),
        top_items: topItems,
      },
    })
  );
});
