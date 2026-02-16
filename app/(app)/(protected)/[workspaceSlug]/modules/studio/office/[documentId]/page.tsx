import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FileText, ArrowLeft, Clock, User, Tag, Sparkles } from "lucide-react";
import { DocumentActions } from "@/components/studio/DocumentActions";
import { GenerateButton } from "@/components/studio/GenerateButton";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Check if content_json matches the AI-generated document structure */
function isAIDocument(content: unknown): content is { title?: string; sections: Array<{ heading: string; body: string }>; summary?: string } {
  if (!content || typeof content !== "object") return false;
  const c = content as Record<string, unknown>;
  return Array.isArray(c.sections) && c.sections.length > 0 && typeof c.sections[0]?.heading === "string";
}

type PageProps = {
  params: Promise<{ workspaceSlug: string; documentId: string }>;
};

export default async function DocumentDetailPage({ params }: PageProps) {
  const { workspaceSlug, documentId } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  const db = await supabaseServer();
  const t = await getTranslations("studio");

  const { data: doc, error } = await db
    .from("office_documents")
    .select("*")
    .eq("id", documentId)
    .eq("workspace_id", workspace.id)
    .single();

  if (error || !doc) {
    notFound();
  }

  const basePath = `/${workspaceSlug}/modules/studio/office`;

  return (
    <div className="space-y-6">
      {/* Back + Meta */}
      <div className="flex items-center gap-3">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1 rounded-lg border border-[#f5f5dc]/10 px-3 py-1.5 text-xs font-medium text-[#f5f5dc]/50 hover:text-[#f5f5dc] hover:border-[#f5f5dc]/20 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          {t("common.back")}
        </Link>
        <span className="rounded-full bg-[#f5f5dc]/5 px-2.5 py-0.5 text-[10px] font-medium text-[#f5f5dc]/40 capitalize">
          {doc.category}
        </span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[#f5f5dc]">{doc.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#f5f5dc]/30">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("common.updatedPrefix")} {new Date(doc.updated_at).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {t("common.createdPrefix")} {new Date(doc.created_at).toLocaleString()}
          </span>
          {doc.category && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {doc.category}
            </span>
          )}
        </div>
      </div>

      {/* Document Content */}
      <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-6">
        {doc.content_json ? (
          <div className="prose prose-invert prose-sm max-w-none">
            {/* AI-generated structured content */}
            {isAIDocument(doc.content_json) ? (
              <div className="space-y-6">
                {(doc.content_json as { summary?: string }).summary && (
                  <div className="flex items-start gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                    <p className="text-sm text-cyan-300/80">{(doc.content_json as { summary: string }).summary}</p>
                  </div>
                )}
                {((doc.content_json as { sections?: Array<{ heading: string; body: string }> }).sections ?? []).map((section, i) => (
                  <div key={i} className="space-y-2">
                    <h3 className="text-base font-semibold text-[#f5f5dc]/80 border-b border-[#f5f5dc]/10 pb-2">
                      {section.heading}
                    </h3>
                    <div className="space-y-2">
                      {section.body.split("\n").filter(Boolean).map((para, j) => (
                        <p key={j} className="text-sm leading-relaxed text-[#f5f5dc]/60">
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Regenerate */}
                <GenerateButton
                  type="document"
                  entityId={documentId}
                  prompt={doc.title}
                  hasPrompt={true}
                  meta={{ category: doc.category, title: doc.title }}
                  label={t("common.regenerate")}
                />
              </div>
            ) : typeof doc.content_json === "string" ? (
              <div className="space-y-3">
                {doc.content_json.split("\n").filter(Boolean).map((paragraph: string, i: number) => (
                  <p key={i} className="text-sm leading-relaxed text-[#f5f5dc]/70">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(doc.content_json as Record<string, unknown>).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3 rounded-lg bg-[#0a1229]/60 px-4 py-3">
                    <span className="text-xs font-semibold text-cyan-400/60 uppercase min-w-[100px]">{key}</span>
                    <span className="text-sm text-[#f5f5dc]/70 whitespace-pre-wrap">{typeof value === "string" ? value : JSON.stringify(value, null, 2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-[#f5f5dc]/15" />
            <p className="text-sm text-[#f5f5dc]/40 mb-4">{t("office.detail.emptyContent")}</p>
            <GenerateButton
              type="document"
              entityId={documentId}
              prompt={doc.title}
              hasPrompt={true}
              meta={{ category: doc.category, title: doc.title }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <DocumentActions
        documentId={documentId}
        workspaceSlug={workspaceSlug}
        title={doc.title}
        content={
          typeof doc.content_json === "string"
            ? doc.content_json
            : JSON.stringify(doc.content_json ?? "", null, 2)
        }
      />
    </div>
  );
}
