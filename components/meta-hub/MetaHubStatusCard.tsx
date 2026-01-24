"use client";

import { useEffect, useState } from "react";
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
  ExternalLink
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
        console.error("Failed to refetch status:", error);
      }
    }

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [workspaceId]);

  const whatsappConnected = status.whatsapp.status === "connected";
  const webhooksActive = status.webhooks.status === "active";
  const hasAnyConnection = whatsappConnected;

  // Empty state when nothing is connected
  if (!hasAnyConnection && !webhooksActive) {
    return (
      <Card className="border-[#d4af37]/15 bg-[#0a1229]/70">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#f5f5dc]">Integration Status</CardTitle>
            <Badge 
              variant="outline" 
              className={
                realtimeState === "SUBSCRIBED"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37]"
              }
            >
              <Radio className="mr-1 h-3 w-3" />
              {realtimeState === "SUBSCRIBED" ? "LIVE" : "CONNECTING"}
            </Badge>
          </div>
          <CardDescription className="text-[#f5f5dc]/60">
            Connect your Meta accounts to activate WhatsApp and Facebook capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-[#d4af37]/10 p-4">
              <AlertTriangle className="h-8 w-8 text-[#d4af37]" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-[#f5f5dc]">
              No integrations connected
            </h3>
            <p className="mb-6 max-w-md text-sm text-[#f5f5dc]/60">
              Connect your Meta Business accounts to start using WhatsApp messaging, templates, and webhooks.
            </p>
            <Button asChild className="bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18] hover:opacity-90">
              <Link href={`/${workspaceSlug}/meta-hub/connections`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect Accounts
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Status cards when connections exist
  return (
    <div className="space-y-4">
      <Card className="border-[#d4af37]/15 bg-[#0a1229]/70">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#f5f5dc]">Integration Status</CardTitle>
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
            Real-time integration health monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* WhatsApp Card */}
            <Card className={`border ${whatsappConnected ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-[#f5f5dc]">
                    WhatsApp
                  </CardTitle>
                  {whatsappConnected ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant={whatsappConnected ? "default" : "outline"} className={whatsappConnected ? "" : "border-red-500/30 text-red-400"}>
                    {whatsappConnected ? "Connected" : "Not Connected"}
                  </Badge>
                  {status.whatsapp.displayName && (
                    <p className="text-xs text-[#f5f5dc]/60">
                      {status.whatsapp.displayName}
                    </p>
                  )}
                  {status.whatsapp.lastUpdated && (
                    <p className="text-xs text-[#f5f5dc]/40">
                      Last updated: {new Date(status.whatsapp.lastUpdated).toLocaleString()}
                    </p>
                  )}
                  {!whatsappConnected && (
                    <Link href={`/${workspaceSlug}/meta-hub/connections`}>
                      <Button size="sm" variant="outline" className="mt-2 w-full">
                        Connect
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Facebook Card */}
            <Card className="border-[#d4af37]/30 bg-[#d4af37]/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-[#f5f5dc]">
                    Facebook
                  </CardTitle>
                  <XCircle className="h-5 w-5 text-[#d4af37]/60" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="outline" className="border-[#d4af37]/30 text-[#d4af37]">
                    Coming Soon
                  </Badge>
                  <p className="text-xs text-[#f5f5dc]/40">
                    Facebook integration will be available soon
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Webhooks Card */}
            <Card className={`border ${webhooksActive ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-[#f5f5dc]">
                    Webhooks
                  </CardTitle>
                  {webhooksActive ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge 
                    variant={webhooksActive ? "default" : "outline"}
                    className={webhooksActive ? "" : "border-amber-500/30 text-amber-400"}
                  >
                    {status.webhooks.status}
                  </Badge>
                  {status.webhooks.events24h > 0 && (
                    <p className="text-xs text-[#f5f5dc]/60">
                      {status.webhooks.events24h} events (24h)
                    </p>
                  )}
                  {status.webhooks.lastEventAt && (
                    <p className="text-xs text-[#f5f5dc]/40">
                      Last event: {new Date(status.webhooks.lastEventAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {!status.hasAccessToken && whatsappConnected && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-[#f5f5dc]">
                    Access token not configured
                  </p>
                  <p className="text-xs text-[#f5f5dc]/60">
                    Configure your Meta access token in Connections to enable full functionality
                  </p>
                  <Link href={`/${workspaceSlug}/meta-hub/connections`}>
                    <Button size="sm" variant="outline" className="mt-2">
                      Go to Connections
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
