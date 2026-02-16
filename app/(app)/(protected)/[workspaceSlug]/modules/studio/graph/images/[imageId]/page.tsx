import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ImageIcon, ArrowLeft, Clock, Tag, Maximize2 } from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { ImageActions } from "@/components/studio/ImageActions";
import { GenerateButton } from "@/components/studio/GenerateButton";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string; imageId: string }>;
};

const styleColors: Record<string, string> = {
  "photo-realistic": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "illustration": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "3d-render": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "watercolor": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "pixel-art": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "abstract": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "flat-design": "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "anime": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "logo": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "icon": "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

export default async function ImageDetailPage({ params }: PageProps) {
  const { workspaceSlug, imageId } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const db = await supabaseServer();
  const { data: image, error } = await db
    .from("graph_images")
    .select("*")
    .eq("id", imageId)
    .eq("workspace_id", ctx.currentWorkspace.id)
    .single();

  if (error || !image) notFound();

  const t = await getTranslations("studio");
  const basePath = `/${workspaceSlug}/modules/studio/graph/images`;
  const color = styleColors[image.style] || "bg-[#f5f5dc]/5 text-[#f5f5dc]/40 border-[#f5f5dc]/10";

  return (
    <div className="space-y-6">
      {/* Back + Meta */}
      <div className="flex items-center gap-3">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1 rounded-lg border border-[#f5f5dc]/10 px-3 py-1.5 text-xs font-medium text-[#f5f5dc]/50 hover:text-[#f5f5dc] hover:border-[#f5f5dc]/20 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          {t("images.backLink")}
        </Link>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize ${color}`}>
          <ImageIcon className="h-3 w-3" />
          {image.style}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
          image.status === "completed" ? "bg-emerald-500/15 text-emerald-400" :
          image.status === "generating" ? "bg-amber-500/15 text-amber-400" :
          image.status === "failed" ? "bg-red-500/15 text-red-400" :
          "bg-[#f5f5dc]/10 text-[#f5f5dc]/40"
        }`}>
          {image.status}
        </span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-[#f5f5dc]">{image.title}</h1>
        {image.description && (
          <p className="mt-1 text-sm text-[#f5f5dc]/50">{image.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#f5f5dc]/30">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("common.updatedPrefix")}{new Date(image.updated_at).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Maximize2 className="h-3 w-3" />
            {image.width}×{image.height} {image.format?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tags */}
      {image.tags && image.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {image.tags.map((tag: string) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] text-purple-400">
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Image Preview */}
      <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 p-6">
        {image.image_url ? (
          <div className="flex justify-center">
            <Image
              src={image.image_url}
              alt={image.title}
              width={800}
              height={500}
              className="max-h-[500px] rounded-lg object-contain"
              unoptimized
            />
          </div>
        ) : (
          <div className="py-12 text-center">
            <ImageIcon className="mx-auto mb-3 h-12 w-12 text-purple-400/20" />
            {image.prompt ? (
              <>
                <p className="text-sm text-[#f5f5dc]/40 mb-3">{t("images.detail.aiPromptLabel")}</p>
                <p className="mx-auto max-w-lg rounded-lg bg-[#0a1229]/60 px-4 py-3 text-sm text-[#f5f5dc]/60 italic">
                  &ldquo;{image.prompt}&rdquo;
                </p>
                <div className="mt-4">
                  <GenerateButton
                    type="image"
                    entityId={imageId}
                    prompt={image.prompt}
                    hasPrompt={true}
                    meta={{ style: image.style, width: image.width, height: image.height }}
                  />
                </div>
                {image.status === "generating" && (
                  <p className="mt-3 text-xs text-amber-400 animate-pulse">
                    ⏳ {t("common.generating")}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-[#f5f5dc]/40">{t("images.detail.noImage")}</p>
                <p className="mt-1 text-xs text-[#f5f5dc]/25">
                  {t("images.detail.noImageHint")}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <ImageActions
        imageId={imageId}
        workspaceSlug={workspaceSlug}
        title={image.title}
        description={image.description ?? ""}
      />
    </div>
  );
}
