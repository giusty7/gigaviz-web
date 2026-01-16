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
import { DashboardWidgetsSection } from "@/components/app/dashboard-widgets";
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
    <div className="relative space-y-8">
      {/* Cyber-Batik Pattern Background */}
      <div className="pointer-events-none fixed inset-0 batik-pattern opacity-[0.03]" aria-hidden />

      <SetPasswordModal />
      
      {/* Premium Imperium Dashboard Widgets */}
      <DashboardWidgetsSection workspaceSlug={workspace.slug} />
      
      <QuickAccessSection workspaceId={workspace.id} modules={moduleCards} />
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: "radial-gradient(ellipse at top right, rgba(212, 175, 55, 0.08) 0%, transparent 50%)" }} aria-hidden />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4af37]/10 text-[#d4af37]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </span>
              <h2 className="text-lg font-semibold text-[#f5f5dc]">Workspace Overview</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className="rounded-xl border border-[#d4af37]/10 bg-[#050a18]/50 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/40">Name</p>
                <p className="mt-0.5 font-semibold text-[#f5f5dc]">{ctx.currentWorkspace.name}</p>
              </div>
              <div className="rounded-xl border border-[#d4af37]/10 bg-[#050a18]/50 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/40">Slug</p>
                <p className="mt-0.5 font-mono text-sm text-[#d4af37]">{ctx.currentWorkspace.slug}</p>
              </div>
              <div className="rounded-xl border border-[#d4af37]/10 bg-[#050a18]/50 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/40">Type</p>
                <p className="mt-0.5 font-semibold text-[#f5f5dc]">{workspaceTypeLabel}</p>
              </div>
              <div className="rounded-xl border border-[#d4af37]/10 bg-[#050a18]/50 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/40">Created</p>
                <p className="mt-0.5 font-semibold text-[#f5f5dc]">{createdAtLabel}</p>
              </div>
              <div className="rounded-xl border border-[#10b981]/20 bg-[#10b981]/5 px-3 py-2.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#10b981]/70">Members</p>
                    <p className="mt-0.5 text-lg font-bold text-[#10b981]">{memberCount ?? 0}</p>
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10b981]/15 text-[#10b981]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-[#e11d48]/20 bg-[#0a1229]/80 p-6 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: "radial-gradient(ellipse at bottom left, rgba(225, 29, 72, 0.08) 0%, transparent 50%)" }} aria-hidden />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#e11d48]">⚡</span>
              <h2 className="text-lg font-semibold text-[#f5f5dc]">Quick Actions</h2>
            </div>
            <p className="text-sm text-[#f5f5dc]/50 mb-4">
              Jump straight to the most used areas.
            </p>
            <div className="grid gap-2 text-sm">
              <Link
                href={`${basePath}/modules`}
                className="group flex items-center justify-between rounded-xl border border-[#d4af37]/10 bg-[#050a18]/50 px-4 py-2.5 font-semibold text-[#f5f5dc] transition-all hover:border-[#d4af37]/40 hover:bg-[#d4af37]/5"
              >
                Modules
                <span className="text-[#d4af37] opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </Link>
              <Link
                href={`${basePath}/settings#members`}
                className="group flex items-center justify-between rounded-xl border border-[#d4af37]/10 bg-[#050a18]/50 px-4 py-2.5 font-semibold text-[#f5f5dc] transition-all hover:border-[#d4af37]/40 hover:bg-[#d4af37]/5"
              >
                Members
                <span className="text-[#d4af37] opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </Link>
              <Link
                href={`${basePath}/tokens`}
                className="group flex items-center justify-between rounded-xl border border-[#d4af37]/10 bg-[#050a18]/50 px-4 py-2.5 font-semibold text-[#f5f5dc] transition-all hover:border-[#d4af37]/40 hover:bg-[#d4af37]/5"
              >
                Tokens
                <span className="text-[#d4af37] opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </Link>
              <Link
                href={`${basePath}/billing`}
                className="group flex items-center justify-between rounded-xl border border-[#d4af37]/10 bg-[#050a18]/50 px-4 py-2.5 font-semibold text-[#f5f5dc] transition-all hover:border-[#d4af37]/40 hover:bg-[#d4af37]/5"
              >
                Billing
                <span className="text-[#d4af37] opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-[#d4af37]/15 bg-[#0a1229]/60 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#d4af37]">📢</span>
          <h2 className="text-lg font-semibold text-[#f5f5dc]">Product Updates</h2>
        </div>
        <ul className="space-y-2 text-sm text-[#f5f5dc]/60">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#10b981]"></span>
            Member invites and approvals are being finalized.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4af37]"></span>
            Token top-up goes live right after billing launch.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e11d48]"></span>
            Dashboard insights will show per-module usage details.
          </li>
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
        <section className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-[#0a1229]/60 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-400">🔒</span>
            <h2 className="text-lg font-semibold text-[#f5f5dc]">Free Locked (Beta)</h2>
          </div>
          <p className="text-sm text-[#f5f5dc]/60">
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

