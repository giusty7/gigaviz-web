import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Plus, Clock, ArrowRight } from "lucide-react";
import LockedScreen from "@/components/app/LockedScreen";
import { getAppContext } from "@/lib/app-context";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function GraphDashboardsPage({ params }: PageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  const db = await supabaseServer();

  const { data: sub } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  const plan = getPlanMeta(sub?.plan_id || "free_locked");
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const ents = ctx.effectiveEntitlements ?? [];
  const hasAccess = canAccess(
    { plan_id: plan.plan_id, is_admin: isAdmin, effectiveEntitlements: ents },
    "graph"
  );

  if (!hasAccess) {
    return (
      <LockedScreen
        title="Dashboards are locked"
        description="Upgrade to access dashboard builder."
        workspaceSlug={workspaceSlug}
      />
    );
  }

  const { data: dashboards } = await db
    .from("graph_dashboards")
    .select("id, title, slug, description, is_public, updated_at")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  const items = dashboards ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#f5f5dc]">Dashboards</h1>
          <p className="mt-1 text-sm text-[#f5f5dc]/50">
            Compose charts into interactive dashboards and share with your team.
          </p>
        </div>
        <Link
          href={`/${workspaceSlug}/modules/studio/graph/dashboards/new`}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Dashboard
        </Link>
      </div>

      {/* Dashboard List */}
      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((dash) => (
            <Link
              key={dash.id}
              href={`/${workspaceSlug}/modules/studio/graph/dashboards/${dash.id}`}
              className="group block rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-5 transition-all hover:border-purple-500/20 hover:bg-[#0a1229]/60"
            >
              <div className="mb-3 flex items-start justify-between">
                <LayoutDashboard className="h-6 w-6 text-purple-400" />
                {dash.is_public && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                    Public
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-[#f5f5dc] mb-1 group-hover:text-purple-300 transition-colors">
                {dash.title}
              </h3>
              {dash.description && (
                <p className="text-xs text-[#f5f5dc]/40 mb-3 line-clamp-2">{dash.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] text-[#f5f5dc]/25">
                  <Clock className="h-3 w-3" />
                  Updated {new Date(dash.updated_at).toLocaleDateString()}
                </span>
                <ArrowRight className="h-3 w-3 text-[#f5f5dc]/20 group-hover:text-purple-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#f5f5dc]/10 bg-[#0a1229]/30 p-12 text-center">
          <LayoutDashboard className="mx-auto mb-3 h-10 w-10 text-[#f5f5dc]/15" />
          <p className="text-sm font-medium text-[#f5f5dc]/40">No dashboards yet</p>
          <p className="mt-1 text-xs text-[#f5f5dc]/25">
            Create your first dashboard to get started.
          </p>
        </div>
      )}
    </div>
  );
}
