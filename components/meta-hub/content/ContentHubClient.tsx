"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  MessageSquare,
  Instagram,
  Facebook,
  Calendar,
  Clock,
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  Sparkles,
  ArrowRight,
  Eye,
  BarChart3,
  Layers,
  Zap,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

type ContentType = "all" | "whatsapp" | "instagram" | "facebook";

type ScheduledPost = {
  id: string;
  platform: "whatsapp" | "instagram" | "facebook";
  type: string;
  title: string;
  scheduledAt: string;
  status: "scheduled" | "published" | "draft" | "failed";
};

/* ═══════════════════════════════════════════════════════════════════════════
   PLATFORM COLORS
   ═══════════════════════════════════════════════════════════════════════════ */

const PLATFORM_CONFIG = {
  whatsapp: {
    icon: MessageSquare,
    color: "text-emerald-400",
    bg: "from-emerald-500/15 to-emerald-400/5",
    border: "border-emerald-500/20",
    badge: "bg-emerald-500/15 text-emerald-400",
    label: "WhatsApp",
  },
  instagram: {
    icon: Instagram,
    color: "text-pink-400",
    bg: "from-pink-500/15 to-purple-500/10",
    border: "border-pink-500/20",
    badge: "bg-pink-500/15 text-pink-400",
    label: "Instagram",
  },
  facebook: {
    icon: Facebook,
    color: "text-blue-400",
    bg: "from-blue-500/15 to-blue-400/5",
    border: "border-blue-500/20",
    badge: "bg-blue-500/15 text-blue-400",
    label: "Facebook",
  },
} as const;

const STATUS_STYLES = {
  scheduled: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  draft: "bg-[#f5f5dc]/10 text-[#f5f5dc]/50 border-[#f5f5dc]/10",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   CONTENT HUB CLIENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function ContentHubClient() {
  const t = useTranslations("metaHub.content");
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const [activeFilter, setActiveFilter] = useState<ContentType>("all");
  const base = `/${workspaceSlug}/meta-hub/content`;

  // Mock data — will be replaced with real API calls
  const stats = {
    totalPosts: 0,
    scheduled: 0,
    published: 0,
    drafts: 0,
  };

  const scheduledPosts: ScheduledPost[] = [];

  const filteredPosts = activeFilter === "all"
    ? scheduledPosts
    : scheduledPosts.filter((p) => p.platform === activeFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#0a1229]/90 via-[#0d1530] to-[#0a1229]/90 p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(147,51,234,0.08),transparent_60%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-600/20 shadow-lg shadow-purple-500/10">
              <Layers className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#f5f5dc]">{t("title")}</h1>
                <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-purple-400">
                  Beta
                </span>
              </div>
              <p className="text-xs text-[#f5f5dc]/40">{t("description")}</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:shadow-purple-500/30">
            <Plus className="h-3.5 w-3.5" />
            {t("createPost")}
          </button>
        </div>
      </div>

      {/* Platform Cards — 3 channels */}
      <div className="grid gap-4 sm:grid-cols-3">
        {(["whatsapp", "instagram", "facebook"] as const).map((platform) => {
          const config = PLATFORM_CONFIG[platform];
          const Icon = config.icon;
          const features = t(`${platform}Features`).split(",");

          return (
            <Link
              key={platform}
              href={`${base}/${platform}`}
              className={`group relative overflow-hidden rounded-xl border ${config.border} bg-gradient-to-br ${config.bg} p-5 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-[#0a1229]/60 ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#f5f5dc]">{config.label}</h3>
                  <p className="text-[10px] text-[#f5f5dc]/40">{t(`${platform}ContentDesc`)}</p>
                </div>
              </div>

              {/* Feature list */}
              <div className="mt-4 space-y-1.5">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-[#d4af37]/60" />
                    <span className="text-[11px] text-[#f5f5dc]/50">{feature.trim()}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${config.badge}`}>
                  {t("manageContent")}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-[#f5f5dc]/15 transition-colors group-hover:text-purple-400" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Stats Row */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { icon: FileText, label: t("totalPosts"), value: stats.totalPosts, color: "text-blue-400" },
          { icon: Calendar, label: t("scheduledLabel"), value: stats.scheduled, color: "text-amber-400" },
          { icon: Eye, label: t("publishedLabel"), value: stats.published, color: "text-emerald-400" },
          { icon: FileText, label: t("draftsLabel"), value: stats.drafts, color: "text-[#f5f5dc]/40" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-[#f5f5dc]/[0.06] bg-[#0a1229]/60 p-3">
              <div className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <div>
                  <p className="text-lg font-bold text-[#f5f5dc]">{stat.value}</p>
                  <p className="text-[9px] uppercase tracking-wider text-[#f5f5dc]/30">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-[#f5f5dc]/[0.06] bg-[#0a1229]/60 p-1">
        {(["all", "whatsapp", "instagram", "facebook"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeFilter === filter
                ? "bg-gradient-to-r from-purple-500/20 to-pink-500/10 text-[#f5f5dc] shadow"
                : "text-[#f5f5dc]/40 hover:text-[#f5f5dc]/60"
            }`}
          >
            {filter !== "all" && (() => {
              const Icon = PLATFORM_CONFIG[filter].icon;
              return <Icon className="h-3 w-3" />;
            })()}
            {filter === "all" ? t("filterAll") : PLATFORM_CONFIG[filter].label}
          </button>
        ))}
      </div>

      {/* Content Calendar / Recent Posts */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-purple-500/10 bg-gradient-to-br from-purple-500/5 to-pink-500/5 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10">
            <Calendar className="h-7 w-7 text-purple-400" />
          </div>
          <h3 className="text-sm font-semibold text-[#f5f5dc]">{t("noContentYet")}</h3>
          <p className="mt-1 max-w-sm text-xs text-[#f5f5dc]/40">{t("noContentDesc")}</p>
          <button className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:shadow-purple-500/30">
            <Zap className="h-3.5 w-3.5" />
            {t("createFirstPost")}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => {
            const config = PLATFORM_CONFIG[post.platform];
            const Icon = config.icon;
            return (
              <div
                key={post.id}
                className="rounded-xl border border-[#f5f5dc]/[0.06] bg-[#0a1229]/60 p-4 transition hover:border-purple-500/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className="text-xs font-medium text-[#f5f5dc]/60">{config.label}</span>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${STATUS_STYLES[post.status]}`}>
                    {post.status}
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-semibold text-[#f5f5dc] line-clamp-1">{post.title}</h4>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-[#f5f5dc]/30">
                  <Clock className="h-3 w-3" />
                  {new Date(post.scheduledAt).toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Links — Feature Overview */}
      <div className="rounded-2xl border border-[#f5f5dc]/[0.06] bg-[#0a1229]/40 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f5f5dc]/40">{t("whatYouCanDo")}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Video, label: t("featureReels"), desc: t("featureReelsDesc") },
            { icon: ImageIcon, label: t("featureStories"), desc: t("featureStoriesDesc") },
            { icon: FileText, label: t("featurePosts"), desc: t("featurePostsDesc") },
            { icon: Calendar, label: t("featureSchedule"), desc: t("featureScheduleDesc") },
            { icon: BarChart3, label: t("featureAnalytics"), desc: t("featureAnalyticsDesc") },
            { icon: Sparkles, label: t("featureAI"), desc: t("featureAIDesc") },
          ].map((feature) => {
            const FIcon = feature.icon;
            return (
              <div key={feature.label} className="flex items-start gap-3 rounded-lg bg-[#f5f5dc]/[0.02] p-3">
                <FIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#d4af37]/60" />
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
