import { redirect } from "next/navigation";
import Link from "next/link";
import { Activity, Sparkles } from "lucide-react";
import SetPasswordModal from "@/components/auth/SetPasswordModal";
import AdminPanel from "@/components/app/AdminPanel";
import { UnifiedProductGrid } from "@/components/app/dashboard-widgets/UnifiedProductGrid";
import { UpdatesPanel } from "@/components/app/UpdatesPanel";
import { getAppContext } from "@/lib/app-context";
import { getUnifiedDashboard } from "@/lib/dashboard/overview";
import { isPlatformAdminById } from "@/lib/platform-admin/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatRelativeTime } from "@/lib/time";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

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

  // Get unified dashboard with all 10 products
  const dashboard = await getUnifiedDashboard(
    workspace.id,
    ctx.effectiveEntitlements
  );

  // Get recent activity for the feed
  const db = supabaseAdmin();
  const { data: activityEventsRaw } = await db
    .from("audit_events")
    .select("id, action, actor_email, created_at, meta")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(8);

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
        case "meta.message_sent":
          return "WhatsApp message sent";
        case "helper.conversation_started":
          return "Helper conversation started";
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

  // Check if user is a Gigaviz platform admin (staff) - NOT regular workspace admin
  const isPlatformAdmin = await isPlatformAdminById(ctx.user.id);

  return (
    <div className="relative min-h-screen">
      {/* Background pattern */}
      <div className="pointer-events-none fixed inset-0 batik-pattern opacity-[0.03]" aria-hidden />
      
      <SetPasswordModal />

      <div className="relative space-y-8 pb-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-[#d4af37]/30 bg-gradient-to-br from-[#0a1229]/90 via-[#0a1229]/80 to-[#0a1229]/90 p-8 shadow-2xl backdrop-blur-sm">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 via-transparent to-transparent" />
          <div className="relative">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="h-8 w-8 text-[#d4af37]" />
                  <h1 className="text-3xl font-black text-[#f5f5dc] tracking-tight">
                    Welcome back to {workspace.name}
                  </h1>
                </div>
                <p className="text-[#f5f5dc]/70 text-lg max-w-2xl">
                  Your unified command center for all 10 Gigaviz products. Everything you need, beautifully organized.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/${workspace.slug}/settings`}
                  className="rounded-xl border border-[#d4af37]/30 bg-[#0a1229]/80 px-6 py-3 text-sm font-bold text-[#d4af37] transition hover:border-[#d4af37]/60 hover:bg-[#d4af37]/10"
                >
                  Workspace Settings
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Unified Product Grid */}
        <UnifiedProductGrid products={dashboard.products} />

        {/* Activity Feed & Updates */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]/80 font-semibold">
                  Workspace Activity
                </p>
                <h2 className="text-xl font-bold text-[#f5f5dc]">Recent Events</h2>
              </div>
              <Link
                href={`/${workspace.slug}/platform/audit`}
                className="text-sm font-semibold text-[#d4af37] hover:underline flex items-center gap-1"
              >
                View all <Activity className="h-4 w-4" />
              </Link>
            </div>

            {activityItems.length === 0 ? (
              <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/70 p-6 text-center">
                <p className="font-semibold text-[#f5f5dc] mb-2">No recent activity yet</p>
                <p className="text-sm text-[#f5f5dc]/60">
                  Start using your workspace to see activity here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#d4af37]/15 overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/70">
                {activityItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[#d4af37]/5 transition">
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-[#f5f5dc] truncate">
                        {item.action}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-[#f5f5dc]/60 truncate">
                          {item.actor}
                        </p>
                        {item.moduleTag && (
                          <span className="rounded-full bg-[#d4af37]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#d4af37] border border-[#d4af37]/20">
                            {item.moduleTag}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#f5f5dc]/50 whitespace-nowrap">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Product Updates */}
          <section>
            <UpdatesPanel workspaceSlug={workspace.slug} />
          </section>
        </div>

        {/* Admin Panel - Only visible to Gigaviz platform staff */}
        {isPlatformAdmin && (
          <AdminPanel
            workspaceId={ctx.currentWorkspace.id}
            enableBillingTestMode={process.env.ENABLE_BILLING_TEST_MODE === "true"}
          />
        )}
      </div>
    </div>
  );
}
