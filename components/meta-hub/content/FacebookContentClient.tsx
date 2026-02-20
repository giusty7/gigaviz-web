"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Facebook,
  Plus,
  Image as ImageIcon,
  Video,
  Film,
  Link2,
  Clock,
  Eye,
  ThumbsUp,
  MessageCircle,
  Share2,
  ArrowLeft,
  Calendar,
  Sparkles,
  BarChart3,
  Zap,
  Globe,
} from "lucide-react";
import NextImage from "next/image";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

type PostFormat = "post" | "reel" | "story" | "link" | "video";

type FBContent = {
  id: string;
  format: PostFormat;
  message: string;
  mediaUrl?: string;
  linkUrl?: string;
  scheduledAt?: string;
  publishedAt?: string;
  status: "draft" | "scheduled" | "published" | "failed";
  reactions: number;
  comments: number;
  shares: number;
  reach: number;
};

const FORMAT_CONFIG = {
  post: { icon: ImageIcon, label: "Photo Post", color: "text-blue-400", bg: "bg-blue-500/15" },
  reel: { icon: Film, label: "Reel", color: "text-pink-400", bg: "bg-pink-500/15" },
  story: { icon: Clock, label: "Story", color: "text-amber-400", bg: "bg-amber-500/15" },
  link: { icon: Link2, label: "Link Post", color: "text-cyan-400", bg: "bg-cyan-500/15" },
  video: { icon: Video, label: "Video", color: "text-purple-400", bg: "bg-purple-500/15" },
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   FACEBOOK CONTENT CLIENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function FacebookContentClient() {
  const t = useTranslations("metaHub.content");
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const [activeTab, setActiveTab] = useState<"all" | PostFormat>("all");
  const [showComposer, setShowComposer] = useState(false);

  // Mock data
  const content: FBContent[] = [];

  const filteredContent = activeTab === "all"
    ? content
    : content.filter((c) => c.format === activeTab);

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/${workspaceSlug}/meta-hub/content`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#f5f5dc]/10 bg-[#f5f5dc]/5 text-[#f5f5dc]/60 transition hover:bg-[#f5f5dc]/10 hover:text-[#f5f5dc]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-400" />
            <h1 className="text-lg font-bold text-[#f5f5dc]">{t("facebookContent")}</h1>
            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-blue-400">Beta</span>
          </div>
          <p className="mt-0.5 text-xs text-[#f5f5dc]/40">{t("facebookContentDesc")}</p>
        </div>
        <button
          onClick={() => setShowComposer(!showComposer)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-blue-500/30"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("newContent")}
        </button>
      </div>

      {/* Format Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        {(["post", "reel", "story", "video", "link"] as const).map((format) => {
          const config = FORMAT_CONFIG[format];
          const Icon = config.icon;
          return (
            <button
              key={format}
              onClick={() => setActiveTab(format)}
              className={`group rounded-xl border border-[#f5f5dc]/[0.06] bg-[#0a1229]/60 p-3 text-left transition hover:border-blue-500/20 ${
                activeTab === format ? "border-blue-500/30 bg-blue-500/5" : ""
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bg}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <p className="mt-1.5 text-[11px] font-semibold text-[#f5f5dc]">{config.label}</p>
            </button>
          );
        })}
      </div>

      {/* Composer Panel */}
      {showComposer && (
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-[#0a1229]/80 p-6">
          <h3 className="text-sm font-semibold text-[#f5f5dc]">{t("composeFB")}</h3>
          <p className="mt-1 text-xs text-[#f5f5dc]/40">{t("composeFBDesc")}</p>

          {/* Format picker */}
          <div className="mt-4 flex flex-wrap gap-2">
            {(["post", "reel", "story", "video", "link"] as const).map((format) => {
              const config = FORMAT_CONFIG[format];
              const Icon = config.icon;
              return (
                <button
                  key={format}
                  className={`flex items-center gap-1.5 rounded-lg border border-[#f5f5dc]/10 px-3 py-2 text-xs font-medium transition hover:border-blue-500/30 hover:bg-blue-500/5 ${config.color}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Post text */}
          <div className="mt-4">
            <textarea
              placeholder={t("fbPostPlaceholder")}
              className="min-h-[100px] w-full rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/60 p-3 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-blue-500/30 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
            />
          </div>

          {/* Media upload */}
          <div className="mt-3 flex items-center justify-center rounded-xl border-2 border-dashed border-[#f5f5dc]/10 bg-[#f5f5dc]/[0.02] py-10 transition hover:border-blue-500/20">
            <div className="text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-[#f5f5dc]/15" />
              <p className="mt-2 text-xs text-[#f5f5dc]/30">{t("dragMediaHere")}</p>
              <p className="text-[10px] text-[#f5f5dc]/20">{t("fbMediaFormats")}</p>
            </div>
          </div>

          {/* Link preview area */}
          <div className="mt-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#f5f5dc]/10 bg-[#f5f5dc]/[0.02] px-3 py-2">
              <Link2 className="h-3.5 w-3.5 text-[#f5f5dc]/30" />
              <input
                type="url"
                placeholder={t("linkPlaceholder")}
                className="flex-1 bg-transparent text-xs text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg border border-[#f5f5dc]/10 px-3 py-1.5 text-xs text-[#f5f5dc]/50 transition hover:bg-[#f5f5dc]/5">
                <Calendar className="h-3 w-3" />
                {t("schedule")}
              </button>
              <button className="flex items-center gap-1.5 rounded-lg border border-[#f5f5dc]/10 px-3 py-1.5 text-xs text-[#f5f5dc]/50 transition hover:bg-[#f5f5dc]/5">
                <Globe className="h-3 w-3" />
                {t("audience")}
              </button>
              <button className="flex items-center gap-1.5 rounded-lg border border-[#f5f5dc]/10 px-3 py-1.5 text-xs text-[#f5f5dc]/50 transition hover:bg-[#f5f5dc]/5">
                <Sparkles className="h-3 w-3" />
                {t("aiGenerate")}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowComposer(false)} className="rounded-lg border border-[#f5f5dc]/10 px-3 py-1.5 text-xs font-medium text-[#f5f5dc]/50 transition hover:bg-[#f5f5dc]/5">
                {t("cancel")}
              </button>
              <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500">
                {t("publishNow")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-blue-500/10 bg-gradient-to-br from-blue-500/5 to-[#0a1229]/80 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
            <Facebook className="h-7 w-7 text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-[#f5f5dc]">{t("noFBContentYet")}</h3>
          <p className="mt-1 max-w-sm text-xs text-[#f5f5dc]/40">{t("noFBContentDesc")}</p>
          <button
            onClick={() => setShowComposer(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20"
          >
            <Zap className="h-3.5 w-3.5" />
            {t("createFirstContent")}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredContent.map((item) => {
            const fmtConfig = FORMAT_CONFIG[item.format];
            const FmtIcon = fmtConfig.icon;
            return (
              <div key={item.id} className="group rounded-xl border border-[#f5f5dc]/[0.06] bg-[#0a1229]/60 overflow-hidden transition hover:border-blue-500/20">
                {/* Thumbnail */}
                <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-blue-500/10 to-blue-400/5">
                  {item.mediaUrl ? (
                    <NextImage src={item.mediaUrl} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-blue-400/20" />
                  )}
                  <div className={`absolute left-2 top-2 flex items-center gap-1 rounded-full ${fmtConfig.bg} px-2 py-0.5`}>
                    <FmtIcon className={`h-3 w-3 ${fmtConfig.color}`} />
                    <span className={`text-[9px] font-bold ${fmtConfig.color}`}>{fmtConfig.label}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-xs text-[#f5f5dc]/60 line-clamp-2">{item.message}</p>
                  <div className="mt-3 flex items-center gap-3 text-[10px] text-[#f5f5dc]/30">
                    <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {item.reactions}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {item.comments}</span>
                    <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> {item.shares}</span>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {item.reach}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feature Overview */}
      <div className="rounded-2xl border border-[#f5f5dc]/[0.06] bg-[#0a1229]/40 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f5f5dc]/40">{t("fbFeatures")}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: ImageIcon, label: t("featureFBPosts"), desc: t("featureFBPostsDesc") },
            { icon: Film, label: t("featureFBReels"), desc: t("featureFBReelsDesc") },
            { icon: Video, label: t("featureFBVideo"), desc: t("featureFBVideoDesc") },
            { icon: Clock, label: t("featureFBStories"), desc: t("featureFBStoriesDesc") },
            { icon: Link2, label: t("featureFBLinks"), desc: t("featureFBLinksDesc") },
            { icon: BarChart3, label: t("featureFBInsights"), desc: t("featureFBInsightsDesc") },
          ].map((feature) => {
            const FIcon = feature.icon;
            return (
              <div key={feature.label} className="flex items-start gap-3 rounded-lg bg-[#f5f5dc]/[0.02] p-3">
                <FIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-400/60" />
                <div>
                  <p className="text-xs font-semibold text-[#f5f5dc]/70">{feature.label}</p>
                  <p className="text-[10px] leading-relaxed text-[#f5f5dc]/30">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
