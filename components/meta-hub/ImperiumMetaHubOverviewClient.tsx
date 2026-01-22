"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  WABAStatusHero,
  AnalyticsPulseSection,
  QuickActionsGrid,
  CyberLogConsole,
  TemplateGridPreview,
  ChannelsGrid,
} from "./ImperiumMetaHubComponents";
import { Crown, Sparkles } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

type HealthData = {
  whatsapp: {
    connected: boolean;
    wabaIdMasked: string;
    phoneIdMasked: string;
    tokenConfigured: boolean;
  };
  webhook: {
    status: "ok" | "stale" | "none" | "unknown";
    lastEventAt: string | null;
    events24h: number | null;
  };
};

type KPIData = {
  inboundCount24h: number | null;
  outboundCount24h: number | null;
  totalEvents24h: number | null;
  templates: {
    approved: number | null;
    pending: number | null;
    rejected: number | null;
  };
};

type Alert = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

type RecentEvent = {
  id: string;
  type: string;
  receivedAt: string | null;
};

type Conversation = {
  id: string;
  contact: string;
  preview: string;
  time: string | null;
};

type Channel = {
  name: string;
  status: "live" | "beta" | "soon" | "locked";
  desc: string;
  stats: string[];
  href: string;
};

type ImperiumMetaHubOverviewProps = {
  basePath: string;
  planLabel: string;
  isDevOverride: boolean;
  isPreview: boolean;
  allowTemplates: boolean;
  allowSend: boolean;
  allowWebhooks: boolean;
  health: HealthData;
  kpis: KPIData;
  alerts: Alert[];
  recentEvents: RecentEvent[];
  recentConversations: Conversation[];
  channels: Channel[];
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN OVERVIEW CLIENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function ImperiumMetaHubOverviewClient({
  basePath,
  planLabel,
  isDevOverride,
  isPreview,
  allowTemplates,
  allowSend,
  allowWebhooks,
  health,
  kpis,
  alerts,
  recentEvents,
  channels,
}: ImperiumMetaHubOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-[#d4af37]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">
              <Sparkles className="h-3 w-3" />
              Pillar #2
            </div>
          </div>
          <h2 className="text-2xl font-bold md:text-3xl">
            <span className="bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent">
              Meta Integrations
            </span>
          </h2>
          <p className="mt-1 text-sm text-[#f5f5dc]/60">
            Enterprise-grade integration hub for Meta platforms. WhatsApp is live; other connectors coming soon.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className="border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37] flex items-center gap-1.5"
          >
            <Crown className="h-3 w-3" />
            Plan: {planLabel}
          </Badge>
          {!isDevOverride && (
            <button className="rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f9d976] px-4 py-2 text-xs font-semibold text-[#050a18] shadow-lg shadow-[#d4af37]/20 transition-all hover:shadow-[#d4af37]/30 hover:brightness-110">
              Upgrade
            </button>
          )}
        </div>
      </motion.div>

      {/* Preview Banner */}
      {isPreview && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
              <Sparkles className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-400">Preview Mode</p>
              <p className="text-xs text-amber-400/70">
                Upgrade to unlock full Meta Hub capabilities.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* WABA Status Hero Card */}
      <WABAStatusHero
        connected={health.whatsapp.connected}
        wabaIdMasked={health.whatsapp.wabaIdMasked}
        phoneIdMasked={health.whatsapp.phoneIdMasked}
        tokenConfigured={health.whatsapp.tokenConfigured}
        qualityRating={null}
        verificationStatus="none"
      />

      {/* Analytics Pulse Section */}
      <AnalyticsPulseSection
        inbound24h={kpis.inboundCount24h}
        outbound24h={kpis.outboundCount24h}
        events24h={kpis.totalEvents24h}
      />

      {/* Template Grid Preview */}
      <TemplateGridPreview
        approved={kpis.templates.approved}
        pending={kpis.templates.pending}
        rejected={kpis.templates.rejected}
        basePath={basePath}
      />

      {/* Quick Actions */}
      <QuickActionsGrid 
        basePath={basePath} 
        allowTemplates={allowTemplates}
        allowSend={allowSend}
        allowWebhooks={allowWebhooks}
        whatsappConnected={health.whatsapp.connected}
      />

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-amber-500/20 bg-[#0a1229]/80 p-5 backdrop-blur-3xl"
        >
          <h3 className="text-sm font-semibold text-amber-400">Needs Attention</h3>
          <div className="mt-3 space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.title}
                className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[#f5f5dc]">{alert.title}</p>
                  {alert.description && (
                    <p className="text-xs text-[#f5f5dc]/50">{alert.description}</p>
                  )}
                </div>
                {alert.actionHref && (
                  <a
                    href={`${basePath}/${alert.actionHref}`}
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/20"
                  >
                    {alert.actionLabel ?? "Open"}
                  </a>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cyber-Log Console */}
      <CyberLogConsole recentEvents={recentEvents} basePath={basePath} />

      {/* Channels Grid */}
      <ChannelsGrid channels={channels} />
    </div>
  );
}
