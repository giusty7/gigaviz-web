"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Sparkles, Loader2, Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Props = { params: Promise<{ workspaceSlug: string }> };

export default function NewDashboardPage({ params: _params }: Props) {
  const router = useRouter();
  const t = useTranslations("studio");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/studio/graph/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          prompt: prompt.trim() || undefined,
          is_public: isPublic,
        }),
      });

      if (res.ok) {
        const { data } = await res.json();
        const { workspaceSlug } = await _params;
        const detailUrl = `/${workspaceSlug}/modules/studio/graph/dashboards/${data.id}`;

        // Auto-trigger AI generation if prompt was provided
        if (prompt.trim()) {
          fetch("/api/studio/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "dashboard",
              dashboard_id: data.id,
              prompt: prompt.trim(),
              title: title.trim(),
            }),
          }).catch(() => {}); // Fire-and-forget
        }

        router.push(detailUrl);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Failed to create dashboard (${res.status})`);
      }
    } catch {
      setError(t("common.networkError"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#f5f5dc]">{t("dashboards.new.title")}</h1>
        <p className="mt-1 text-sm text-[#f5f5dc]/50">
          {t("dashboards.new.description")}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          {t("dashboards.new.titleLabel")}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("dashboards.new.titlePlaceholder")}
          className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          {t("common.descriptionOptionalLabel")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("dashboards.new.descriptionPlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 resize-none"
        />
      </div>

      {/* AI Prompt */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          <Sparkles className="h-3 w-3 text-purple-400" />
          {t("common.generateWithAI")}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("dashboards.new.aiPromptPlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 resize-none"
        />
        <p className="mt-1 text-[10px] text-[#f5f5dc]/25">
          {t("dashboards.new.aiPromptHint")}
        </p>
      </div>

      {/* Visibility */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          {t("dashboards.new.visibilityLabel")}
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setIsPublic(false)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
              !isPublic
                ? "border-purple-400 bg-purple-500/20 text-purple-300"
                : "border-[#f5f5dc]/10 bg-[#0a1229]/40 text-[#f5f5dc]/50 hover:border-[#f5f5dc]/20"
            )}
          >
            <Lock className="h-4 w-4" />
            {t("common.private")}
          </button>
          <button
            onClick={() => setIsPublic(true)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
              isPublic
                ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                : "border-[#f5f5dc]/10 bg-[#0a1229]/40 text-[#f5f5dc]/50 hover:border-[#f5f5dc]/20"
            )}
          >
            <Globe className="h-4 w-4" />
            {t("common.public")}
          </button>
        </div>
        <p className="mt-1 text-[10px] text-[#f5f5dc]/25">
          {t("dashboards.new.publicHint")}
        </p>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-dashed border-purple-500/20 bg-[#0a1229]/30 p-8 text-center">
        <LayoutDashboard className="mx-auto mb-2 h-8 w-8 text-purple-400/30" />
        <p className="text-xs text-[#f5f5dc]/30">
          {t("dashboards.new.previewHint")}
        </p>
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={!title.trim() || creating}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-purple-600 px-6 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {creating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.creating")}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {t("dashboards.new.createButton")}
          </>
        )}
      </button>
    </div>
  );
}
