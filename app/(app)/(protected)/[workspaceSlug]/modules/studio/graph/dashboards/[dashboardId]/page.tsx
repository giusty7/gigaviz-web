import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ArrowLeft,
  Clock,
  Globe,
  Lock,
} from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { DashboardActions } from "@/components/studio/DashboardActions";
import { DashboardRenderer } from "@/components/studio/DashboardRenderer";
import { GenerateButton } from "@/components/studio/GenerateButton";
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
      <div className="space-y-4">
        {dashboard.layout_json && Array.isArray(dashboard.layout_json) && dashboard.layout_json.length > 0 ? (
          <>
            <DashboardRenderer
              widgets={dashboard.layout_json as Array<{
                title: string;
                type: "chart" | "stat" | "table" | "text";
                chart_type?: string;
                data?: { labels?: string[]; datasets?: Array<{ label: string; data: number[]; backgroundColor?: string | string[]; borderColor?: string }> };
                value?: string;
                description?: string;
                w?: number;
                h?: number;
              }>}
            />
            {/* Regenerate */}
            <GenerateButton
              type="dashboard"
              entityId={dashboardId}
              prompt={dashboard.description || dashboard.title}
              hasPrompt={Boolean(dashboard.description || dashboard.title)}
              meta={{ title: dashboard.title }}
              label={t("common.regenerate")}
            />
          </>
        ) : (
          <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-6">
            <div className="py-8 text-center">
              <LayoutDashboard className="mx-auto mb-3 h-10 w-10 text-[#f5f5dc]/15" />
              <p className="text-sm text-[#f5f5dc]/40 mb-4">
                {t("dashboards.detail.emptyCharts")}
              </p>
              <GenerateButton
                type="dashboard"
                entityId={dashboardId}
                prompt={dashboard.description || dashboard.title || "Business analytics dashboard"}
                hasPrompt={true}
                meta={{ title: dashboard.title }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
