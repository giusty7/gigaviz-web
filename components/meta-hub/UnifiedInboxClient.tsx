"use client";
import { logger } from "@/lib/logging";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Instagram,
  MessagesSquare,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Channel = "all" | "whatsapp" | "instagram" | "messenger";
type ThreadStatus = "all" | "open" | "pending" | "resolved";

type UnifiedThread = {
  id: string;
  channel: Channel;
  workspace_id: string;
  status: string;
  contact_name: string;
  contact_identifier: string;
  last_message_at: string;
  last_message_preview?: string;
  unread_count: number;
  assigned_to?: string;
  tags: string[];
  created_at: string;
};

interface UnifiedInboxClientProps {
  workspaceId: string;
  workspaceSlug: string;
}

export function UnifiedInboxClient({ workspaceId, workspaceSlug }: UnifiedInboxClientProps) {
  const { toast } = useToast();
  const t = useTranslations("inbox");
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<UnifiedThread[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel>("all");
  const [selectedStatus, setSelectedStatus] = useState<ThreadStatus>("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThread, setSelectedThread] = useState<UnifiedThread | null>(null);

  useEffect(() => {
    fetchThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel, selectedStatus, workspaceId]);

  async function fetchThreads() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        workspaceId,
        channel: selectedChannel,
        status: selectedStatus,
        limit: "50",
      });

      const res = await fetch(`/api/meta-hub/unified-inbox?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch threads");
      }

      setThreads(data.threads || []);
    } catch (error) {
      logger.error("Failed to fetch threads:", error);
      toast({
        title: t("errorTitle"),
        description: error instanceof Error ? error.message : t("loadError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredThreads = threads.filter((thread) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      thread.contact_name.toLowerCase().includes(query) ||
      thread.contact_identifier.toLowerCase().includes(query) ||
      thread.last_message_preview?.toLowerCase().includes(query)
    );
  });

  const getChannelIcon = (channel: Channel) => {
    switch (channel) {
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />;
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "messenger":
        return <MessagesSquare className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getChannelColor = (channel: Channel) => {
    switch (channel) {
      case "whatsapp":
        return "text-green-400";
      case "instagram":
        return "text-pink-400";
      case "messenger":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("justNow");
    if (diffMins < 60) return t("minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("hoursAgo", { count: diffHours });
    if (diffDays === 1) return t("yesterday");
    if (diffDays < 7) return t("daysAgo", { count: diffDays });
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Sidebar - Thread List */}
      <div className="w-1/3 flex flex-col gap-4 bg-[#1a1a1a] border border-[#d4af37]/20 rounded-lg p-4">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#f9d976]">{t("unifiedInbox")}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchThreads}
              disabled={loading}
              className="border-[#d4af37]/30"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("refresh")}
            </Button>
          </div>

          {/* Channel Selector */}
          <div className="flex gap-2">
            {(["all", "whatsapp", "instagram", "messenger"] as Channel[]).map((channel) => (
              <Button
                key={channel}
                variant={selectedChannel === channel ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChannel(channel)}
                className={cn(
                  "flex-1",
                  selectedChannel === channel && "bg-[#d4af37] text-[#0a0a0a]"
                )}
              >
                {channel !== "all" && getChannelIcon(channel)}
                <span className="ml-1 capitalize">{t(`channel${channel.charAt(0).toUpperCase()}${channel.slice(1)}` as "channelAll" | "channelWhatsapp" | "channelInstagram" | "channelMessenger")}</span>
              </Button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(["open", "pending", "resolved", "all"] as ThreadStatus[]).map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  "flex-1 text-xs",
                  selectedStatus === status && "bg-[#d4af37]/20 text-[#d4af37]"
                )}
              >
                {t(`status${status.charAt(0).toUpperCase()}${status.slice(1)}` as "statusAll" | "statusOpen" | "statusPending" | "statusResolved")}
              </Button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#f5f5dc]/40" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0a0a0a] border-[#d4af37]/30"
            />
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-[#d4af37]" />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-8 text-[#f5f5dc]/60">
              <p>{t("noConversations")}</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredThreads.map((thread) => (
                <motion.div
                  key={thread.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    selectedThread?.id === thread.id
                      ? "bg-[#d4af37]/10 border-[#d4af37]"
                      : "bg-[#0a0a0a] border-[#d4af37]/20 hover:border-[#d4af37]/40"
                  )}
                  onClick={() => setSelectedThread(thread)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={cn("flex-shrink-0", getChannelColor(thread.channel))}>
                        {getChannelIcon(thread.channel)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-[#f5f5dc] truncate">
                            {thread.contact_name}
                          </p>
                          {thread.unread_count > 0 && (
                            <span className="flex-shrink-0 px-2 py-0.5 bg-[#d4af37] text-[#0a0a0a] text-xs rounded-full">
                              {thread.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#f5f5dc]/60 truncate">
                          {thread.last_message_preview || "No messages yet"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-[#f5f5dc]/40 flex-shrink-0">
                      {formatTime(thread.last_message_at)}
                    </span>
                  </div>
                  {thread.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {thread.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-[#d4af37]/20 text-[#d4af37] text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Main Panel - Thread Detail */}
      <div className="flex-1 bg-[#1a1a1a] border border-[#d4af37]/20 rounded-lg p-6">
        {selectedThread ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-[#0a0a0a]", getChannelColor(selectedThread.channel))}>
                  {getChannelIcon(selectedThread.channel)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#f5f5dc]">{selectedThread.contact_name}</h3>
                  <p className="text-sm text-[#f5f5dc]/60">{selectedThread.contact_identifier}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const channelPath = selectedThread.channel === "whatsapp" 
                    ? "messaging/whatsapp/inbox/full"
                    : selectedThread.channel === "instagram"
                    ? "instagram/threads"
                    : "messenger/threads";
                  window.location.href = `/${workspaceSlug}/meta-hub/${channelPath}?thread=${selectedThread.id}`;
                }}
                className="border-[#d4af37]/30"
              >
                {t("openInChannel", { channel: selectedThread.channel })}
              </Button>
            </div>
            <div className="text-center text-[#f5f5dc]/60 py-12">
              <p>{t("selectThread")}</p>
              <p className="text-sm mt-2">{t("clickOpenHint")}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[#f5f5dc]/60">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-[#d4af37]/40" />
              <p className="text-lg">{t("selectConversation")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
