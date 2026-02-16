import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FolderOpen, FileText, Star, ArrowRight } from "lucide-react";
import LockedScreen from "@/components/app/LockedScreen";
import { getAppContext } from "@/lib/app-context";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function OfficeTemplatesPage({ params }: PageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  const db = await supabaseServer();
  const t = await getTranslations("studio");

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
    "office"
  );

  if (!hasAccess) {
    return (
      <LockedScreen
        title={t("office.templates.lockedTitle")}
        description={t("office.templates.lockedDescription")}
        workspaceSlug={workspaceSlug}
      />
    );
  }

  const { data: templates } = await db
    .from("office_templates")
    .select("id, title, slug, description, category, tags, usage_count, is_public")
    .eq("workspace_id", workspace.id)
    .order("usage_count", { ascending: false })
    .limit(50);

  const allTemplates = templates ?? [];
  const categories = [...new Set(allTemplates.map((t) => t.category))];
  const basePath = `/${workspaceSlug}/modules/studio/office`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#f5f5dc]">{t("office.templates.title")}</h1>
        <p className="mt-1 text-sm text-[#f5f5dc]/50">
          {t("office.templates.description")}
        </p>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-[#f5f5dc]/10 bg-[#0a1229]/40 px-3 py-1 text-xs font-medium text-[#f5f5dc]/50 capitalize"
            >
              {cat} ({allTemplates.filter((t) => t.category === cat).length})
            </span>
          ))}
        </div>
      )}

      {/* Template Grid */}
      {allTemplates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allTemplates.map((template) => (
            <div
              key={template.id}
              className="group rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-5 transition-all hover:border-cyan-500/20 hover:bg-[#0a1229]/60"
            >
              <div className="mb-3 flex items-start justify-between">
                <FolderOpen className="h-5 w-5 text-blue-400" />
                <div className="flex items-center gap-1 text-xs text-[#f5f5dc]/30">
                  <Star className="h-3 w-3" />
                  <span>{t("office.templates.usageCount", { count: template.usage_count })}</span>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-[#f5f5dc] mb-1">{template.title}</h3>
              {template.description && (
                <p className="text-xs text-[#f5f5dc]/40 mb-3 line-clamp-2">{template.description}</p>
              )}
              <div className="flex flex-wrap gap-1 mb-4">
                {(template.tags ?? []).slice(0, 3).map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href={`${basePath}/new?template=${template.id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {t("office.templates.useTemplate")} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#f5f5dc]/10 bg-[#0a1229]/30 p-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-[#f5f5dc]/15" />
          <p className="text-sm font-medium text-[#f5f5dc]/40">{t("office.templates.emptyTitle")}</p>
          <p className="mt-1 text-xs text-[#f5f5dc]/25">
            {t("office.templates.emptyDescription")}
          </p>
        </div>
      )}
    </div>
  );
}
