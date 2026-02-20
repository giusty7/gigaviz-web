"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  MessageSquare,
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  Type,
  Clock,
  Eye,
  ArrowLeft,
  Calendar,
  Sparkles,
  BarChart3,
  Users,
  Zap,
  CheckCircle2,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

type StatusType = "text" | "image" | "video";

type WAStatus = {
  id: string;
  type: StatusType;
  content: string;
  mediaUrl?: string;
  caption?: string;
  scheduledAt?: string;
  postedAt?: string;
  status: "draft" | "scheduled" | "posted" | "expired" | "failed";
  viewCount: number;
};

const STATUS_TYPE_CONFIG = {
  text: { icon: Type, label: "Text", color: "text-blue-400", bg: "bg-blue-500/15" },
  image: { icon: ImageIcon, label: "Photo", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  video: { icon: Video, label: "Video", color: "text-pink-400", bg: "bg-pink-500/15" },
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   WHATSAPP STATUS CLIENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function WhatsAppStatusClient() {
  const t = useTranslations("metaHub.content");
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "scheduled" | "posted">("all");
  const [showComposer, setShowComposer] = useState(false);

  // Mock data
  const statuses: WAStatus[] = [];

  const filteredStatuses = activeTab === "all"
    ? statuses
    : statuses.filter((s) => s.status === activeTab);

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
            <MessageSquare className="h-5 w-5 text-emerald-400" />
            <h1 className="text-lg font-bold text-[#f5f5dc]">{t("whatsappStatus")}</h1>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-400">Beta</span>
          </div>
          <p className="mt-0.5 text-xs text-[#f5f5dc]/40">{t("whatsappStatusDesc")}</p>
        </div>
        <button
          onClick={() => setShowComposer(!showComposer)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/30"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("newStatus")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { icon: FileText, label: t("totalStatuses"), value: statuses.length, color: "text-emerald-400" },
          { icon: Calendar, label: t("scheduledLabel"), value: statuses.filter((s) => s.status === "scheduled").length, color: "text-amber-400" },
          { icon: Eye, label: t("totalViews"), value: statuses.reduce((sum, s) => sum + s.viewCount, 0), color: "text-blue-400" },
          { icon: CheckCircle2, label: t("publishedLabel"), value: statuses.filter((s) => s.status === "posted").length, color: "text-purple-400" },
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

      {/* Composer Panel */}
      {showComposer && (
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-[#0a1229]/80 p-6">
          <h3 className="text-sm font-semibold text-[#f5f5dc]">{t("composeStatus")}</h3>
          <p className="mt-1 text-xs text-[#f5f5dc]/40">{t("composeStatusDesc")}</p>

          {/* Type selector */}
          <div className="mt-4 flex gap-2">
            {(["text", "image", "video"] as const).map((type) => {
              const config = STATUS_TYPE_CONFIG[type];
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  className={`flex items-center gap-1.5 rounded-lg border border-[#f5f5dc]/10 px-3 py-2 text-xs font-medium transition hover:border-emerald-500/30 hover:bg-emerald-500/5 ${config.color}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Text input */}
          <div className="mt-4">
            <textarea
              placeholder={t("statusPlaceholder")}
              className="min-h-[100px] w-full rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/60 p-3 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/20 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>

          {/* Media upload area */}
          <div className="mt-3 flex items-center justify-center rounded-xl border-2 border-dashed border-[#f5f5dc]/10 bg-[#f5f5dc]/[0.02] py-8 transition hover:border-emerald-500/20">
            <div className="text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-[#f5f5dc]/20" />
              <p className="mt-2 text-xs text-[#f5f5dc]/30">{t("dragMediaHere")}</p>
              <p className="text-[10px] text-[#f5f5dc]/20">{t("mediaFormats")}</p>
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
                <Sparkles className="h-3 w-3" />
                {t("aiGenerate")}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowComposer(false)}
                className="rounded-lg border border-[#f5f5dc]/10 px-3 py-1.5 text-xs font-medium text-[#f5f5dc]/50 transition hover:bg-[#f5f5dc]/5"
              >
                {t("cancel")}
              </button>
              <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500">
                {t("publishNow")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-[#f5f5dc]/[0.06] bg-[#0a1229]/60 p-1">
        {(["all", "draft", "scheduled", "posted"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === tab
                ? "bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 text-[#f5f5dc] shadow"
                : "text-[#f5f5dc]/40 hover:text-[#f5f5dc]/60"
            }`}
          >
            {t(`tab_${tab}`)}
          </button>
        ))}
      </div>

      {/* Status list */}
      {filteredStatuses.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-500/5 to-[#0a1229]/80 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
            <MessageSquare className="h-7 w-7 text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-[#f5f5dc]">{t("noStatusesYet")}</h3>
          <p className="mt-1 max-w-sm text-xs text-[#f5f5dc]/40">{t("noStatusesDesc")}</p>
          <button
            onClick={() => setShowComposer(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20"
          >
            <Zap className="h-3.5 w-3.5" />
            {t("createFirstStatus")}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStatuses.map((status) => {
            const typeConfig = STATUS_TYPE_CONFIG[status.type];
            const TypeIcon = typeConfig.icon;
            return (
              <div key={status.id} className="rounded-xl border border-[#f5f5dc]/[0.06] bg-[#0a1229]/60 p-4 transition hover:border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 rounded-full ${typeConfig.bg} px-2 py-0.5`}>
                    <TypeIcon className={`h-3 w-3 ${typeConfig.color}`} />
                    <span className={`text-[10px] font-bold ${typeConfig.color}`}>{typeConfig.label}</span>
                  </div>
                  <span className="text-[10px] text-[#f5f5dc]/30">
                    <Clock className="mr-1 inline h-3 w-3" />
                    {status.postedAt ? new Date(status.postedAt).toLocaleDateString() : t("notPosted")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#f5f5dc]/70 line-clamp-2">{status.content || status.caption}</p>
                <div className="mt-3 flex items-center gap-3 text-[10px] text-[#f5f5dc]/30">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {status.viewCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feature Overview */}
      <div className="rounded-2xl border border-[#f5f5dc]/[0.06] bg-[#0a1229]/40 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f5f5dc]/40">{t("waStatusFeatures")}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            { icon: Type, label: t("featureTextStatus"), desc: t("featureTextStatusDesc") },
            { icon: ImageIcon, label: t("featurePhotoStatus"), desc: t("featurePhotoStatusDesc") },
            { icon: Video, label: t("featureVideoStatus"), desc: t("featureVideoStatusDesc") },
            { icon: Calendar, label: t("featureScheduleStatus"), desc: t("featureScheduleStatusDesc") },
            { icon: Users, label: t("featureAudience"), desc: t("featureAudienceDesc") },
            { icon: BarChart3, label: t("featureViewAnalytics"), desc: t("featureViewAnalyticsDesc") },
          ].map((feature) => {
            const FIcon = feature.icon;
            return (
              <div key={feature.label} className="flex items-start gap-3 rounded-lg bg-[#f5f5dc]/[0.02] p-3">
                <FIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/60" />
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
