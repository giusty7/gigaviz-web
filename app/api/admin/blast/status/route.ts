import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceRole } from "@/lib/supabase/workspace-role";

export const runtime = "nodejs";

type CampaignRow = {
  id: string;
  workspace_id: string;
  name: string;
  template_name: string;
  language: string;
  status: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export async function GET(req: NextRequest) {
  const auth = await requireWorkspaceRole(req, ["admin", "supervisor", "agent"]);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { searchParams } = req.nextUrl;
  const campaignId = searchParams.get("campaign_id") || "";

  if (campaignId) {
    const { data: campaign, error } = await db
      .from("campaigns")
      .select("id, workspace_id, name, template_name, language, status, created_at, started_at, finished_at")
      .eq("workspace_id", workspaceId)
      .eq("id", campaignId)
      .single();

    if (error || !campaign) {
      return withCookies(
        NextResponse.json({ error: error?.message || "campaign_not_found" }, { status: 404 })
      );
    }

    const [
      totalRes,
      queuedRes,
      processingRes,
      sentRes,
      failedRes,
    ] = await Promise.all([
      db.from("campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId),
      db.from("campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).eq("status", "queued"),
      db.from("campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).eq("status", "processing"),
      db.from("campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).eq("status", "sent"),
      db.from("campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).eq("status", "failed"),
    ]);

    const total = totalRes.count ?? 0;
    const queued = queuedRes.count ?? 0;
    const processing = processingRes.count ?? 0;
    const sent = sentRes.count ?? 0;
    const failed = failedRes.count ?? 0;

    const { data: errors } = await db
      .from("campaign_recipients")
      .select("to_phone, error_reason, attempted_at")
      .eq("campaign_id", campaignId)
      .eq("status", "failed")
      .order("attempted_at", { ascending: false })
      .limit(5);

    return withCookies(
      NextResponse.json({
        campaign,
        counts: { total, queued, processing, sent, failed },
        recentErrors: errors ?? [],
      })
    );
  }

  const { data: campaigns, error: listErr } = await db
    .from("campaigns")
    .select("id, workspace_id, name, template_name, language, status, created_at, started_at, finished_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (listErr) {
    return withCookies(
      NextResponse.json({ error: listErr.message }, { status: 500 })
    );
  }

  const rows = (campaigns ?? []) as CampaignRow[];
  const summaries = await Promise.all(
    rows.map(async (row) => {
      const [
        totalRes,
        queuedRes,
        processingRes,
        sentRes,
        failedRes,
      ] = await Promise.all([
        db.from("campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", row.id),
        db.from("campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", row.id).eq("status", "queued"),
        db.from("campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", row.id).eq("status", "processing"),
        db.from("campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", row.id).eq("status", "sent"),
        db.from("campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", row.id).eq("status", "failed"),
      ]);
      const total = totalRes.count ?? 0;
      const queued = queuedRes.count ?? 0;
      const processing = processingRes.count ?? 0;
      const sent = sentRes.count ?? 0;
      const failed = failedRes.count ?? 0;
      return {
        ...row,
        counts: { total, queued, processing, sent, failed },
      };
    })
  );

  return withCookies(NextResponse.json({ campaigns: summaries }));
}
