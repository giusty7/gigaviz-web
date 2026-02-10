import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import SetPasswordModal from "@/components/auth/SetPasswordModal";
import AdminPanel from "@/components/app/AdminPanel";
import { UnifiedProductGrid } from "@/components/app/dashboard-widgets/UnifiedProductGrid";
import { UpdatesPanel } from "@/components/app/UpdatesPanel";
import { DashboardActivityFeed } from "@/components/app/dashboard-activity-feed";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAppContext } from "@/lib/app-context";
import { getUnifiedDashboard } from "@/lib/dashboard/overview";
import { isPlatformAdminById } from "@/lib/platform-admin/server";
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

  // Parallel fetch: dashboard overview + platform admin check
  const [dashboard, isPlatformAdmin] = await Promise.all([
    getUnifiedDashboard(workspace.id, ctx.effectiveEntitlements),
    isPlatformAdminById(ctx.user.id),
  ]);

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

        {/* Activity Feed & Updates — activity streams via Suspense */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={
            <div className="space-y-4">
              <Skeleton className="h-6 w-48 bg-[#d4af37]/10" />
              <SkeletonList rows={5} />
            </div>
          }>
            <DashboardActivityFeed
              workspaceId={workspace.id}
              workspaceSlug={workspace.slug}
            />
          </Suspense>

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
