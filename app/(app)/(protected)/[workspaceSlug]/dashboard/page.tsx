import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
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
import { getTranslations } from "next-intl/server";

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

  // Parallel fetch: dashboard overview + platform admin check + translations
  const [dashboard, isPlatformAdmin, t] = await Promise.all([
    getUnifiedDashboard(workspace.id, ctx.effectiveEntitlements),
    isPlatformAdminById(ctx.user.id),
    getTranslations("app.dashboard"),
  ]);

  return (
    <div className="relative min-h-screen">
      <SetPasswordModal />

      <div className="relative space-y-8 pb-12">
        {/* Compact Hero */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5dc] tracking-tight sm:text-3xl">
              {t("welcomeBack", { workspace: workspace.name })}
            </h1>
            <p className="mt-1 text-sm text-[#f5f5dc]/50 max-w-xl">
              {t("subtitle")}
            </p>
          </div>
          <Link
            href={`/${workspace.slug}/settings`}
            className="inline-flex items-center self-start rounded-lg border border-[#d4af37]/20 bg-[#d4af37]/5 px-4 py-2 text-xs font-medium text-[#d4af37] transition hover:bg-[#d4af37]/10 sm:self-auto"
          >
            {t("workspaceSettings")}
          </Link>
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
