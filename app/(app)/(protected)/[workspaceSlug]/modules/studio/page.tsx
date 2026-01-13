import { redirect } from "next/navigation";
import { type ModuleStatus } from "@/components/app/ModuleGrid";
import ModuleGridWithSalesDialog from "@/components/app/ModuleGridWithSalesDialog";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { canAccess, getPlanMeta, planMeta } from "@/lib/entitlements";
import { ensureWorkspaceCookie } from "@/lib/workspaces";
import { studioChildren } from "@/lib/modules/catalog";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function StudioModulesPage({ params }: PageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");
  if (ctx.currentWorkspace.slug !== workspaceSlug) {
    redirect(`/${ctx.currentWorkspace.slug}/modules/studio`);
  }

  await ensureWorkspaceCookie(ctx.currentWorkspace.id);

  const db = supabaseAdmin();
  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .maybeSingle();

  const plan = getPlanMeta(subscription?.plan_id || "free_locked");
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const userEmail = ctx.user.email ?? "";
  const basePath = `/${ctx.currentWorkspace.slug}`;

  const moduleCards = studioChildren.map((module) => {
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

    return {
      key: module.key,
      name: module.name,
      description: module.short || module.description,
      status,
      href: !comingSoon ? `${basePath}/modules/${module.slug}` : undefined,
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Studio Suite</h1>
        <p className="text-sm text-muted-foreground">
          Office, Graph, and Tracks in one suite. Locked modules require an upgrade; coming soon
          items show their status.
        </p>
      </div>
      <ModuleGridWithSalesDialog
        modules={moduleCards}
        workspaceId={ctx.currentWorkspace.id}
        workspaceName={ctx.currentWorkspace.name}
        workspaceSlug={ctx.currentWorkspace.slug}
        userEmail={userEmail}
        planOptions={planMeta}
        defaultPlanId={plan.plan_id}
      />
    </div>
  );
}

