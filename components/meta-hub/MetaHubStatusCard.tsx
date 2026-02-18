"use client";
import { logger } from "@/lib/logging";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Radio,
  ExternalLink,
  MessageSquare,
  Share2,
  Instagram,
  MessagesSquare
} from "lucide-react";
import type { MetaIntegrationStatus, RealtimeConnectionState } from "@/lib/meta-hub/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

type MetaHubStatusCardProps = {
  workspaceId: string;
  workspaceSlug: string;
  initialStatus: MetaIntegrationStatus;
};

export function MetaHubStatusCard({
  workspaceId,
  workspaceSlug,
  initialStatus,
}: MetaHubStatusCardProps) {
  const [status, setStatus] = useState<MetaIntegrationStatus>(initialStatus);
  const [realtimeState, setRealtimeState] = useState<RealtimeConnectionState>("CONNECTING");
  const t = useTranslations("metaHubUI.statusCard");

  useEffect(() => {
    const supabase = supabaseClient();
    const channels: RealtimeChannel[] = [];

    // Subscribe to meta tables for realtime updates
    const metaChannel = supabase
      .channel(`meta-hub:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meta_whatsapp_connections",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          // Refetch status on any change
          refetchStatus();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meta_tokens",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          refetchStatus();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meta_events_log",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          refetchStatus();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeState("SUBSCRIBED");
        } else if (status === "CLOSED") {
          setRealtimeState("CLOSED");
        } else if (status === "CHANNEL_ERROR") {
          setRealtimeState("ERROR");
        }
      });

    channels.push(metaChannel);

    async function refetchStatus() {
      try {
        const response = await fetch(`/api/meta-hub/status?workspaceId=${workspaceId}`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        logger.error("Failed to refetch status:", error);
      }
    }

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [workspaceId]);

  const { connectors } = status;
  
  // Determine primary CTA based on priority rules
  let primaryCTA: { label: string; href: string; variant?: "default" | "outline" } | null = null;
  let secondaryCTA: { label: string; href: string } | null = null;

  if (connectors.whatsapp === 'none' || connectors.whatsapp === 'partial') {
    primaryCTA = {
      label: connectors.whatsapp === 'partial' ? t("completeWhatsAppSetup") : t("connectWhatsApp"),
      href: `/${workspaceSlug}/meta-hub/connections`,
    };
    secondaryCTA = {
      label: t("learnHowItWorks"),
      href: `/products/meta-hub`,
    };
  } else if (connectors.metaPortfolio === 'none') {
    primaryCTA = {
      label: t("linkMetaPortfolio"),
      href: `/${workspaceSlug}/meta-hub/connections`,
    };
    secondaryCTA = {
      label: t("skipForNow"),
      href: `/${workspaceSlug}/meta-hub`,
    };
  } else {
    primaryCTA = {
      label: t("manageConnections"),
      href: `/${workspaceSlug}/meta-hub/connections`,
      variant: "outline",
    };
  }

  // Connector config
  const connectorCards = [
    {
      key: 'whatsapp',
      name: t("whatsapp"),
      icon: MessageSquare,
      status: connectors.whatsapp,
      health: connectors.whatsappHealth,
      description: connectors.whatsapp === 'connected' 
        ? (status.whatsapp.displayName || t("connectedReceiving"))
        : connectors.whatsapp === 'partial' 
        ? t("incompleteSetup")
        : t("notConfigured"),
      badgeLabel: connectors.whatsapp === 'connected' ? t("connectedStatus") : 
                  connectors.whatsapp === 'partial' ? t("partialStatus") : t("notConnectedStatus"),
    },
    {
      key: 'metaPortfolio',
      name: t("metaPortfolio"),
      icon: Share2,
      status: connectors.metaPortfolio,
      description: connectors.metaPortfolio === 'linked' ? t("businessLinked") : t("notLinkedDesc"),
      badgeLabel: connectors.metaPortfolio === 'linked' ? t("linkedStatus") : t("notLinkedStatus"),
    },
    {
      key: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      status: connectors.instagram === 'connected' ? 'connected' : connectors.instagram === 'available' ? 'none' : 'soon',
      description: connectors.instagram === 'connected'
        ? t("connectedDMs")
        : connectors.instagram === 'available'
        ? t("readyToConnect")
        : t("comingSoon"),
      badgeLabel: connectors.instagram === 'connected' ? t("connectedStatus") : connectors.instagram === 'available' ? t("availableStatus") : t("soonStatus"),
    },
    {
      key: 'messenger',
      name: 'Messenger',
      icon: MessagesSquare,
      status: connectors.messenger === 'connected' ? 'connected' : connectors.messenger === 'available' ? 'none' : 'soon',
      description: connectors.messenger === 'connected'
        ? t("connectedMessages")
        : connectors.messenger === 'available'
        ? t("readyToConnect")
        : t("comingSoon"),
      badgeLabel: connectors.messenger === 'connected' ? t("connectedStatus") : connectors.messenger === 'available' ? t("availableStatus") : t("soonStatus"),
    },
  ];

  return (
    <Card className="border-[#d4af37]/15 bg-[#0a1229]/70">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#f5f5dc]">{t("integrationStatus")}</CardTitle>
          <Badge 
            variant="outline" 
            className={
              realtimeState === "SUBSCRIBED"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37]"
            }
          >
            <Radio className="mr-1 h-3 w-3" />
            {realtimeState === "SUBSCRIBED" ? "LIVE" : realtimeState}
          </Badge>
        </div>
        <CardDescription className="text-[#f5f5dc]/60">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connector Grid */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {connectorCards.map((connector) => {
            const Icon = connector.icon;
            const isConnectedOrLinked = connector.status === 'connected' || connector.status === 'linked';
            const isPartial = connector.status === 'partial';
            const isSoon = connector.status === 'soon';
            
            return (
              <div
                key={connector.key}
                className={`rounded-xl border p-4 ${
                  isConnectedOrLinked
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : isPartial
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : isSoon
                    ? 'border-[#f5f5dc]/10 bg-[#f5f5dc]/5'
                    : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${
                      isConnectedOrLinked ? 'text-emerald-400' :
                      isPartial ? 'text-amber-400' :
                      isSoon ? 'text-[#f5f5dc]/40' :
                      'text-red-400'
                    }`} />
                    <div>
                      <p className="text-sm font-semibold text-[#f5f5dc]">{connector.name}</p>
                      <p className="text-xs text-[#f5f5dc]/50">
                        {connector.description}
                        {connector.key === 'whatsapp' && connector.health === 'needs_attention' && (
                          <span className="ml-1 text-amber-400">• {t("needsVerification")}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {isConnectedOrLinked ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : isPartial ? (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  ) : isSoon ? (
                    <XCircle className="h-4 w-4 shrink-0 text-[#f5f5dc]/20" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                  )}
                </div>
                <div className="mt-3">
                  <Badge 
                    variant="outline"
                    className={
                      isConnectedOrLinked ? 'border-emerald-500/30 text-emerald-400' :
                      isPartial ? 'border-amber-500/30 text-amber-400' :
                      isSoon ? 'border-[#f5f5dc]/20 text-[#f5f5dc]/40' :
                      'border-red-500/30 text-red-400'
                    }
                  >
                    {connector.badgeLabel}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2 sm:flex-row">
          {primaryCTA && (
            <Button 
              asChild 
              className={
                primaryCTA.variant === "outline"
                  ? "border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10"
                  : "bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18] hover:opacity-90"
              }
              variant={primaryCTA.variant}
            >
              <Link href={primaryCTA.href}>
                <ExternalLink className="mr-2 h-4 w-4" />
                {primaryCTA.label}
              </Link>
            </Button>
          )}
          {secondaryCTA && (
            <Button asChild variant="ghost" className="text-[#f5f5dc]/60 hover:text-[#f5f5dc]">
              <Link href={secondaryCTA.href}>
                {secondaryCTA.label}
              </Link>
            </Button>
          )}
        </div>

        {/* Webhooks status (if WhatsApp connected) */}
        {connectors.whatsapp !== 'none' && (
          <div className="rounded-lg border border-[#d4af37]/20 bg-[#0a1229]/40 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#f5f5dc]">{t("webhooks")}</p>
                <p className="text-xs text-[#f5f5dc]/50">
                  {status.webhooks.status === 'active' 
                    ? t("eventsCount", { count: status.webhooks.events24h }) 
                    : t("noRecentEvents")}
                </p>
              </div>
              <Badge 
                variant="outline"
                className={
                  status.webhooks.status === 'active'
                    ? 'border-emerald-500/30 text-emerald-400'
                    : 'border-amber-500/30 text-amber-400'
                }
              >
                {status.webhooks.status}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
