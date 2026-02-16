import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ArrowLeft,
  BarChart3,
  Clock,
  Globe,
  Lock,
} from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { DashboardActions } from "@/components/studio/DashboardActions";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string; dashboardId: string }>;
};

export default async function DashboardDetailPage({ params }: PageProps) {
  const { workspaceSlug, dashboardId } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  const db = await supabaseServer();

  const { data: dashboard, error } = await db
    .from("graph_dashboards")
    .select("*")
    .eq("id", dashboardId)
    .eq("workspace_id", workspace.id)
    .single();

  if (error || !dashboard) {
    notFound();
  }

  const t = await getTranslations("studio");
  const basePath = `/${workspaceSlug}/modules/studio/graph/dashboards`;

  return (
    <div className="space-y-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1 rounded-lg border border-[#f5f5dc]/10 px-3 py-1.5 text-xs font-medium text-[#f5f5dc]/50 hover:text-[#f5f5dc] hover:border-[#f5f5dc]/20 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          {t("dashboards.backLink")}
        </Link>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
            dashboard.is_public
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-[#f5f5dc]/5 text-[#f5f5dc]/40 border border-[#f5f5dc]/10"
          }`}
        >
          {dashboard.is_public ? (
            <>
              <Globe className="h-3 w-3" /> {t("common.public")}
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" /> {t("common.private")}
            </>
          )}
        </span>
      </div>

      {/* Title */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <LayoutDashboard className="h-6 w-6 text-purple-400" />
          <h1 className="text-xl font-bold text-[#f5f5dc]">{dashboard.title}</h1>
        </div>
        {dashboard.description && (
          <p className="text-sm text-[#f5f5dc]/50 ml-9">{dashboard.description}</p>
        )}
        <p className="mt-2 flex items-center gap-1 text-xs text-[#f5f5dc]/30 ml-9">
          <Clock className="h-3 w-3" />
          {t("common.updatedPrefix")} {new Date(dashboard.updated_at).toLocaleString()}
        </p>
      </div>

      {/* Actions */}
      <DashboardActions
        dashboardId={dashboardId}
        workspaceSlug={workspaceSlug}
        title={dashboard.title}
        description={dashboard.description || ""}
        isPublic={dashboard.is_public ?? false}
      />

      {/* Layout / Content Area */}
      <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-6">
        {dashboard.layout_json ? (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
              {t("dashboards.detail.layoutTitle")}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.isArray(dashboard.layout_json)
                ? (dashboard.layout_json as Array<Record<string, unknown>>).map((item, i) => (
                    <div key={i} className="rounded-lg border border-purple-500/10 bg-[#0a1229]/60 p-4">
                      <div className="mb-2 flex h-20 items-center justify-center rounded-lg border border-dashed border-purple-500/20 bg-[#0a1229]/30">
                        <BarChart3 className="h-6 w-6 text-purple-400/20" />
                      </div>
                      <p className="text-xs font-medium text-[#f5f5dc]/50 truncate">
                        {(item.title as string) || (item.chart_id as string) || `Widget ${i + 1}`}
                      </p>
                    </div>
                  ))
                : (
                  <div className="col-span-full rounded-lg border border-dashed border-purple-500/20 bg-[#0a1229]/30 p-8 text-center">
                    <LayoutDashboard className="mx-auto mb-2 h-8 w-8 text-purple-400/20" />
                    <p className="text-xs text-[#f5f5dc]/30">{t("dashboards.detail.layoutTitle")}</p>
                  </div>
                )}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <LayoutDashboard className="mx-auto mb-3 h-10 w-10 text-[#f5f5dc]/15" />
            <p className="text-sm text-[#f5f5dc]/40">
              {t("dashboards.detail.emptyCharts")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
