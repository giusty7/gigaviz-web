"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Instagram,
  MessageCircle,
  Plus,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface InstagramConnection {
  id: string;
  instagram_user_id: string;
  instagram_username: string;
  profile_picture_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface MessengerConnection {
  id: string;
  page_id: string;
  page_name: string;
  page_picture_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface MultiPlatformConnectionsProps {
  workspaceId: string;
  canEdit: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PLATFORM CONNECTION CARD
   ═══════════════════════════════════════════════════════════════════════════ */

function PlatformConnectionCard({
  platform,
  icon: Icon,
  connections,
  isConnected,
  loading,
  onConnect,
  onDisconnect,
  canEdit,
}: {
  platform: "Instagram" | "Messenger";
  icon: React.ElementType;
  connections: Array<{ id: string; name: string; picture: string | null; isActive: boolean }>;
  isConnected: boolean;
  loading: boolean;
  onConnect: () => void;
  onDisconnect: (id: string) => void;
  canEdit: boolean;
}) {
  const colorClasses = {
    Instagram: {
      border: "border-pink-500/30",
      bg: "bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-orange-500/10",
      text: "text-pink-400",
      badge: "bg-pink-500/20 text-pink-300",
      glow: "shadow-pink-500/20",
    },
    Messenger: {
      border: "border-blue-500/30",
      bg: "bg-gradient-to-br from-blue-500/10 via-blue-600/10 to-purple-500/10",
      text: "text-blue-400",
      badge: "bg-blue-500/20 text-blue-300",
      glow: "shadow-blue-500/20",
    },
  };

  const classes = colorClasses[platform];

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`relative overflow-hidden rounded-2xl border ${classes.border} ${classes.bg} p-6 backdrop-blur-xl`}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${classes.bg} shadow-lg ${classes.glow}`}
          >
            <Icon className={`h-6 w-6 ${classes.text}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#f5f5dc]">{platform}</h3>
            <p className="text-xs text-[#f5f5dc]/50">
              {platform === "Instagram" ? "Direct Messages" : "Page Messenger"}
            </p>
          </div>
        </div>
        <Badge
          className={`${isConnected ? "bg-emerald-500/20 text-emerald-300" : "bg-[#f5f5dc]/10 text-[#f5f5dc]/50"}`}
        >
          {isConnected ? "Connected" : "Not Connected"}
        </Badge>
      </div>

      {/* Connections List */}
      {connections.length > 0 ? (
        <div className="mb-4 space-y-3">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="flex items-center justify-between rounded-xl border border-[#f5f5dc]/10 bg-[#0a1229]/60 p-3"
            >
              <div className="flex items-center gap-3">
                {conn.picture ? (
                  <Image
                    src={conn.picture}
                    alt={conn.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5dc]/10">
                    <Icon className={`h-4 w-4 ${classes.text}`} />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-[#f5f5dc]">{conn.name}</p>
                  <div className="flex items-center gap-1">
                    {conn.isActive ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-yellow-400" />
                    )}
                    <span className="text-xs text-[#f5f5dc]/50">
                      {conn.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDisconnect(conn.id)}
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-dashed border-[#f5f5dc]/20 bg-[#0a1229]/40 p-6 text-center">
          <Icon className={`mx-auto mb-2 h-8 w-8 ${classes.text} opacity-50`} />
          <p className="text-sm text-[#f5f5dc]/50">No {platform} accounts connected</p>
          <p className="mt-1 text-xs text-[#f5f5dc]/30">
            Connect your {platform === "Instagram" ? "Instagram Business" : "Facebook Page"} to
            start receiving messages
          </p>
        </div>
      )}

      {/* Connect Button */}
      {canEdit && (
        <Button
          onClick={onConnect}
          disabled={loading}
          className={`w-full ${classes.bg} border ${classes.border} ${classes.text} hover:opacity-80`}
          variant="outline"
        >
          {loading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {connections.length > 0 ? `Add Another ${platform}` : `Connect ${platform}`}
        </Button>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function MultiPlatformConnections({
  workspaceId,
  canEdit,
}: MultiPlatformConnectionsProps) {
  const { toast } = useToast();
  const [instagramConnections, setInstagramConnections] = useState<InstagramConnection[]>([]);
  const [messengerConnections, setMessengerConnections] = useState<MessengerConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState<"instagram" | "messenger" | null>(null);

  const loadConnections = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch Instagram connections
      const igRes = await fetch(`/api/meta/instagram/connections?workspace_id=${workspaceId}`);
      if (igRes.ok) {
        const igData = await igRes.json();
        setInstagramConnections(igData.connections || []);
      }

      // Fetch Messenger connections
      const msgRes = await fetch(`/api/meta/messenger/connections?workspace_id=${workspaceId}`);
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessengerConnections(msgData.connections || []);
      }
    } catch (err) {
      console.error("Error loading connections:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  async function handleDisconnect(platform: "instagram" | "messenger", id: string) {
    try {
      const res = await fetch(`/api/meta/${platform}/connections/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to disconnect");

      toast({
        title: "Disconnected",
        description: `${platform === "instagram" ? "Instagram" : "Messenger"} account disconnected.`,
      });

      loadConnections();
    } catch {
      toast({
        title: "Error",
        description: "Failed to disconnect account",
        variant: "destructive",
      });
    }
  }

  function handleConnectClick(platform: "instagram" | "messenger") {
    setConnectPlatform(platform);
    setConnectDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
        <span className="text-xs font-semibold tracking-wider text-purple-400">
          MULTI-PLATFORM CONNECTIONS
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
      </div>

      {/* Connection Cards Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Instagram */}
        <PlatformConnectionCard
          platform="Instagram"
          icon={Instagram}
          connections={instagramConnections.map((c) => ({
            id: c.id,
            name: `@${c.instagram_username}`,
            picture: c.profile_picture_url,
            isActive: c.is_active,
          }))}
          isConnected={instagramConnections.some((c) => c.is_active)}
          loading={loading}
          onConnect={() => handleConnectClick("instagram")}
          onDisconnect={(id) => handleDisconnect("instagram", id)}
          canEdit={canEdit}
        />

        {/* Messenger */}
        <PlatformConnectionCard
          platform="Messenger"
          icon={MessageCircle}
          connections={messengerConnections.map((c) => ({
            id: c.id,
            name: c.page_name,
            picture: c.page_picture_url,
            isActive: c.is_active,
          }))}
          isConnected={messengerConnections.some((c) => c.is_active)}
          loading={loading}
          onConnect={() => handleConnectClick("messenger")}
          onDisconnect={(id) => handleDisconnect("messenger", id)}
          canEdit={canEdit}
        />
      </div>

      {/* Connect Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="border-[#d4af37]/20 bg-[#0a1229]">
          <DialogHeader>
            <DialogTitle className="text-[#f5f5dc]">
              Connect {connectPlatform === "instagram" ? "Instagram" : "Facebook Page"}
            </DialogTitle>
            <DialogDescription className="text-[#f5f5dc]/60">
              {connectPlatform === "instagram"
                ? "Connect your Instagram Business account to receive and reply to Direct Messages."
                : "Connect your Facebook Page to receive and reply to Messenger conversations."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="rounded-xl border border-[#d4af37]/20 bg-[#050a18]/60 p-4">
              <h4 className="mb-2 text-sm font-medium text-[#f5f5dc]">Requirements:</h4>
              <ul className="space-y-2 text-xs text-[#f5f5dc]/60">
                {connectPlatform === "instagram" ? (
                  <>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3 w-3 text-emerald-400" />
                      Instagram Business or Creator account
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3 w-3 text-emerald-400" />
                      Connected to a Facebook Page
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3 w-3 text-emerald-400" />
                      Instagram Messaging API access
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3 w-3 text-emerald-400" />
                      Facebook Page with messaging enabled
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3 w-3 text-emerald-400" />
                      Page admin access
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3 w-3 text-emerald-400" />
                      Messenger Platform API access
                    </li>
                  </>
                )}
              </ul>
            </div>

            <Button
              className="w-full bg-[#d4af37] text-[#0a1229] hover:bg-[#f9d976]"
              onClick={() => {
                // This will trigger the Facebook Login flow
                // For now, show a placeholder toast
                toast({
                  title: "Coming Soon",
                  description: `${connectPlatform === "instagram" ? "Instagram" : "Messenger"} OAuth connection is being finalized.`,
                });
                setConnectDialogOpen(false);
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Continue with Facebook Login
            </Button>

            <p className="text-center text-xs text-[#f5f5dc]/40">
              You&apos;ll be redirected to Facebook to authorize access
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
