import Link from "next/link";
import { redirect } from "next/navigation";
import PlanCard from "@/components/app/PlanCard";
import TokenCard from "@/components/app/TokenCard";
import ModuleGrid, { type ModuleStatus } from "@/components/app/ModuleGrid";
import ComparePlans from "@/components/app/ComparePlans";
import AdminPanel from "@/components/app/AdminPanel";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { appModules } from "@/lib/app-modules";
import { canAccess, getPlanMeta, planMeta } from "@/lib/entitlements";
import { getWallet } from "@/lib/tokens";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  params: { workspaceSlug: string };
};

export default async function AppHomePage({ params }: DashboardPageProps) {
  const ctx = await getAppContext(params.workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/app/onboarding");

  if (ctx.currentWorkspace.slug !== params.workspaceSlug) {
    redirect(`/app/${ctx.currentWorkspace.slug}/dashboard`);
  }

  await ensureWorkspaceCookie(ctx.currentWorkspace.id);

  const db = supabaseAdmin();
  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id, billing_mode, seat_limit, status")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .maybeSingle();

  const plan = getPlanMeta(subscription?.plan_id || "free_locked");
  const isAdmin = Boolean(ctx.profile?.is_admin);

  const wallet = await getWallet(ctx.currentWorkspace.id);
  const balance = Number(wallet.balance_bigint ?? 0);

  const { count: memberCount } = await db
    .from("workspace_members")
    .select("user_id", { count: "exact", head: true })
    .eq("workspace_id", ctx.currentWorkspace.id);

  const workspaceTypeLabel =
    ctx.currentWorkspace.workspace_type === "individual" ? "Individual" : "Team";
  const createdAtLabel = new Date(
    ctx.currentWorkspace.created_at
  ).toLocaleDateString();
  const basePath = `/app/${ctx.currentWorkspace.slug}`;

  const moduleCards = appModules.map((module) => {
    const comingSoon = module.availability === "coming_soon";
    const locked =
      !comingSoon &&
      module.feature &&
      !canAccess({ plan_id: plan.plan_id, is_admin: isAdmin }, module.feature);
    const status: ModuleStatus = comingSoon
      ? "coming_soon"
      : locked
      ? "locked"
      : "available";

    return {
      key: module.key,
      name: module.name,
      description: module.description,
      status,
      href:
        !comingSoon && !locked ? `${basePath}/modules/${module.slug}` : undefined,
    };
  });

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Workspace Overview</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-white/70">
            <div>
              <p className="text-xs text-white/50">Name</p>
              <p className="text-base text-white">{ctx.currentWorkspace.name}</p>
            </div>
            <div>
              <p className="text-xs text-white/50">Slug</p>
              <p className="text-base text-white">{ctx.currentWorkspace.slug}</p>
            </div>
            <div>
              <p className="text-xs text-white/50">Type</p>
              <p className="text-base text-white">{workspaceTypeLabel}</p>
            </div>
            <div>
              <p className="text-xs text-white/50">Created</p>
              <p className="text-base text-white">{createdAtLabel}</p>
            </div>
            <div>
              <p className="text-xs text-white/50">Members</p>
              <p className="text-base text-white">{memberCount ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <p className="text-sm text-white/60 mt-1">
            Jump straight to the most used areas.
          </p>
          <div className="mt-4 grid gap-2 text-sm">
            <Link
              href={`${basePath}/modules`}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/20"
            >
              Modules
            </Link>
            <Link
              href="/app/settings#members"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/20"
            >
              Members
            </Link>
            <Link
              href={`${basePath}/tokens`}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/20"
            >
              Tokens
            </Link>
            <Link
              href={`${basePath}/billing`}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/20"
            >
              Billing
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Status & Coming Next</h2>
        <ul className="mt-3 space-y-2 text-sm text-white/70">
          <li>Member invites dan approvals sedang disiapkan.</li>
          <li>Token top up akan tersedia setelah billing live.</li>
          <li>Dashboard insights akan menampilkan usage detail per modul.</li>
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
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Free Locked (Beta)</h2>
          <p className="text-sm text-white/70 mt-2">
            Free tier sementara dikunci untuk mencegah abuse dan menjaga
            reliability/compliance. Upgrade untuk membuka semua modul.
          </p>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">Modules</h2>
        <ModuleGrid
          modules={moduleCards}
        />
      </section>

      <ComparePlans plans={planMeta} />

      {isAdmin && (
        <AdminPanel
          workspaceId={ctx.currentWorkspace.id}
          enableBillingTestMode={process.env.ENABLE_BILLING_TEST_MODE === "true"}
        />
      )}
    </div>
  );
}
