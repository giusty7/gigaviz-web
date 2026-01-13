import Link from "next/link";
import { redirect } from "next/navigation";
import SetPasswordModal from "@/components/auth/SetPasswordModal";
import PlanCard from "@/components/app/PlanCard";
import TokenCard from "@/components/app/TokenCard";
import { type ModuleStatus } from "@/components/app/ModuleGrid";
import ComparePlans from "@/components/app/ComparePlans";
import AdminPanel from "@/components/app/AdminPanel";
import ModuleGridWithSalesDialog from "@/components/app/ModuleGridWithSalesDialog";
import QuickAccessSection from "@/components/app/QuickAccessSection";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { topLevelModules } from "@/lib/modules/catalog";
import { canAccess, getPlanMeta, planMeta } from "@/lib/entitlements";
import { getWallet } from "@/lib/tokens";
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

  const db = supabaseAdmin();
  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id, billing_mode, seat_limit, status")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  const plan = getPlanMeta(subscription?.plan_id || "free_locked");
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const userEmail = ctx.user.email ?? "";

  const wallet = await getWallet(ctx.currentWorkspace.id);
  const balance = Number(wallet.balance_bigint ?? 0);

  const { count: memberCount } = await db
    .from("workspace_members")
    .select("user_id", { count: "exact", head: true })
    .eq("workspace_id", ctx.currentWorkspace.id);

  const workspaceTypeLabel = workspace.workspace_type === "individual" ? "Individual" : "Team";
  const createdAtLabel = new Date(workspace.created_at).toLocaleDateString();
  const basePath = `/${workspace.slug}`;

  const moduleCards = topLevelModules.map((module) => {
    const comingSoon = module.status === "coming";
    const canUse =
      !comingSoon &&
      (!module.requiresEntitlement ||
        canAccess({ plan_id: plan.plan_id, is_admin: isAdmin }, module.requiresEntitlement));
    const status: ModuleStatus = comingSoon
      ? "coming_soon"
      : canUse
        ? "available"
        : "locked";

    const href = !comingSoon
      ? (module.hrefApp
          ? module.hrefApp.replace("[workspaceSlug]", workspace.slug)
          : `${basePath}/modules/${module.slug}`)
      : undefined;

    return {
      key: module.key,
      name: module.name,
      description: module.short || module.description,
      status,
      href,
    };
  });

  return (
    <div className="space-y-8">
      <SetPasswordModal />
      <QuickAccessSection workspaceId={workspace.id} modules={moduleCards} />
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Workspace Overview</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-muted-foreground">
            <div>
              <p className="text-xs text-muted-foreground/80">Name</p>
              <p className="text-base text-foreground">{ctx.currentWorkspace.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground/80">Slug</p>
              <p className="text-base text-foreground">{ctx.currentWorkspace.slug}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground/80">Type</p>
              <p className="text-base text-foreground">{workspaceTypeLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground/80">Created</p>
              <p className="text-base text-foreground">{createdAtLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground/80">Members</p>
              <p className="text-base text-foreground">{memberCount ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Jump straight to the most used areas.
          </p>
          <div className="mt-4 grid gap-2 text-sm">
            <Link
              href={`${basePath}/modules`}
              className="rounded-xl border border-border bg-gigaviz-surface px-4 py-2 font-semibold text-foreground hover:border-gigaviz-gold"
            >
              Modules
            </Link>
            <Link
              href={`${basePath}/settings#members`}
              className="rounded-xl border border-border bg-gigaviz-surface px-4 py-2 font-semibold text-foreground hover:border-gigaviz-gold"
            >
              Members
            </Link>
            <Link
              href={`${basePath}/tokens`}
              className="rounded-xl border border-border bg-gigaviz-surface px-4 py-2 font-semibold text-foreground hover:border-gigaviz-gold"
            >
              Tokens
            </Link>
            <Link
              href={`${basePath}/billing`}
              className="rounded-xl border border-border bg-gigaviz-surface px-4 py-2 font-semibold text-foreground hover:border-gigaviz-gold"
            >
              Billing
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Product Updates</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Member invites and approvals are being finalized.</li>
          <li>Token top-up goes live right after billing launch.</li>
          <li>Dashboard insights will show per-module usage details.</li>
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <PlanCard
          plan={plan}
          status={subscription?.status}
          seatLimit={subscription?.seat_limit}
          workspaceSlug={ctx.currentWorkspace.slug}
        />
        <TokenCard balance={balance} workspaceSlug={ctx.currentWorkspace.slug} />
      </section>

      {plan.plan_id === "free_locked" && !isAdmin && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Free Locked (Beta)</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Free tier is temporarily locked to prevent abuse and keep reliability/compliance high.
            Upgrade to unlock all modules.
          </p>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Modules</h2>
          <Link
            href={`${basePath}/modules`}
            className="text-sm font-semibold text-gigaviz-gold hover:underline"
          >
            View all modules
          </Link>
        </div>
        <ModuleGridWithSalesDialog
          modules={moduleCards}
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          workspaceSlug={workspace.slug}
          userEmail={userEmail}
          planOptions={planMeta}
          defaultPlanId={plan.plan_id}
        />
      </section>

      <ComparePlans
        plans={planMeta}
        activePlanId={plan.plan_id}
        workspaceId={workspace.id}
        workspaceSlug={workspace.slug}
        workspaceName={workspace.name}
        userEmail={userEmail}
      />

      {isAdmin && (
        <AdminPanel
          workspaceId={ctx.currentWorkspace.id}
          enableBillingTestMode={process.env.ENABLE_BILLING_TEST_MODE === "true"}
        />
      )}
    </div>
  );
}

