"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  FileSpreadsheet,
  FileType,
  Receipt,
  LayoutTemplate,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

const DOC_TYPES = [
  { key: "document", label: "Document", description: "Word-style document with AI writing", icon: FileType, color: "blue" },
  { key: "spreadsheet", label: "Spreadsheet", description: "Excel-style data with AI formulas", icon: FileSpreadsheet, color: "green" },
  { key: "report", label: "Report", description: "AI-generated business report", icon: LayoutTemplate, color: "purple" },
  { key: "invoice", label: "Invoice", description: "Professional invoice from data", icon: Receipt, color: "amber" },
  { key: "presentation", label: "Presentation", description: "Slide deck with AI content", icon: FileText, color: "pink" },
] as const;

export default function NewDocumentPage({ params: _params }: Props) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>("document");
  const [title, setTitle] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/studio/office/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category: selectedType,
          ai_prompt: aiPrompt.trim() || undefined,
        }),
      });

      if (res.ok) {
        const { data } = await res.json();
        const { workspaceSlug } = await _params;
        router.push(`/${workspaceSlug}/modules/studio/office/${data.id}`);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Failed to create document (${res.status})`);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setCreating(false);
    }
  };

  const colorMap: Record<string, string> = {
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    pink: "border-pink-500/30 bg-pink-500/10 text-pink-400",
  };

  const selectedColor: Record<string, string> = {
    blue: "border-blue-400 bg-blue-500/20 ring-1 ring-blue-400/30",
    green: "border-emerald-400 bg-emerald-500/20 ring-1 ring-emerald-400/30",
    purple: "border-purple-400 bg-purple-500/20 ring-1 ring-purple-400/30",
    amber: "border-amber-400 bg-amber-500/20 ring-1 ring-amber-400/30",
    pink: "border-pink-400 bg-pink-500/20 ring-1 ring-pink-400/30",
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#f5f5dc]">New Document</h1>
        <p className="mt-1 text-sm text-[#f5f5dc]/50">
          Choose a document type and let AI help you create it.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Document Type Selector */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          Document Type
        </label>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          {DOC_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.key;
            return (
              <button
                key={type.key}
                onClick={() => setSelectedType(type.key)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
                  isSelected
                    ? selectedColor[type.color]
                    : `border-[#f5f5dc]/10 bg-[#0a1229]/40 hover:border-[#f5f5dc]/20`
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6",
                    isSelected
                      ? colorMap[type.color].split(" ").pop()
                      : "text-[#f5f5dc]/40"
                  )}
                />
                <span className={cn("text-xs font-semibold", isSelected ? "text-[#f5f5dc]" : "text-[#f5f5dc]/60")}>
                  {type.label}
                </span>
                <span className="text-[10px] text-[#f5f5dc]/30 leading-tight">
                  {type.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Monthly Sales Report Q1 2026"
          className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
        />
      </div>

      {/* AI Prompt */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          <Sparkles className="h-3 w-3 text-cyan-400" />
          AI Instructions (Optional)
        </label>
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Describe what you want the document to contain. AI will generate the initial content for you..."
          rows={4}
          className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 resize-none"
        />
        <p className="mt-1 text-[10px] text-[#f5f5dc]/25">
          e.g. &quot;Create a Q1 sales report with revenue breakdown by product, customer acquisition metrics, and growth projections.&quot;
        </p>
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={!title.trim() || creating}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-600 px-6 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {creating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Create Document
          </>
        )}
      </button>
    </div>
  );
}
