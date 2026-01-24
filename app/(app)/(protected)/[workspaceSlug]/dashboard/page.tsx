import Link from "next/link";
import { redirect } from "next/navigation";
import { Brain, Layers, MessageSquare, Wallet } from "lucide-react";
import SetPasswordModal from "@/components/auth/SetPasswordModal";
import AdminPanel from "@/components/app/AdminPanel";
import CircularGauge from "@/components/app/dashboard-widgets/CircularGauge";
import AIInsightsCard, { type InsightItem } from "@/components/app/dashboard-widgets/AIInsightsCard";
import { CustomizePinnedButton } from "@/components/app/dashboard-widgets/CustomizePinnedButton";
import { UpdatesPanel } from "@/components/app/UpdatesPanel";
import { getAppContext } from "@/lib/app-context";
import { getPlanMeta } from "@/lib/entitlements";
import { buildModuleRegistry } from "@/lib/modules/registry";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getWallet } from "@/lib/tokens";
import { formatRelativeTime } from "@/lib/time";
import { ensureWorkspaceCookie } from "@/lib/workspaces";
import { getAllQuotaStatuses, getMetricTrend, getDashboardMetrics, PLAN_QUOTAS } from "@/lib/quotas";
import { getDashboardPreferences } from "@/lib/dashboard/preferences";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function AppHomePage({ params }: DashboardPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;

  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/dashboard`);
  }

  await ensureWorkspaceCookie(workspace.id);

  const db = supabaseAdmin();
  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id, billing_mode, seat_limit, status")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  const plan = getPlanMeta(subscription?.plan_id || "free_locked");
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const basePath = `/${workspace.slug}`;

  const moduleRegistry = buildModuleRegistry({
    workspaceSlug: workspace.slug,
    planId: plan.plan_id,
    isAdmin,
    effectiveEntitlements: ctx.effectiveEntitlements,
  });

  const wallet = await getWallet(ctx.currentWorkspace.id);
  const balance = Number(wallet.balance_bigint ?? 0);

  // Fetch quota statuses and metrics for gauges
  const [quotaStatuses, dashboardMetrics, waMessagesTrend, aiTokensTrend] = await Promise.all([
    getAllQuotaStatuses(workspace.id),
    getDashboardMetrics(workspace.id),
    getMetricTrend(workspace.id, "wa_messages_sent", 7),
    getMetricTrend(workspace.id, "ai_tokens_consumed", 7),
  ]);

  // Get quota values with fallbacks from plan defaults
  const planQuotas = PLAN_QUOTAS[plan.plan_id] ?? PLAN_QUOTAS.free_locked;
  const waQuota = quotaStatuses.find((q) => q.quotaKey === "wa_messages_monthly");
  const aiQuota = quotaStatuses.find((q) => q.quotaKey === "ai_tokens_monthly");

  const waMessagesUsed = waQuota?.used ?? dashboardMetrics.waMessagesSent7d;
  const waMessagesLimit = waQuota?.limit ?? planQuotas.wa_messages_monthly;
  const aiTokensUsed = aiQuota?.used ?? dashboardMetrics.aiTokensUsed7d;
  const aiTokensLimit = aiQuota?.limit ?? planQuotas.ai_tokens_monthly;

  // Count pending templates for insights
  const { count: pendingTemplatesCount } = await db
    .from("wa_templates")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id)
    .eq("status", "PENDING");

  // Build AI insights from real data
  const insights: InsightItem[] = [];

  // Performance insight
  if (dashboardMetrics.waMessagesSent7d > 0) {
    insights.push({
      type: "performance",
      title: "Performance",
      message: `${dashboardMetrics.waMessagesSent7d.toLocaleString()} WhatsApp messages sent this week.`,
    });
  } else if (dashboardMetrics.helperConversations7d > 0) {
    insights.push({
      type: "performance",
      title: "Performance",
      message: `${dashboardMetrics.helperConversations7d} Helper AI conversations this week.`,
    });
  }

  // Attention insights
  if ((pendingTemplatesCount ?? 0) > 0) {
    insights.push({
      type: "attention",
      title: "Attention",
      message: `${pendingTemplatesCount} template${pendingTemplatesCount === 1 ? "" : "s"} pending approval.`,
      href: `${basePath}/meta-hub/messaging/whatsapp`,
      ctaLabel: "View templates",
    });
  }

  const aiUsagePercentage = aiTokensLimit > 0 ? (aiTokensUsed / aiTokensLimit) * 100 : 0;
  if (aiUsagePercentage >= 75) {
    insights.push({
      type: "attention",
      title: "Attention",
      message: `AI token usage at ${Math.round(aiUsagePercentage)}% of monthly cap.`,
      href: `${basePath}/credits`,
      ctaLabel: "Top up credits",
    });
  }

  // Recommendation insight based on onboarding status
  const metaHubModule = moduleRegistry.find((m) => m.key === "meta-hub");
  if (metaHubModule?.status === "locked") {
    insights.push({
      type: "recommendation",
      title: "Recommendation",
      message: "Unlock Meta Hub to send WhatsApp messages and manage templates.",
      href: `${basePath}/subscription`,
      ctaLabel: "Upgrade plan",
    });
  } else if (dashboardMetrics.waMessagesSent7d === 0 && metaHubModule?.status === "available") {
    insights.push({
      type: "recommendation",
      title: "Recommendation",
      message: "Send your first WhatsApp message to start engaging with customers.",
      href: `${basePath}/meta-hub/messaging/whatsapp`,
      ctaLabel: "Go to inbox",
    });
  }

  const { count: memberCount } = await db
    .from("workspace_members")
    .select("user_id", { count: "exact", head: true })
    .eq("workspace_id", ctx.currentWorkspace.id);

  const workspaceTypeLabel = workspace.workspace_type === "individual" ? "Individual" : "Team";

  // Get user's pinned modules preferences (dynamic, per-user)
  const pinnedKeys = await getDashboardPreferences(ctx.user.id, workspace.id);
  const pinnedModules = moduleRegistry.filter((module) => pinnedKeys.includes(module.key));

  // Server action to revalidate after preferences change
  async function revalidateDashboard() {
    "use server";
    revalidatePath(`/${workspaceSlug}/dashboard`);
  }

  const statusLabel: Record<string, string> = {
    available: "Live",
    locked: "Locked",
    coming_soon: "Soon",
  };

  const statusClass: Record<string, string> = {
    available: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40",
    locked: "bg-amber-500/15 text-amber-100 border border-amber-400/50",
    coming_soon: "bg-slate-500/15 text-slate-100 border border-slate-400/40",
  };

  const iconForModule: Record<string, React.ComponentType<{ className?: string }>> = {
    platform: Layers,
    "meta-hub": MessageSquare,
    helper: Brain,
    pay: Wallet,
  };

  const supabase = await supabaseServer();
  const { data: activityEventsRaw } = await supabase
    .from("audit_events")
    .select("id, action, actor_email, created_at, meta")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const activityEvents = activityEventsRaw ?? [];

  const activityItems = activityEvents.map((event) => {
    const meta = (event as { meta?: Record<string, unknown> | null }).meta ?? null;
    const moduleTag = typeof meta?.module === "string" ? meta.module : undefined;
    const actor = event.actor_email || "System";

    const action = (() => {
      switch (event.action) {
        case "workspace.created":
          return "Workspace created";
        case "member.role_updated":
          return "Member role updated";
        case "billing.requested":
          return "Billing request submitted";
        case "tokens.topup_requested":
          return "Credits top-up requested";
        case "tokens.topup_paid":
          return "Credits applied";
        case "feature.interest":
          return "Feature interest recorded";
        default: {
          const clean = event.action?.replaceAll(".", " → ");
          return clean ? clean : "Activity recorded";
        }
      }
    })();

    return {
      id: event.id,
      action,
      actor,
      moduleTag,
      createdAt: event.created_at,
    };
  });

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none fixed inset-0 batik-pattern opacity-[0.03]" aria-hidden />
      <SetPasswordModal />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[{
          title: "System Health",
          value: "Operational",
          hint: "All systems healthy",
          href: `${basePath}/platform`,
          cta: "View health",
        }, {
          title: "Workspace",
          value: workspace.name,
          hint: `${workspaceTypeLabel} · ${memberCount ?? 0} members`,
          href: `${basePath}/settings`,
          cta: "Manage workspace",
        }].map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative overflow-hidden rounded-2xl border border-[#d4af37]/25 bg-[#0a1229]/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d4af37]/50"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent" />
            <div className="relative space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d4af37]/80">
                {card.title}
              </p>
              <div className="text-lg font-semibold text-[#f5f5dc]">{card.value}</div>
              <p className="text-xs text-[#f5f5dc]/65">{card.hint}</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#d4af37]">
                {card.cta} →
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* Resource Fuel Gauges */}
      <section className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">Resource Fuel</p>
          <h2 className="text-lg font-semibold text-[#f5f5dc]">Usage & Quotas</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <CircularGauge
            label="WhatsApp Messages"
            value={waMessagesUsed}
            max={waMessagesLimit}
            unit="this month"
            color="emerald"
            trend={waMessagesTrend.map((t) => t.value)}
            href={`${basePath}/meta-hub/messaging/whatsapp`}
            ctaLabel="View inbox"
          />
          <CircularGauge
            label="AI Tokens"
            value={aiTokensUsed}
            max={aiTokensLimit}
            unit="this month"
            color="magenta"
            trend={aiTokensTrend.map((t) => t.value)}
            href={`${basePath}/credits`}
            ctaLabel="Top up"
          />
          <CircularGauge
            label="Usage Credits"
            value={balance}
            max={balance > 0 ? balance * 2 : 10000}
            unit="available"
            color="gold"
            href={`${basePath}/credits`}
            ctaLabel="View credits"
          />
        </div>
      </section>

      {/* AI Insights */}
      <AIInsightsCard insights={insights} workspaceSlug={workspace.slug} />

      {/* Product Updates */}
      <UpdatesPanel workspaceSlug={workspace.slug} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">Pinned Modules</p>
            <h2 className="text-lg font-semibold text-[#f5f5dc]">Quick access</h2>
          </div>
          <CustomizePinnedButton
            workspaceId={workspace.id}
            currentPinned={pinnedKeys}
            availableModules={moduleRegistry}
            onSave={revalidateDashboard}
          />
        </div>

        {pinnedModules.length === 0 ? (
          <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/70 p-4 text-sm text-[#f5f5dc]/70">
            No modules available yet. Check back soon.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {pinnedModules.map((module) => {
              const action = (() => {
                if (module.status === "available" && module.href) {
                  return { label: "Open", href: module.href };
                }
                if (module.status === "locked") {
                  return { label: "Unlock", href: `${basePath}/subscription` };
                }
                return { label: "Notify me", href: `${basePath}/products` };
              })();

              const Icon = iconForModule[module.key] ?? Layers;

              return (
                <div
                  key={module.key}
                  className="flex flex-col justify-between rounded-2xl border border-[#d4af37]/15 bg-[#050a18]/70 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-[#f5f5dc]">{module.name}</h3>
                        {module.accessLabel ? (
                          <p className="text-[11px] text-[#f5f5dc]/60">{module.accessLabel}</p>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${statusClass[module.status]}`}
                    >
                      {statusLabel[module.status] ?? "Status"}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={action.href}
                      className="inline-flex items-center gap-1 rounded-xl border border-[#d4af37]/30 bg-[#0a1229]/80 px-3 py-2 text-xs font-semibold text-[#f5f5dc] transition hover:border-[#d4af37]/60 hover:text-[#d4af37]"
                    >
                      {action.label} →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">Unified Activity</p>
            <h2 className="text-lg font-semibold text-[#f5f5dc]">Recent workspace events</h2>
          </div>
          <Link
            href={`${basePath}/platform/audit`}
            className="text-sm font-semibold text-[#d4af37] hover:underline"
          >
            View all activity →
          </Link>
        </div>

        {activityItems.length === 0 ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/70 p-4 text-sm text-[#f5f5dc]/80">
            <div>
              <p className="font-semibold text-[#f5f5dc]">No recent activity yet.</p>
              <p className="text-xs text-[#f5f5dc]/65">Invite a teammate or submit a billing request to see events here.</p>
            </div>
            <Link
              href={`${basePath}/platform/roles`}
              className="rounded-xl border border-[#d4af37]/30 px-3 py-2 text-xs font-semibold text-[#d4af37] transition hover:border-[#d4af37]/60 hover:bg-[#d4af37]/10"
            >
              Invite a member
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#d4af37]/15 overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/70">
            {activityItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#f5f5dc]">{item.action}</p>
                  <p className="text-xs text-[#f5f5dc]/70">
                    {item.actor}
                    {item.moduleTag ? <span className="ml-2 rounded-full bg-[#f5f5dc]/5 px-2 py-1 text-[10px] font-semibold uppercase text-[#d4af37]">{item.moduleTag}</span> : null}
                  </p>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#f5f5dc]/50">
                  {formatRelativeTime(item.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {plan.plan_id === "free_locked" && !isAdmin && (
        <section className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <div>
              <p className="font-semibold">Free tier is temporarily locked</p>
              <p className="text-xs text-amber-100/80">
                Upgrade to unlock premium modules and usage credits.
              </p>
            </div>
          </div>
        </section>
      )}

      {isAdmin && (
        <AdminPanel
          workspaceId={ctx.currentWorkspace.id}
          enableBillingTestMode={process.env.ENABLE_BILLING_TEST_MODE === "true"}
        />
      )}
    </div>
  );
}
