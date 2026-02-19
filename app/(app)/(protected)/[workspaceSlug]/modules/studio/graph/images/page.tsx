import { redirect } from "next/navigation";
import Link from "next/link";import Image from "next/image";import { ImageIcon, Plus, Sparkles, Palette, Layers } from "lucide-react";
import LockedScreen from "@/components/app/LockedScreen";
import { getAppContext } from "@/lib/app-context";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import { supabaseServer } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ workspaceSlug: string }>;
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

export default async function GraphImagesPage({ params }: PageProps) {
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
    "graph"
  );

  if (!hasAccess) {
    return (
      <LockedScreen
        title={t("images.lockedTitle")}
        description={t("images.lockedDescription")}
        workspaceSlug={workspaceSlug}
      />
    );
  }

  const { data: images, error: imagesError } = await db
    .from("graph_images")
    .select("id, title, style, status, tags, thumbnail_url, updated_at")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  const tableNotReady = imagesError?.code === "42P01" || imagesError?.message?.includes("does not exist");
  const items = images ?? [];
  const styles = [...new Set(items.map((i) => i.style))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#f5f5dc]">{t("images.title")}</h1>
          <p className="mt-1 text-sm text-[#f5f5dc]/50">{t("images.description")}</p>
        </div>
        <Link
          href={`/${workspaceSlug}/modules/studio/graph/images/new`}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-medium text-white hover:bg-purple-500 transition-colors sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {t("images.newImage")}
        </Link>
      </div>

      {/* Migration Warning */}
      {tableNotReady && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          <p className="font-semibold">⚠️ Database setup required</p>
          <p className="mt-1 text-amber-300/70">
            The AI Images table has not been created yet. Please apply the migration: <code className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs">20260216200000_studio_media.sql</code>
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-purple-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-7 w-7 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-[#f5f5dc]">{items.length}</p>
              <p className="text-xs text-[#f5f5dc]/40">{t("images.stats.images")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <Palette className="h-7 w-7 text-cyan-400" />
            <div>
              <p className="text-2xl font-bold text-[#f5f5dc]">{styles.length}</p>
              <p className="text-xs text-[#f5f5dc]/40">{t("images.stats.styles")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-[#0a1229]/60 p-5">
          <div className="flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-emerald-400" />
            <div>
              <p className="text-2xl font-bold text-[#f5f5dc]">
                {items.filter((i) => i.status === "completed").length}
              </p>
              <p className="text-xs text-[#f5f5dc]/40">{t("images.stats.generated")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#f5f5dc]/60 uppercase tracking-wider">
          {t("images.yourImages")}
        </h2>
        {items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((img) => {
              const color = styleColors[img.style] || "bg-[#f5f5dc]/5 text-[#f5f5dc]/40 border-[#f5f5dc]/10";
              return (
                <Link
                  key={img.id}
                  href={`/${workspaceSlug}/modules/studio/graph/images/${img.id}`}
                  className="group block rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/40 overflow-hidden transition-all hover:border-purple-500/20 hover:bg-[#0a1229]/60"
                >
                  {/* Thumbnail Area */}
                  <div className="aspect-video bg-[#0a1229]/80 flex items-center justify-center border-b border-[#f5f5dc]/5">
                    {img.thumbnail_url ? (
                      <Image src={img.thumbnail_url} alt={img.title} width={400} height={225} className="h-full w-full object-cover" unoptimized />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-[#f5f5dc]/10" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="text-sm font-semibold text-[#f5f5dc] group-hover:text-purple-300 transition-colors truncate">
                        {img.title}
                      </h3>
                      <span className={`ml-2 shrink-0 rounded-full border px-2 py-0.5 text-[10px] capitalize ${color}`}>
                        {img.style}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(img.tags ?? []).slice(0, 3).map((tag: string) => (
                        <span key={tag} className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        img.status === "completed" ? "bg-emerald-500/15 text-emerald-400" :
                        img.status === "generating" ? "bg-amber-500/15 text-amber-400" :
                        img.status === "failed" ? "bg-red-500/15 text-red-400" :
                        "bg-[#f5f5dc]/10 text-[#f5f5dc]/40"
                      }`}>
                        {img.status}
                      </span>
                      <p className="text-[10px] text-[#f5f5dc]/25">
                        {new Date(img.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#f5f5dc]/10 bg-[#0a1229]/30 p-12 text-center">
            <Layers className="mx-auto mb-3 h-10 w-10 text-[#f5f5dc]/15" />
            <p className="text-sm font-medium text-[#f5f5dc]/40">{t("images.emptyTitle")}</p>
            <p className="mt-1 text-xs text-[#f5f5dc]/25">{t("images.emptyDescription")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
