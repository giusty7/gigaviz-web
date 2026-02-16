"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles, Loader2, AlertCircle, Coins } from "lucide-react";

type GenerateButtonProps = {
  type: "document" | "image" | "chart" | "video" | "music" | "dashboard";
  /** The ID of the entity to generate for */
  entityId: string;
  /** The prompt to use for generation */
  prompt: string;
  /** Whether a prompt exists */
  hasPrompt: boolean;
  /** Additional fields required for specific types */
  meta?: Record<string, unknown>;
  /** Custom label override */
  label?: string;
  /** Callback after successful generation */
  onSuccess?: () => void;
  className?: string;
};

export function GenerateButton({
  type,
  entityId,
  prompt,
  hasPrompt,
  meta = {},
  label,
  onSuccess,
  className = "",
}: GenerateButtonProps) {
  const t = useTranslations("studio");
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!hasPrompt || !prompt.trim()) return;
    setGenerating(true);
    setError(null);

    try {
      // Build request body based on type
      const body: Record<string, unknown> = { type, prompt };

      switch (type) {
        case "document":
          body.document_id = entityId;
          body.category = meta.category || "document";
          body.title = meta.title || "Untitled";
          break;
        case "image":
          body.image_id = entityId;
          body.style = meta.style || "photo-realistic";
          body.width = meta.width || 1024;
          body.height = meta.height || 1024;
          break;
        case "chart":
          body.chart_id = entityId;
          body.chart_type = meta.chart_type;
          break;
        case "video":
          body.video_id = entityId;
          body.style = meta.style || "marketing";
          body.duration_seconds = meta.duration_seconds || 30;
          break;
        case "music":
          body.music_id = entityId;
          body.genre = meta.genre || "pop";
          body.bpm = meta.bpm || 120;
          body.key_signature = meta.key_signature || "C";
          body.duration_seconds = meta.duration_seconds || 30;
          break;
        case "dashboard":
          body.dashboard_id = entityId;
          body.title = meta.title || "Dashboard";
          break;
      }

      const res = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else if (res.status === 402) {
        setError(t("common.insufficientTokens"));
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t("common.generationFailed"));
      }
    } catch {
      setError(t("common.networkError"));
    } finally {
      setGenerating(false);
    }
  };

  if (!hasPrompt) return null;

  return (
    <div className={className}>
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-purple-500/30 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.generating")}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {label || t("common.generateWithAI")}
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error.includes("token") ? (
            <Coins className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          {error}
        </div>
      )}
    </div>
  );
}
