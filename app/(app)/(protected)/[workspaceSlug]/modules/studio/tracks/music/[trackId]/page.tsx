import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MusicIcon, ArrowLeft, Clock, Tag, Gauge, Music2, Info } from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { MusicActions } from "@/components/studio/MusicActions";
import { WaveformVisualizer } from "@/components/studio/WaveformVisualizer";
import { GenerateButton } from "@/components/studio/GenerateButton";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string; trackId: string }>;
};

const genreColors: Record<string, string> = {
  "pop": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "rock": "bg-red-500/10 text-red-400 border-red-500/20",
  "electronic": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "ambient": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "jazz": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "classical": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "hip-hop": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "lo-fi": "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "cinematic": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "jingle": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "podcast-intro": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "sound-effect": "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

export default async function MusicDetailPage({ params }: PageProps) {
  const { workspaceSlug, trackId } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const db = await supabaseServer();
  const { data: track, error } = await db
    .from("tracks_music")
    .select("*")
    .eq("id", trackId)
    .eq("workspace_id", ctx.currentWorkspace.id)
    .single();

  if (error || !track) notFound();

  const t = await getTranslations("studio");
  const basePath = `/${workspaceSlug}/modules/studio/tracks/music`;
  const color = genreColors[track.genre] || "bg-[#f5f5dc]/5 text-[#f5f5dc]/40 border-[#f5f5dc]/10";

  return (
    <div className="space-y-6">
      {/* Back + Meta */}
      <div className="flex items-center gap-3">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1 rounded-lg border border-[#f5f5dc]/10 px-3 py-1.5 text-xs font-medium text-[#f5f5dc]/50 hover:text-[#f5f5dc] hover:border-[#f5f5dc]/20 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          {t("music.backLink")}
        </Link>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize ${color}`}>
          <MusicIcon className="h-3 w-3" />
          {track.genre}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
          track.status === "completed" ? "bg-emerald-500/15 text-emerald-400" :
          track.status === "generating" ? "bg-amber-500/15 text-amber-400" :
          track.status === "failed" ? "bg-red-500/15 text-red-400" :
          "bg-[#f5f5dc]/10 text-[#f5f5dc]/40"
        }`}>
          {track.status}
        </span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[#f5f5dc]">{track.title}</h1>
        {track.description && (
          <p className="mt-1 text-sm text-[#f5f5dc]/50">{track.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#f5f5dc]/30">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("common.updatedPrefix")}{new Date(track.updated_at).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Music2 className="h-3 w-3" />
            {track.duration_seconds}s · {track.bpm} BPM · Key {track.key_signature}
          </span>
          <span className="flex items-center gap-1">
            <Gauge className="h-3 w-3" />
            {track.format?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tags */}
      {track.tags && track.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {track.tags.map((tag: string) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-0.5 text-[10px] text-teal-400">
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Beta Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-amber-400" />
        <p className="text-xs text-amber-300/80 leading-relaxed">
          {t("music.previewBanner")}
        </p>
      </div>

      {/* Audio Player / Waveform */}
      {track.audio_url ? (
        <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-6 space-y-4">
          <audio src={track.audio_url} controls className="w-full" />
          <div className="flex items-center gap-4 text-xs text-[#f5f5dc]/40">
            <span>{track.genre}</span>
            <span>{track.bpm} BPM</span>
            <span>Key: {track.key_signature}</span>
            <span>{Math.floor(track.duration_seconds / 60)}:{String(track.duration_seconds % 60).padStart(2, "0")}</span>
          </div>
        </div>
      ) : track.waveform_json && Array.isArray(track.waveform_json) && track.waveform_json.length > 0 ? (
        <div className="space-y-4">
          <WaveformVisualizer
            waveformData={track.waveform_json as number[]}
            title={track.title}
            duration={track.duration_seconds}
          />

          {/* Composition Details */}
          {track.metadata_json && typeof track.metadata_json === "object" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {!!(track.metadata_json as Record<string, unknown>).structure && (
                <div className="rounded-lg bg-[#0a1229]/60 px-4 py-3">
                  <p className="text-[10px] text-[#f5f5dc]/30 uppercase tracking-wider mb-1">Structure</p>
                  <p className="text-sm text-[#f5f5dc]/60">{String((track.metadata_json as Record<string, unknown>).structure)}</p>
                </div>
              )}
              {!!(track.metadata_json as Record<string, unknown>).mood && (
                <div className="rounded-lg bg-[#0a1229]/60 px-4 py-3">
                  <p className="text-[10px] text-[#f5f5dc]/30 uppercase tracking-wider mb-1">Mood</p>
                  <p className="text-sm text-[#f5f5dc]/60">{String((track.metadata_json as Record<string, unknown>).mood)}</p>
                </div>
              )}
              {Array.isArray((track.metadata_json as Record<string, unknown>).instruments) && (
                <div className="rounded-lg bg-[#0a1229]/60 px-4 py-3 sm:col-span-2">
                  <p className="text-[10px] text-[#f5f5dc]/30 uppercase tracking-wider mb-1">Instruments</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {((track.metadata_json as Record<string, unknown>).instruments as string[]).map((inst) => (
                      <span key={inst} className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-400">{inst}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <GenerateButton
            type="music"
            entityId={trackId}
            prompt={track.prompt || track.description || track.title}
            hasPrompt={Boolean(track.prompt)}
            meta={{ genre: track.genre, bpm: track.bpm, key_signature: track.key_signature, duration_seconds: track.duration_seconds }}
            label={t("common.regenerate")}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-6">
          <div className="py-8 text-center">
            <MusicIcon className="mx-auto mb-3 h-12 w-12 text-teal-400/20" />
            {track.prompt ? (
              <>
                <p className="text-sm text-[#f5f5dc]/40 mb-3">{t("music.detail.aiPromptLabel")}</p>
                <p className="mx-auto max-w-lg rounded-lg bg-[#0a1229]/60 px-4 py-3 text-sm text-[#f5f5dc]/60 italic">
                  &ldquo;{track.prompt}&rdquo;
                </p>
                <div className="mt-4">
                  <GenerateButton
                    type="music"
                    entityId={trackId}
                    prompt={track.prompt}
                    hasPrompt={true}
                    meta={{ genre: track.genre, bpm: track.bpm, key_signature: track.key_signature, duration_seconds: track.duration_seconds }}
                  />
                </div>
                {track.status === "generating" && (
                  <p className="mt-3 text-xs text-amber-400 animate-pulse">
                    ⏳ {t("common.generating")}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-[#f5f5dc]/40">{t("music.detail.noAudio")}</p>
                <p className="mt-1 text-xs text-[#f5f5dc]/25">
                  {t("music.detail.noAudioHint")}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <MusicActions
        trackId={trackId}
        workspaceSlug={workspaceSlug}
        title={track.title}
        description={track.description ?? ""}
      />
    </div>
  );
}
