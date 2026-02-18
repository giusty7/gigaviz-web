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
import { PageHeader } from "@/components/ui/page-header";
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

      <div className="relative space-y-6 pb-10">
        {/* Compact Hero */}
        <PageHeader
          title={t("welcomeBack", { workspace: workspace.name })}
          description={t("subtitle")}
          actions={
            <Link
              href={`/${workspace.slug}/settings`}
              className="inline-flex items-center rounded-lg border border-border bg-foreground/[0.02] px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition hover:bg-foreground/[0.04] hover:text-foreground/70"
            >
              {t("workspaceSettings")}
            </Link>
          }
        />

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
