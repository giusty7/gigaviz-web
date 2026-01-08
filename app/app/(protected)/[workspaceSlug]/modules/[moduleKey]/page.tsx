import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LockedScreen from "@/components/app/LockedScreen";
import { getAppModule } from "@/lib/app-modules";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

type ModuleDetailPageProps = {
  params: { workspaceSlug: string; moduleKey: string };
};

export default async function ModuleDetailPage({ params }: ModuleDetailPageProps) {
  const moduleConfig = getAppModule(params.moduleKey);
  if (!moduleConfig) notFound();

  const ctx = await getAppContext(params.workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/app/onboarding");

  if (ctx.currentWorkspace.slug !== params.workspaceSlug) {
    redirect(`/app/${ctx.currentWorkspace.slug}/modules/${moduleConfig.slug}`);
  }

  await ensureWorkspaceCookie(ctx.currentWorkspace.id);

  if (moduleConfig.availability === "coming_soon") {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <span className="text-xs uppercase text-white/50">Coming soon</span>
          <h1 className="text-xl font-semibold mt-2">{moduleConfig.name}</h1>
          <p className="text-sm text-white/60 mt-1">
            {moduleConfig.description}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {moduleConfig.summary ||
              "Modul ini akan hadir setelah fase MVP selesai."}
          </p>
        </div>
        <Link
          href={`/app/${ctx.currentWorkspace.slug}/modules`}
          className="text-sm text-gigaviz-gold hover:underline"
        >
          Kembali ke daftar modules
        </Link>
      </div>
    );
  }

  const db = supabaseAdmin();
  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .maybeSingle();

  const plan = getPlanMeta(subscription?.plan_id || "free_locked");
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const allowed = moduleConfig.feature
    ? canAccess(
        { plan_id: plan.plan_id, is_admin: isAdmin },
        moduleConfig.feature
      )
    : true;

  if (!allowed) {
    return (
      <LockedScreen
        title={moduleConfig.lockedTitle || `${moduleConfig.name} is locked`}
        description={moduleConfig.lockedDescription}
        workspaceSlug={ctx.currentWorkspace.slug}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{moduleConfig.name}</h1>
        <p className="text-sm text-white/60 mt-1">
          {moduleConfig.summary || moduleConfig.description}
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        {moduleConfig.note || "Module actions may consume tokens on execution."}
        <div className="mt-3">
          <Link
            href={`/app/${ctx.currentWorkspace.slug}/tokens`}
            className="text-xs font-semibold text-gigaviz-gold hover:underline"
          >
            Lihat token rates
          </Link>
        </div>
      </div>
      <Link
        href={`/app/${ctx.currentWorkspace.slug}/modules`}
        className="text-sm text-gigaviz-gold hover:underline"
      >
        Kembali ke daftar modules
      </Link>
    </div>
  );
}
