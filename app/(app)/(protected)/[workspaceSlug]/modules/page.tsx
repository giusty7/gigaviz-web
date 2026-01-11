import { redirect } from "next/navigation";
import ModuleGrid, { type ModuleStatus } from "@/components/app/ModuleGrid";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import { ensureWorkspaceCookie } from "@/lib/workspaces";
import { topLevelModules } from "@/lib/modules/catalog";

export const dynamic = "force-dynamic";

type ModulesPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function ModulesPage({ params }: ModulesPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;

  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/modules`);
  }

  await ensureWorkspaceCookie(workspace.id);

  const db = supabaseAdmin();
  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  const plan = getPlanMeta(subscription?.plan_id || "free_locked");
  const isAdmin = Boolean(ctx.profile?.is_admin);
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
        : "preview";

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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Modules</h1>
        <p className="text-sm text-muted-foreground">
          Jelajahi modul yang tersedia. Modul dengan status Preview bisa dibuka untuk melihat
          tampilan.
        </p>
      </div>
      <ModuleGrid modules={moduleCards} />
    </div>
  );
}

