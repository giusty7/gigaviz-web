import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { VideoIcon, ArrowLeft, Clock, Tag, Monitor, Timer } from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { VideoActions } from "@/components/studio/VideoActions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string; videoId: string }>;
};

const styleColors: Record<string, string> = {
  "marketing": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "explainer": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "product-demo": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "social-reel": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "animation": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "cinematic": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "tutorial": "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "testimonial": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

export default async function VideoDetailPage({ params }: PageProps) {
  const { workspaceSlug, videoId } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const db = await supabaseServer();
  const { data: video, error } = await db
    .from("graph_videos")
    .select("*")
    .eq("id", videoId)
    .eq("workspace_id", ctx.currentWorkspace.id)
    .single();

  if (error || !video) notFound();

  const t = await getTranslations("studio");
  const basePath = `/${workspaceSlug}/modules/studio/graph/videos`;
  const color = styleColors[video.style] || "bg-[#f5f5dc]/5 text-[#f5f5dc]/40 border-[#f5f5dc]/10";

  return (
    <div className="space-y-6">
      {/* Back + Meta */}
      <div className="flex items-center gap-3">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1 rounded-lg border border-[#f5f5dc]/10 px-3 py-1.5 text-xs font-medium text-[#f5f5dc]/50 hover:text-[#f5f5dc] hover:border-[#f5f5dc]/20 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          {t("videos.backLink")}
        </Link>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize ${color}`}>
          <VideoIcon className="h-3 w-3" />
          {video.style}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
          video.status === "completed" ? "bg-emerald-500/15 text-emerald-400" :
          video.status === "generating" ? "bg-amber-500/15 text-amber-400" :
          video.status === "failed" ? "bg-red-500/15 text-red-400" :
          "bg-[#f5f5dc]/10 text-[#f5f5dc]/40"
        }`}>
          {video.status}
        </span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[#f5f5dc]">{video.title}</h1>
        {video.description && (
          <p className="mt-1 text-sm text-[#f5f5dc]/50">{video.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#f5f5dc]/30">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("common.updatedPrefix")}{new Date(video.updated_at).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Timer className="h-3 w-3" />
            {video.duration_seconds}s
          </span>
          <span className="flex items-center gap-1">
            <Monitor className="h-3 w-3" />
            {video.resolution} · {video.format?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tags */}
      {video.tags && video.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {video.tags.map((tag: string) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] text-purple-400">
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Video Preview */}
      <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-6">
        {video.video_url ? (
          <div className="flex justify-center">
            <video
              src={video.video_url}
              controls
              className="max-h-[400px] rounded-lg"
              poster={video.thumbnail_url || undefined}
            />
          </div>
        ) : (
          <div className="py-12 text-center">
            <VideoIcon className="mx-auto mb-3 h-12 w-12 text-purple-400/20" />
            {video.prompt ? (
              <>
                <p className="text-sm text-[#f5f5dc]/40 mb-3">{t("videos.detail.aiPromptLabel")}</p>
                <p className="mx-auto max-w-lg rounded-lg bg-[#0a1229]/60 px-4 py-3 text-sm text-[#f5f5dc]/60 italic">
                  &ldquo;{video.prompt}&rdquo;
                </p>
                <p className="mt-3 text-xs text-[#f5f5dc]/25">
                  {t("videos.detail.generationPending")}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-[#f5f5dc]/40">{t("videos.detail.noVideo")}</p>
                <p className="mt-1 text-xs text-[#f5f5dc]/25">
                  {t("videos.detail.noVideoHint")}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <VideoActions
        videoId={videoId}
        workspaceSlug={workspaceSlug}
        title={video.title}
        description={video.description ?? ""}
      />
    </div>
  );
}
