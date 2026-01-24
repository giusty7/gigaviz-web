"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MessageSquare, X } from "lucide-react";
import { useInboxPreference } from "@/lib/hooks/use-inbox-preference";

type Thread = {
  id: string;
  contact_name: string | null;
  contact_wa_id: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
  status: string;
};

type Activity = {
  id: string;
  thread_id: string;
  contact_name: string | null;
  contact_wa_id: string;
  message_preview: string;
  timestamp: string;
};

type ConnectionStatus = {
  phoneNumberId: string;
  displayName: string;
  isHealthy: boolean;
};

interface InboxOverviewClientProps {
  workspaceSlug: string;
  threads: Thread[];
  activities: Activity[];
  connection: ConnectionStatus | null;
  fullInboxPath: string;
}

function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return "Never";
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo ago`;
  } catch {
    return "Unknown";
  }
}

export function InboxOverviewClient({
  threads,
  activities,
  connection,
  fullInboxPath,
}: InboxOverviewClientProps) {
  const router = useRouter();
  const { fullInboxDefault, toggle, isClient } = useInboxPreference();
  const [showTooltip, setShowTooltip] = useState(() => {
    if (typeof window === "undefined") return true;
    const dismissed = localStorage.getItem("gigaviz.metaHub.whatsapp.fullInboxTooltip");
    return dismissed !== "true";
  });

  useEffect(() => {
    if (!isClient || !fullInboxDefault) return;
    // Redirect if preference is enabled
    router.push(fullInboxPath);
  }, [fullInboxDefault, fullInboxPath, router, isClient]);

  const dismissTooltip = () => {
    localStorage.setItem("gigaviz.metaHub.whatsapp.fullInboxTooltip", "true");
    setShowTooltip(false);
  };

  const formatTime = (timestamp: string | null) => {
    return formatTimeAgo(timestamp);
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      {connection && (
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{connection.displayName}</p>
              <p className="text-sm text-muted-foreground">{connection.phoneNumberId}</p>
            </div>
          </div>
          <Badge variant={connection.isHealthy ? "default" : "secondary"}>
            {connection.isHealthy ? "Connected" : "Error"}
          </Badge>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              💡 Work faster in Full Inbox mode
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Get a WhatsApp Web-like experience with better productivity tools.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={dismissTooltip}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Primary CTA */}
      <div className="flex items-center justify-between p-6 border rounded-lg bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Full Inbox Workspace</h3>
          <p className="text-sm text-muted-foreground">
            Open a focused workspace with all your conversations and tools
          </p>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="always-full"
              checked={fullInboxDefault}
              onChange={toggle}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="always-full" className="text-sm cursor-pointer">
              Always open Full Inbox
            </Label>
          </div>
        </div>
        <a
          href={fullInboxPath}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button size="lg" className="gap-2">
            Open Full Inbox
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>

      {/* Recent Threads */}
      <div className="space-y-3">
        <h3 className="font-semibold">Recent Conversations ({threads.length})</h3>
        <div className="border rounded-lg divide-y">
          {threads.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {thread.contact_name || thread.contact_wa_id}
                      </p>
                      {thread.unread_count > 0 && (
                        <Badge variant="default" className="h-5 px-1.5 text-xs">
                          {thread.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {thread.last_message_preview || "No messages"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(thread.last_message_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <h3 className="font-semibold">Recent Activity ({activities.length})</h3>
        <div className="border rounded-lg divide-y">
          {activities.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No recent activity
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="p-3 hover:bg-muted/50 transition-colors text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">
                      {activity.contact_name || activity.contact_wa_id}
                    </span>
                    <span className="text-muted-foreground">: {activity.message_preview}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
