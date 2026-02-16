import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowLeft, Clock, User, Tag } from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
          Back
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
            Updated {new Date(doc.updated_at).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            Created {new Date(doc.created_at).toLocaleString()}
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
            <pre className="whitespace-pre-wrap text-sm text-[#f5f5dc]/70 font-mono">
              {typeof doc.content_json === "string"
                ? doc.content_json
                : JSON.stringify(doc.content_json, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-[#f5f5dc]/15" />
            <p className="text-sm text-[#f5f5dc]/40">This document has no content yet.</p>
            <p className="mt-1 text-xs text-[#f5f5dc]/25">
              Use the editor to add content or generate with AI.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          disabled
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-cyan-600/50 px-4 text-xs font-medium text-white/60 cursor-not-allowed"
          title="Rich editor coming soon"
        >
          Edit Document
        </button>
        <button
          disabled
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#f5f5dc]/10 px-4 text-xs font-medium text-[#f5f5dc]/30 cursor-not-allowed"
          title="PDF export coming soon"
        >
          Export PDF
        </button>
        <button
          disabled
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#f5f5dc]/10 px-4 text-xs font-medium text-[#f5f5dc]/30 cursor-not-allowed"
          title="WhatsApp integration coming soon"
        >
          Send via WhatsApp
        </button>
      </div>
    </div>
  );
}
