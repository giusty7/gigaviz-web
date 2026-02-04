import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getMetaHubOverview } from "@/lib/meta/overview-data";
import { getWallet } from "@/lib/tokens";

export type ProductStatus = "live" | "beta" | "coming-soon" | "locked";

export type ProductMetric = {
  label: string;
  value: string | number;
  trend?: number; // percentage change
  icon?: string;
};

export type ProductWidget = {
  productKey: string;
  productName: string;
  status: ProductStatus;
  priority: number; // 0 = P0 (always visible), 1 = P1 (conditional), 2 = P2 (expandable)
  metrics: ProductMetric[];
  quickAction?: {
    label: string;
    href: string;
  };
  alert?: {
    type: "info" | "warning" | "error" | "success";
    message: string;
  };
};

export type UnifiedDashboard = {
  workspaceId: string;
  products: ProductWidget[];
  generatedAt: string;
};

/**
 * Get unified dashboard overview for all 10 products
 */
export async function getUnifiedDashboard(
  workspaceId: string,
  entitlements: string[]
): Promise<UnifiedDashboard> {
  const db = supabaseAdmin();

  // Parallel data fetching for performance
  const [
    platformData,
    metaHubData,
    helperData,
    studioData,
    appsData,
    marketplaceData,
    tokenWallet,
  ] = await Promise.all([
    getPlatformMetrics(workspaceId, db),
    getMetaHubMetrics(workspaceId, entitlements),
    getHelperMetrics(workspaceId, entitlements),
    getStudioMetrics(workspaceId, entitlements),
    getAppsMetrics(workspaceId),
    getMarketplaceMetrics(workspaceId, entitlements),
    getWallet(workspaceId),
  ]);

  const products: ProductWidget[] = [];

  // P0: Platform (always visible)
  products.push({
    productKey: "platform",
    productName: "Platform",
    status: "live",
    priority: 0,
    metrics: [
      { label: "Plan", value: platformData.planName },
      { label: "Members", value: platformData.memberCount },
      { label: "Storage", value: platformData.storageUsed || "N/A" },
    ],
    quickAction: {
      label: "Manage workspace",
      href: platformData.settingsHref,
    },
  });

  // P0: Token Balance (always visible)
  const balance = Number(tokenWallet.balance_bigint ?? 0);
  products.push({
    productKey: "tokens",
    productName: "Credits",
    status: "live",
    priority: 0,
    metrics: [
      { label: "Balance", value: balance.toLocaleString(), icon: "💰" },
      { label: "Status", value: balance > 10000 ? "Healthy" : "Low" },
    ],
    quickAction: {
      label: balance < 10000 ? "Top up" : "View credits",
      href: platformData.creditsHref,
    },
    alert: balance < 5000 ? {
      type: "warning",
      message: "Credit balance running low",
    } : undefined,
  });

  // P0: Meta Hub (if unlocked)
  if (metaHubData) {
    products.push({
      productKey: "meta-hub",
      productName: "Meta Hub",
      status: metaHubData.status,
      priority: 0,
      metrics: [
        { label: "Messages Today", value: metaHubData.messagesToday, trend: metaHubData.messagesTrend },
        { label: "Active Threads", value: metaHubData.activeThreads },
        { label: "Templates", value: metaHubData.templatesCount },
      ],
      quickAction: {
        label: metaHubData.messagesToday === 0 ? "Send first message" : "Go to Inbox",
        href: metaHubData.inboxHref,
      },
      alert: metaHubData.pendingTemplates > 0 ? {
        type: "info",
        message: `${metaHubData.pendingTemplates} template${metaHubData.pendingTemplates > 1 ? "s" : ""} pending approval`,
      } : undefined,
    });
  } else if (entitlements.includes("meta_hub")) {
    // Locked but available in plan
    products.push({
      productKey: "meta-hub",
      productName: "Meta Hub",
      status: "locked",
      priority: 0,
      metrics: [
        { label: "Status", value: "Setup required" },
      ],
      quickAction: {
        label: "Connect WhatsApp",
        href: platformData.metaHubHref,
      },
    });
  }

  // P0: Helper (if unlocked)
  if (helperData) {
    products.push({
      productKey: "helper",
      productName: "Helper AI",
      status: helperData.status,
      priority: 0,
      metrics: [
        { label: "Tokens Today", value: helperData.tokensToday.toLocaleString() },
        { label: "Conversations", value: helperData.conversationsCount },
        { label: "Usage", value: `${helperData.usagePercent}%` },
      ],
      quickAction: {
        label: helperData.conversationsCount === 0 ? "Start chat" : "Open Helper",
        href: helperData.helperHref,
      },
      alert: helperData.usagePercent > 75 ? {
        type: "warning",
        message: `AI usage at ${helperData.usagePercent}% of monthly cap`,
      } : undefined,
    });
  }

  // P1: Studio (if has data)
  if (studioData && studioData.totalActivity > 0) {
    products.push({
      productKey: "studio",
      productName: "Studio",
      status: studioData.status,
      priority: 1,
      metrics: [
        { label: "Documents", value: studioData.documentsCount, icon: "📄" },
        { label: "Charts", value: studioData.chartsCount, icon: "📊" },
        { label: "Workflows", value: studioData.workflowsCount, icon: "🔄" },
      ],
      quickAction: {
        label: "Open Studio",
        href: studioData.studioHref,
      },
    });
  }

  // P1: Apps (if has requests or integrations)
  if (appsData && appsData.totalActivity > 0) {
    products.push({
      productKey: "apps",
      productName: "Apps",
      status: appsData.status,
      priority: 1,
      metrics: [
        { label: "Catalog", value: `${appsData.catalogSize} apps` },
        { label: "Requests", value: appsData.requestsCount },
      ],
      quickAction: {
        label: "Browse apps",
        href: appsData.appsHref,
      },
    });
  }

  // P1: Marketplace (if has purchases or seller activity)
  if (marketplaceData && (marketplaceData.purchasesCount > 0 || marketplaceData.isSeller)) {
    products.push({
      productKey: "marketplace",
      productName: "Marketplace",
      status: marketplaceData.status,
      priority: 1,
      metrics: marketplaceData.isSeller ? [
        { label: "Sales", value: marketplaceData.totalSales || 0 },
        { label: "Revenue", value: `$${marketplaceData.revenue || 0}` },
        { label: "Items", value: marketplaceData.itemsCount || 0 },
      ] : [
        { label: "Purchases", value: marketplaceData.purchasesCount },
        { label: "Items", value: `${marketplaceData.catalogSize} available` },
      ],
      quickAction: {
        label: marketplaceData.isSeller ? "Seller dashboard" : "Browse marketplace",
        href: marketplaceData.marketplaceHref,
      },
    });
  }

  // P2: Coming Soon Products (Arena, Pay, Community, Trade)
  const comingSoonProducts = [
    {
      key: "arena",
      name: "Arena",
      description: "Competitive insights & games",
      launchDate: "Q2 2026",
    },
    {
      key: "pay",
      name: "Pay",
      description: "Payment processing",
      launchDate: "Q2 2026",
    },
    {
      key: "community",
      name: "Community",
      description: "Forums & events",
      launchDate: "Q3 2026",
    },
    {
      key: "trade",
      name: "Trade",
      description: "E-commerce insights",
      launchDate: "In development",
    },
  ];

  comingSoonProducts.forEach((product) => {
    products.push({
      productKey: product.key,
      productName: product.name,
      status: "coming-soon",
      priority: 2,
      metrics: [
        { label: "Status", value: product.description },
        { label: "Launch", value: product.launchDate },
      ],
      quickAction: {
        label: "Request early access",
        href: `${platformData.baseHref}/products`,
      },
    });
  });

  return {
    workspaceId,
    products,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Platform metrics (workspace health)
 */
async function getPlatformMetrics(workspaceId: string, db: ReturnType<typeof supabaseAdmin>) {
  const [workspaceData, memberCount, subscription] = await Promise.all([
    db.from("workspaces").select("name, slug").eq("id", workspaceId).single(),
    db.from("workspace_members").select("user_id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    db.from("subscriptions").select("plan_id").eq("workspace_id", workspaceId).maybeSingle(),
  ]);

  const planName = subscription.data?.plan_id || "free_locked";
  const slug = workspaceData.data?.slug || "";

  return {
    planName: planName.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
    memberCount: memberCount.count || 0,
    storageUsed: null, // TODO: Implement storage tracking
    settingsHref: `/${slug}/settings`,
    creditsHref: `/${slug}/credits`,
    baseHref: `/${slug}`,
    metaHubHref: `/${slug}/meta-hub`,
  };
}

/**
 * Meta Hub metrics
 */
async function getMetaHubMetrics(workspaceId: string, entitlements: string[]) {
  if (!entitlements.includes("meta_hub")) return null;

  try {
    const overview = await getMetaHubOverview(workspaceId);
    const db = supabaseAdmin();

    // Get today's message count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: messagesToday } = await db
      .from("outbox_messages")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("created_at", today.toISOString());

    // Get active threads count
    const { count: activeThreads } = await db
      .from("threads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "open");

    const { data: workspace } = await db.from("workspaces").select("slug").eq("id", workspaceId).single();

    return {
      status: "live" as ProductStatus,
      messagesToday: messagesToday || 0,
      messagesTrend: 0, // TODO: Calculate trend
      activeThreads: activeThreads || 0,
      templatesCount: (overview.kpis.templates.approved || 0) + (overview.kpis.templates.pending || 0) + (overview.kpis.templates.rejected || 0),
      pendingTemplates: overview.kpis.templates.pending || 0,
      inboxHref: `/${workspace?.slug}/meta-hub/inbox`,
    };
  } catch {
    return null;
  }
}

/**
 * Helper AI metrics
 */
async function getHelperMetrics(workspaceId: string, entitlements: string[]) {
  if (!entitlements.includes("helper")) return null;

  try {
    const db = supabaseAdmin();

    // Get today's token usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayUsage } = await db
      .from("helper_usage_daily")
      .select("tokens_used")
      .eq("workspace_id", workspaceId)
      .eq("usage_date", today.toISOString().split("T")[0])
      .maybeSingle();

    // Get conversations count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: conversationsCount } = await db
      .from("helper_conversations")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("created_at", sevenDaysAgo.toISOString());

    // Get monthly usage for percentage
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const { data: monthlyUsage } = await db
      .from("helper_usage_daily")
      .select("tokens_used")
      .eq("workspace_id", workspaceId)
      .gte("usage_date", firstDayOfMonth.toISOString().split("T")[0]);

    const monthlyTotal = monthlyUsage?.reduce((sum, day) => sum + (day.tokens_used || 0), 0) || 0;
    const monthlyCap = 100000; // TODO: Get from plan
    const usagePercent = monthlyCap > 0 ? Math.round((monthlyTotal / monthlyCap) * 100) : 0;

    const { data: workspace } = await db.from("workspaces").select("slug").eq("id", workspaceId).single();

    return {
      status: "live" as ProductStatus,
      tokensToday: todayUsage?.tokens_used || 0,
      conversationsCount: conversationsCount || 0,
      usagePercent,
      helperHref: `/${workspace?.slug}/helper`,
    };
  } catch {
    return null;
  }
}

/**
 * Studio metrics (Office + Graph + Tracks)
 */
async function getStudioMetrics(workspaceId: string, entitlements: string[]) {
  if (!entitlements.includes("studio")) return null;

  try {
    const db = supabaseAdmin();

    const [documentsCount, chartsCount, workflowsCount, workspace] = await Promise.all([
      db.from("office_documents").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      db.from("graph_charts").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      db.from("tracks_workflows").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      db.from("workspaces").select("slug").eq("id", workspaceId).single(),
    ]);

    const totalActivity = (documentsCount.count || 0) + (chartsCount.count || 0) + (workflowsCount.count || 0);

    if (totalActivity === 0) return null;

    return {
      status: "beta" as ProductStatus,
      documentsCount: documentsCount.count || 0,
      chartsCount: chartsCount.count || 0,
      workflowsCount: workflowsCount.count || 0,
      totalActivity,
      studioHref: `/${workspace.data?.slug}/modules/studio`,
    };
  } catch {
    return null;
  }
}

/**
 * Apps metrics
 */
async function getAppsMetrics(workspaceId: string) {
  try {
    const db = supabaseAdmin();

    const [catalogSize, requestsCount, workspace] = await Promise.all([
      db.from("apps_catalog").select("id", { count: "exact", head: true }),
      db.from("apps_requests").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      db.from("workspaces").select("slug").eq("id", workspaceId).single(),
    ]);

    const totalActivity = (requestsCount.count || 0);

    if (totalActivity === 0) return null;

    return {
      status: "beta" as ProductStatus,
      catalogSize: catalogSize.count || 0,
      requestsCount: requestsCount.count || 0,
      totalActivity,
      appsHref: `/${workspace.data?.slug}/apps`,
    };
  } catch {
    return null;
  }
}

/**
 * Marketplace metrics
 */
async function getMarketplaceMetrics(workspaceId: string, entitlements: string[]) {
  if (!entitlements.includes("marketplace")) return null;

  try {
    const db = supabaseAdmin();

    const [purchasesCount, catalogSize, creatorData, workspace] = await Promise.all([
      db.from("marketplace_purchases").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      db.from("marketplace_items").select("id", { count: "exact", head: true }).eq("status", "approved"),
      db.from("marketplace_creators").select("total_sales, creator_revenue, items_count").eq("workspace_id", workspaceId).maybeSingle(),
      db.from("workspaces").select("slug").eq("id", workspaceId).single(),
    ]);

    const isSeller = !!creatorData.data;

    return {
      status: "beta" as ProductStatus,
      purchasesCount: purchasesCount.count || 0,
      catalogSize: catalogSize.count || 0,
      isSeller,
      totalSales: creatorData.data?.total_sales || 0,
      revenue: creatorData.data?.creator_revenue || 0,
      itemsCount: creatorData.data?.items_count || 0,
      marketplaceHref: `/${workspace.data?.slug}/marketplace`,
    };
  } catch {
    return null;
  }
}
