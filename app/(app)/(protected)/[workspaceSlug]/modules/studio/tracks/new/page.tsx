"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Workflow, Sparkles, Loader2, Zap, Clock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Props = { params: Promise<{ workspaceSlug: string }> };

const TRIGGER_TYPES = [
  { key: "manual", icon: Zap },
  { key: "schedule", icon: Clock },
  { key: "webhook", icon: Globe },
] as const;

export default function NewWorkflowPage({ params: _params }: Props) {
  const t = useTranslations("studio");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("manual");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/studio/tracks/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          triggers_json: { type: triggerType },
        }),
      });

      if (res.ok) {
        const { data } = await res.json();
        const { workspaceSlug } = await _params;
        router.push(`/${workspaceSlug}/modules/studio/tracks/${data.id}`);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Failed to create workflow (${res.status})`);
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
        <h1 className="text-xl font-bold text-[#f5f5dc]">{t("tracks.new.title")}</h1>
        <p className="mt-1 text-sm text-[#f5f5dc]/50">
          {t("tracks.new.description")}
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
          {t("tracks.new.nameLabel")}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("tracks.new.namePlaceholder")}
          className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
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
          placeholder={t("tracks.new.descriptionPlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-4 py-2.5 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30 resize-none"
        />
      </div>

      {/* Trigger Type */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">
          {t("tracks.new.triggerLabel")}
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {TRIGGER_TYPES.map((trigger) => {
            const Icon = trigger.icon;
            const isSelected = triggerType === trigger.key;
            return (
              <button
                key={trigger.key}
                onClick={() => setTriggerType(trigger.key)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
                  isSelected
                    ? "border-teal-400 bg-teal-500/20 ring-1 ring-teal-400/30"
                    : "border-[#f5f5dc]/10 bg-[#0a1229]/40 hover:border-[#f5f5dc]/20"
                )}
              >
                <Icon className={cn("h-6 w-6", isSelected ? "text-teal-400" : "text-[#f5f5dc]/40")} />
                <span className={cn("text-xs font-semibold", isSelected ? "text-[#f5f5dc]" : "text-[#f5f5dc]/60")}>
                  {t(`tracks.new.triggers.${trigger.key}`)}
                </span>
                <span className="text-[10px] text-[#f5f5dc]/30">{t(`tracks.new.triggers.${trigger.key}Desc`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-dashed border-teal-500/20 bg-[#0a1229]/30 p-8 text-center">
        <Workflow className="mx-auto mb-2 h-8 w-8 text-teal-400/30" />
        <p className="text-xs text-[#f5f5dc]/30">
          {t("tracks.new.previewHint")}
        </p>
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={!title.trim() || creating}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-teal-600 px-6 text-sm font-medium text-white transition-colors hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {creating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.creating")}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {t("tracks.new.createButton")}
          </>
        )}
      </button>
    </div>
  );
}
