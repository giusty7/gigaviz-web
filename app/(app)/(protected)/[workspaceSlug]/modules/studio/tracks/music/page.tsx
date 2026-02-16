import { redirect } from "next/navigation";
import Link from "next/link";
import { MusicIcon, Plus, Sparkles, Clock } from "lucide-react";
import LockedScreen from "@/components/app/LockedScreen";
import { getAppContext } from "@/lib/app-context";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import { supabaseServer } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string }>;
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

export default async function TracksMusicPage({ params }: PageProps) {
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
  const ents = ctx.effectiveEntitlements ?? [];
  const hasAccess = canAccess(
    { plan_id: plan.plan_id, is_admin: Boolean(ctx.profile?.is_admin), effectiveEntitlements: ents },
    "tracks"
  );

  if (!hasAccess) {
    return (
      <LockedScreen
        title={t("music.lockedTitle")}
        description={t("music.lockedDescription")}
        workspaceSlug={workspaceSlug}
      />
    );
  }

  const { data: tracks } = await db
    .from("tracks_music")
    .select("id, title, genre, status, duration_seconds, bpm, tags, updated_at")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  const items = tracks ?? [];
  const totalDuration = items.reduce((sum, t) => sum + (t.duration_seconds ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#f5f5dc]">{t("music.title")}</h1>
          <p className="mt-1 text-sm text-[#f5f5dc]/50">{t("music.description")}</p>
        </div>
        <Link
          href={`/${workspaceSlug}/modules/studio/tracks/music/new`}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-medium text-white hover:bg-teal-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t("music.newTrack")}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-teal-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <MusicIcon className="h-7 w-7 text-teal-400" />
            <div>
              <p className="text-2xl font-bold text-[#f5f5dc]">{items.length}</p>
              <p className="text-xs text-[#f5f5dc]/40">{t("music.stats.tracks")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <Clock className="h-7 w-7 text-cyan-400" />
            <div>
              <p className="text-2xl font-bold text-[#f5f5dc]">{Math.round(totalDuration / 60)}m</p>
              <p className="text-xs text-[#f5f5dc]/40">{t("music.stats.totalDuration")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-emerald-400" />
            <div>
              <p className="text-2xl font-bold text-[#f5f5dc]">
                {items.filter((t) => t.status === "completed").length}
              </p>
              <p className="text-xs text-[#f5f5dc]/40">{t("music.stats.generated")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Music Grid */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#f5f5dc]/60 uppercase tracking-wider">
          {t("music.yourTracks")}
        </h2>
        {items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((track) => {
              const color = genreColors[track.genre] || "bg-[#f5f5dc]/5 text-[#f5f5dc]/40 border-[#f5f5dc]/10";
              return (
                <Link
                  key={track.id}
                  href={`/${workspaceSlug}/modules/studio/tracks/music/${track.id}`}
                  className="group block rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-5 transition-all hover:border-teal-500/20 hover:bg-[#0a1229]/60"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${color}`}>
                      <MusicIcon className="h-4 w-4" />
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] capitalize ${color}`}>
                      {track.genre}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#f5f5dc] mb-1 group-hover:text-teal-300 transition-colors truncate">
                    {track.title}
                  </h3>
                  <div className="flex items-center gap-3 mb-2 text-[10px] text-[#f5f5dc]/30">
                    {track.duration_seconds && (
                      <span>{Math.floor(track.duration_seconds / 60)}:{String(track.duration_seconds % 60).padStart(2, "0")}</span>
                    )}
                    {track.bpm && <span>{track.bpm} BPM</span>}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(track.tags ?? []).slice(0, 3).map((tag: string) => (
                      <span key={tag} className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      track.status === "completed" ? "bg-emerald-500/15 text-emerald-400" :
                      track.status === "generating" ? "bg-amber-500/15 text-amber-400" :
                      track.status === "failed" ? "bg-red-500/15 text-red-400" :
                      "bg-[#f5f5dc]/10 text-[#f5f5dc]/40"
                    }`}>
                      {track.status}
                    </span>
                    <p className="text-[10px] text-[#f5f5dc]/25">
                      {new Date(track.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#f5f5dc]/10 bg-[#0a1229]/30 p-12 text-center">
            <MusicIcon className="mx-auto mb-3 h-10 w-10 text-[#f5f5dc]/15" />
            <p className="text-sm font-medium text-[#f5f5dc]/40">{t("music.emptyTitle")}</p>
            <p className="mt-1 text-xs text-[#f5f5dc]/25">{t("music.emptyDescription")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
