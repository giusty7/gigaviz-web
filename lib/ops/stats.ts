import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";

/**
 * Ops Dashboard Stats
 *
 * Centralized stats fetcher for the ops console dashboard.
 * Uses service role (bypasses RLS) since this is ops-only.
 */

export interface OpsDashboardStats {
  workspaces: {
    total: number;
    active: number;
    suspended: number;
    createdLast7d: number;
  };
  users: {
    total: number;
    registeredLast7d: number;
  };
  leads: {
    total: number;
    newLast7d: number;
    contactFormLast7d: number;
    pending: number;
  };
  tickets: {
    total: number;
    open: number;
    avgResponseHours: number | null;
  };
  revenue: {
    totalTokenTopupCents: number;
    marketplacePlatformFeeCents: number;
    totalPurchases: number;
  };
  newsletter: {
    total: number;
    subscribedLast7d: number;
  };
  health: {
    apiRoutes: number;
    pendingMarketplaceItems: number;
    activeWorkers: number;
  };
}

function iso7dAgo(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

export async function getOpsDashboardStats(): Promise<OpsDashboardStats> {
  const db = supabaseAdmin();
  const since7d = iso7dAgo();

  try {
    const [
      // Workspaces
      { count: wsTotal },
      { count: wsSuspended },
      { count: wsRecent },
      // Users
      { count: usersTotal },
      { count: usersRecent },
      // Leads
      { count: leadsTotal },
      { count: leadsRecent },
      { count: leadsPending },
      { count: contactLeadsRecent },
      // Tickets
      { count: ticketsTotal },
      { count: ticketsOpen },
      // Newsletter
      { count: newsletterTotal },
      { count: newsletterRecent },
      // Marketplace
      { count: pendingMarketplace },
      { count: totalPurchases },
      // Revenue
      { data: revenueData },
    ] = await Promise.all([
      // Workspaces
      db.from("workspaces").select("*", { count: "exact", head: true }),
      db.from("workspaces").select("*", { count: "exact", head: true }).eq("status", "suspended"),
      db.from("workspaces").select("*", { count: "exact", head: true }).gte("created_at", since7d),
      // Users
      db.from("profiles").select("*", { count: "exact", head: true }),
      db.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", since7d),
      // Leads
      db.from("leads").select("*", { count: "exact", head: true }),
      db.from("leads").select("*", { count: "exact", head: true }).gte("created_at", since7d),
      db.from("leads").select("*", { count: "exact", head: true }).eq("status", "new"),
      db.from("leads").select("*", { count: "exact", head: true }).eq("source", "contact-form").gte("created_at", since7d),
      // Tickets
      db.from("support_tickets").select("*", { count: "exact", head: true }),
      db.from("support_tickets").select("*", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
      // Newsletter
      db.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
      db.from("newsletter_subscribers").select("*", { count: "exact", head: true }).gte("created_at", since7d),
      // Marketplace
      db.from("marketplace_items").select("*", { count: "exact", head: true }).eq("status", "under_review"),
      db.from("marketplace_purchases").select("*", { count: "exact", head: true }),
      // Revenue (platform fees from marketplace)
      db.from("marketplace_purchases").select("platform_fee_cents").eq("payment_status", "completed"),
    ]);

    const marketplaceRevenue = (revenueData ?? []).reduce(
      (sum: number, p: { platform_fee_cents: number }) => sum + (p.platform_fee_cents || 0),
      0
    );

    return {
      workspaces: {
        total: wsTotal ?? 0,
        active: (wsTotal ?? 0) - (wsSuspended ?? 0),
        suspended: wsSuspended ?? 0,
        createdLast7d: wsRecent ?? 0,
      },
      users: {
        total: usersTotal ?? 0,
        registeredLast7d: usersRecent ?? 0,
      },
      leads: {
        total: leadsTotal ?? 0,
        newLast7d: leadsRecent ?? 0,
        contactFormLast7d: contactLeadsRecent ?? 0,
        pending: leadsPending ?? 0,
      },
      tickets: {
        total: ticketsTotal ?? 0,
        open: ticketsOpen ?? 0,
        avgResponseHours: null, // TODO: compute from first_response_at - created_at
      },
      revenue: {
        totalTokenTopupCents: 0, // TODO: aggregate from token_topups when payment gateway lands
        marketplacePlatformFeeCents: marketplaceRevenue,
        totalPurchases: totalPurchases ?? 0,
      },
      newsletter: {
        total: newsletterTotal ?? 0,
        subscribedLast7d: newsletterRecent ?? 0,
      },
      health: {
        apiRoutes: 225,
        pendingMarketplaceItems: pendingMarketplace ?? 0,
        activeWorkers: 0, // TODO: check worker_heartbeats
      },
    };
  } catch (err) {
    logger.error("Failed to fetch ops dashboard stats", { error: err });
    return {
      workspaces: { total: 0, active: 0, suspended: 0, createdLast7d: 0 },
      users: { total: 0, registeredLast7d: 0 },
      leads: { total: 0, newLast7d: 0, contactFormLast7d: 0, pending: 0 },
      tickets: { total: 0, open: 0, avgResponseHours: null },
      revenue: { totalTokenTopupCents: 0, marketplacePlatformFeeCents: 0, totalPurchases: 0 },
      newsletter: { total: 0, subscribedLast7d: 0 },
      health: { apiRoutes: 225, pendingMarketplaceItems: 0, activeWorkers: 0 },
    };
  }
}
