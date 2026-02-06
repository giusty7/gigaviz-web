import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { metaGraphFetch } from "@/lib/meta/graph";
import { resolveWorkspaceMetaToken } from "@/lib/meta/token";

/* ═══════════════════════════════════════════════════════════════════════════
   BUSINESS INTELLIGENCE - Real Meta Business Manager Data
   Fetches real data for the Business Asset Vault on the Connections page
   ═══════════════════════════════════════════════════════════════════════════ */

export type BusinessIntelligence = {
  businessManagerId: string | null;
  businessName: string | null;
  verificationStatus: "verified" | "pending" | "not_verified" | null;
  linkedAssets: {
    facebookPages: number | null;
    instagramAccounts: number | null;
    systemUsers: number | null;
  } | null;
};

/**
 * Fetches business intelligence data for a workspace:
 * 1. Gets the first business from /me/businesses using workspace token
 * 2. For each business, fetches linked assets (pages, IG accounts, system users)
 * 3. Gets verification status
 * 
 * Returns null-safe structure (never throws).
 */
export async function getBusinessIntelligence(
  workspaceId: string
): Promise<BusinessIntelligence> {
  const empty: BusinessIntelligence = {
    businessManagerId: null,
    businessName: null,
    verificationStatus: null,
    linkedAssets: null,
  };

  try {
    // Resolve the Meta access token for this workspace
    const tokenResult = await resolveWorkspaceMetaToken(workspaceId);
    if (!tokenResult?.token) {
      return empty;
    }

    const accessToken = tokenResult.token;

    // Fetch businesses linked to this token
    const businessesResp = await metaGraphFetch<{
      data?: Array<{
        id?: string;
        name?: string;
        verification_status?: string;
      }>;
    }>("me/businesses", accessToken, {
      query: { fields: "id,name,verification_status" },
    });

    const businesses = businessesResp?.data ?? [];
    if (businesses.length === 0) {
      return empty;
    }

    // Use the first business (auto-select when only one exists)
    const biz = businesses[0];
    const bizId = biz?.id;
    if (!bizId) return empty;

    // Map Meta's verification_status to our enum
    const rawVerification = biz.verification_status?.toLowerCase();
    let verificationStatus: BusinessIntelligence["verificationStatus"] = null;
    if (rawVerification === "verified") verificationStatus = "verified";
    else if (rawVerification === "pending" || rawVerification === "pending_need_more_info")
      verificationStatus = "pending";
    else if (rawVerification === "not_verified" || rawVerification === "failed")
      verificationStatus = "not_verified";

    // Fetch linked assets in parallel
    const [pagesResp, igResp, sysUsersResp] = await Promise.allSettled([
      metaGraphFetch<{ data?: unknown[] }>(`${bizId}/owned_pages`, accessToken, {
        query: { fields: "id", limit: "0" },
      }).catch(() => null),
      metaGraphFetch<{ data?: unknown[] }>(`${bizId}/owned_instagram_accounts`, accessToken, {
        query: { fields: "id", limit: "0" },
      }).catch(() => null),
      metaGraphFetch<{ data?: unknown[] }>(`${bizId}/system_users`, accessToken, {
        query: { fields: "id", limit: "0" },
      }).catch(() => null),
    ]);

    const pages = pagesResp.status === "fulfilled" ? pagesResp.value?.data?.length ?? null : null;
    const igAccounts = igResp.status === "fulfilled" ? igResp.value?.data?.length ?? null : null;
    const sysUsers = sysUsersResp.status === "fulfilled" ? sysUsersResp.value?.data?.length ?? null : null;

    // Cache the business ID in meta_assets_cache for future reference
    const db = supabaseAdmin();
    // Non-critical: cache the business ID for future reference
    try {
      await db
        .from("meta_assets_cache")
        .upsert(
          {
            workspace_id: workspaceId,
            business_id: bizId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "workspace_id,phone_number_id" }
        );
    } catch {
      // Cache update failure shouldn't break the page
    }

    return {
      businessManagerId: bizId,
      businessName: biz.name ?? null,
      verificationStatus,
      linkedAssets: {
        facebookPages: pages,
        instagramAccounts: igAccounts,
        systemUsers: sysUsers,
      },
    };
  } catch (err) {
    logger.warn("[business-intelligence] failed to fetch data", {
      workspaceId,
      error: err instanceof Error ? err.message : "unknown",
    });
    return empty;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   MONITOR METRICS - Real Latency & Uptime from Events
   ═══════════════════════════════════════════════════════════════════════════ */

export type MonitorMetrics = {
  latencyMs: number | null;
  uptime: number | null;
};

/**
 * Computes approximate API health metrics from webhook event data:
 * - latencyMs: avg processing time from last 10 events (received_at - processed_at)
 * - uptime: % of non-error events in last 7 days
 */
export async function getMonitorMetrics(workspaceId: string): Promise<MonitorMetrics> {
  const db = supabaseAdmin();

  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Total events last 7 days
    const { count: totalEvents } = await db
      .from("meta_webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("received_at", weekAgo);

    // Error events last 7 days
    const { count: errorEvents } = await db
      .from("meta_webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("received_at", weekAgo)
      .not("error_text", "is", null);

    const total = totalEvents ?? 0;
    const errors = errorEvents ?? 0;

    // Uptime = (total - errors) / total * 100
    const uptime = total > 0 ? Math.round(((total - errors) / total) * 10000) / 100 : null;

    // Latency: check the most recent events with processed_at
    const { data: recentEvents } = await db
      .from("meta_webhook_events")
      .select("received_at, processed_at")
      .eq("workspace_id", workspaceId)
      .not("processed_at", "is", null)
      .order("received_at", { ascending: false })
      .limit(10);

    let latencyMs: number | null = null;
    if (recentEvents && recentEvents.length > 0) {
      const latencies = recentEvents
        .map((e) => {
          if (!e.received_at || !e.processed_at) return null;
          return new Date(e.processed_at).getTime() - new Date(e.received_at).getTime();
        })
        .filter((v): v is number => v !== null && v >= 0);
      if (latencies.length > 0) {
        latencyMs = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
      }
    }

    return { latencyMs, uptime };
  } catch (err) {
    logger.warn("[monitor-metrics] failed to compute", {
      workspaceId,
      error: err instanceof Error ? err.message : "unknown",
    });
    return { latencyMs: null, uptime: null };
  }
}
