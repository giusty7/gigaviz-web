"use client";

import { Film, Clock, Music, FileText, Play } from "lucide-react";
import { useTranslations } from "next-intl";

type Scene = {
  scene: number;
  description: string;
  duration_seconds: number;
  visual_notes: string;
};

type VideoStoryboardProps = {
  storyboard: Scene[];
  script?: string;
  musicSuggestion?: string;
  className?: string;
};

export function VideoStoryboard({
  storyboard,
  script,
  musicSuggestion,
  className = "",
}: VideoStoryboardProps) {
  const t = useTranslations("studioRenderers.storyboard");
  if (!storyboard || storyboard.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed border-[#f5f5dc]/10 bg-[#0a1229]/30 p-12 ${className}`}>
        <div className="text-center">
          <Film className="mx-auto mb-2 h-8 w-8 text-purple-400/20" />
          <p className="text-xs text-[#f5f5dc]/30">{t("noData")}</p>
        </div>
      </div>
    );
  }

  const totalDuration = storyboard.reduce((sum, s) => sum + s.duration_seconds, 0);

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Timeline Header */}
      <div className="flex items-center gap-3">
        <Film className="h-5 w-5 text-purple-400" />
        <h3 className="text-sm font-semibold text-[#f5f5dc]/70">
          {t("title", { count: storyboard.length })}
        </h3>
        <span className="ml-auto flex items-center gap-1 text-xs text-[#f5f5dc]/40">
          <Clock className="h-3 w-3" />
          {t("totalDuration", { seconds: totalDuration })}
        </span>
      </div>

      {/* Beta Note */}
      <p className="text-[10px] text-[#f5f5dc]/30 italic">
        {t("betaNote")}
      </p>

      {/* Timeline Bar */}
      <div className="flex h-2 overflow-hidden rounded-full bg-[#0a1229]/60">
        {storyboard.map((scene, i) => {
          const width = (scene.duration_seconds / totalDuration) * 100;
          const colors = [
            "bg-purple-500",
            "bg-cyan-500",
            "bg-emerald-500",
            "bg-amber-500",
            "bg-pink-500",
            "bg-blue-500",
            "bg-teal-500",
            "bg-rose-500",
          ];
          return (
            <div
              key={i}
              className={`${colors[i % colors.length]} transition-all hover:brightness-125`}
              style={{ width: `${width}%` }}
              title={`Scene ${scene.scene}: ${scene.duration_seconds}s`}
            />
          );
        })}
      </div>

      {/* Scene Cards */}
      <div className="space-y-3">
        {storyboard.map((scene, i) => (
          <div
            key={i}
            className="group rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-4 transition-all hover:border-purple-500/20"
          >
            <div className="flex items-start gap-3">
              {/* Scene number */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-sm font-bold text-purple-400">
                {scene.scene}
              </div>

              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#f5f5dc]/60">
                    {t("scene", { number: scene.scene })}
                  </span>
                  <span className="flex items-center gap-0.5 rounded-full bg-[#f5f5dc]/5 px-2 py-0.5 text-[10px] text-[#f5f5dc]/40">
                    <Clock className="h-2.5 w-2.5" />
                    {scene.duration_seconds}s
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#f5f5dc]/70">
                  {scene.description}
                </p>
                {scene.visual_notes && (
                  <p className="mt-1.5 text-xs italic text-[#f5f5dc]/30">
                    🎬 {scene.visual_notes}
                  </p>
                )}
              </div>

              {/* Preview placeholder */}
              <div className="hidden shrink-0 sm:flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-[#f5f5dc]/10 bg-[#0a1229]/30">
                <Play className="h-4 w-4 text-[#f5f5dc]/15" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Script */}
      {script && (
        <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-semibold text-[#f5f5dc]/50">{t("narrationScript")}</h4>
          </div>
          <p className="text-sm leading-relaxed text-[#f5f5dc]/60 whitespace-pre-wrap">{script}</p>
        </div>
      )}

      {/* Music Suggestion */}
      {musicSuggestion && (
        <div className="flex items-start gap-3 rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-4">
          <Music className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <h4 className="text-xs font-semibold text-[#f5f5dc]/50">{t("musicSuggestion")}</h4>
            <p className="mt-1 text-sm text-[#f5f5dc]/60">{musicSuggestion}</p>
          </div>
        </div>
      )}
    </div>
  );
}
