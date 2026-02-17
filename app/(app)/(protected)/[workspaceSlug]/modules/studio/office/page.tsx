import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  FileText,
  Plus,
  FolderOpen,
  Clock,
  FileSpreadsheet,
  FileType,
  FileImage,
  Receipt,
  LayoutTemplate,
} from "lucide-react";
import LockedScreen from "@/components/app/LockedScreen";
import { getAppContext } from "@/lib/app-context";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

const categoryIcons: Record<string, typeof FileText> = {
  spreadsheet: FileSpreadsheet,
  document: FileType,
  presentation: FileImage,
  invoice: Receipt,
  report: LayoutTemplate,
};

export default async function OfficeDocumentsPage({ params }: PageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  const db = await supabaseServer();
  const t = await getTranslations("studio");

  // Check entitlement
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
        title={t("office.lockedTitle")}
        description={t("office.lockedDescription")}
        workspaceSlug={workspaceSlug}
      />
    );
  }

  // Fetch data in parallel
  const [docsResult, templatesResult] = await Promise.all([
    db
      .from("office_documents")
      .select("id, title, category, updated_at, created_by")
      .eq("workspace_id", workspace.id)
      .order("updated_at", { ascending: false })
      .limit(20),
    db
      .from("office_templates")
      .select("id", { count: "exact", head: true })
      .or(`workspace_id.eq.${workspace.id},is_public.eq.true`),
  ]);

  const documents = docsResult.data ?? [];
  const templateCount = templatesResult.count ?? 0;
  const basePath = `/${workspaceSlug}/modules/studio/office`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#f5f5dc]">{t("office.title")}</h1>
          <p className="mt-1 text-sm text-[#f5f5dc]/50">
            {t("office.description")}
          </p>
        </div>
        <Link
          href={`${basePath}/new`}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-cyan-600 px-4 text-sm font-medium text-white transition-colors hover:bg-cyan-500"
        >
          <Plus className="h-4 w-4" />
          {t("office.newDocument")}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-blue-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <FileText className="h-7 w-7 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-[#f5f5dc]">{documents.length}</p>
              <p className="text-xs text-[#f5f5dc]/40">{t("office.stats.documents")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-purple-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-7 w-7 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-[#f5f5dc]">{templateCount}</p>
              <p className="text-xs text-[#f5f5dc]/40">{t("office.stats.templates")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <Clock className="h-7 w-7 text-cyan-400" />
            <div>
              <p className="text-2xl font-bold text-[#f5f5dc]">
                {documents.length > 0
                  ? new Date(documents[0].updated_at).toLocaleDateString()
                  : "—"}
              </p>
              <p className="text-xs text-[#f5f5dc]/40">{t("office.stats.lastUpdated")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#f5f5dc]/60 uppercase tracking-wider">
          {t("office.recentDocuments")}
        </h2>
        {documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => {
              const Icon = categoryIcons[doc.category] || FileText;
              return (
                <Link
                  key={doc.id}
                  href={`${basePath}/${doc.id}`}
                  className="flex items-center justify-between rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-4 transition-all hover:border-cyan-500/20 hover:bg-[#0a1229]/60"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-[#f5f5dc]/40" />
                    <div>
                      <p className="text-sm font-medium text-[#f5f5dc]">{doc.title}</p>
                      <p className="text-xs text-[#f5f5dc]/30">
                        {new Date(doc.updated_at).toLocaleDateString()} · {doc.category}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#f5f5dc]/5 px-2.5 py-0.5 text-[10px] font-medium text-[#f5f5dc]/40 capitalize">
                    {doc.category}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#f5f5dc]/10 bg-[#0a1229]/30 p-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-[#f5f5dc]/15" />
            <p className="text-sm font-medium text-[#f5f5dc]/40">{t("office.emptyTitle")}</p>
            <p className="mt-1 text-xs text-[#f5f5dc]/25">
              {t("office.emptyDescription")}
            </p>
            <Link
              href={`${basePath}/new`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-600/80 px-4 py-2 text-xs font-medium text-white hover:bg-cyan-500"
            >
              <Plus className="h-3 w-3" /> {t("office.createDocument")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
