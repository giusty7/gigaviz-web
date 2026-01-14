"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BellIcon, CheckCheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  severity: "info" | "warn" | "critical";
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

type Props = {
  workspaceId: string;
  workspaceSlug: string;
};

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  warn: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  critical: "bg-red-500/20 text-red-300 border-red-500/40",
};

function getRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NotificationBell({ workspaceId, workspaceSlug }: Props) {
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notifications?workspaceId=${workspaceId}&limit=10`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.ok) {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // Ignore errors silently
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Fetch on mount and periodically
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000); // Every minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Fetch when dropdown opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, markAll: true }),
      });
      const data = await res.json();
      if (data.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast({ title: "All notifications marked as read" });
      }
    } catch {
      toast({ title: "Failed to mark as read", variant: "destructive" });
    }
  }, [workspaceId, toast]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, notificationIds: [id] }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Ignore
      }
    },
    [workspaceId]
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleMarkAllRead}>
              <CheckCheckIcon className="mr-1 h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {loading && notifications.length === 0 && (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">Loading...</div>
        )}
        {!loading && notifications.length === 0 && (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">No notifications</div>
        )}
        {notifications.map((notif) => (
          <DropdownMenuItem
            key={notif.id}
            className={cn(
              "flex flex-col items-start gap-1 px-3 py-2 cursor-default",
              !notif.read_at && "bg-gigaviz-surface/50"
            )}
            onSelect={(e) => e.preventDefault()}
          >
            <div className="flex w-full items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0", SEVERITY_STYLES[notif.severity])}
                >
                  {notif.severity}
                </Badge>
                <span className="text-xs text-muted-foreground">{getRelativeTime(notif.created_at)}</span>
              </div>
              {!notif.read_at && (
                <button
                  onClick={() => handleMarkRead(notif.id)}
                  className="p-0.5 hover:bg-gigaviz-surface rounded"
                  title="Mark as read"
                >
                  <XIcon className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
            <p className="text-sm font-medium leading-tight">{notif.title}</p>
            {notif.body && (
              <p className="text-xs text-muted-foreground line-clamp-2">{notif.body}</p>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <Link href={`/${workspaceSlug}/settings?tab=notifications`}>
          <DropdownMenuItem className="justify-center text-sm text-gigaviz-gold">
            View all notifications
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
