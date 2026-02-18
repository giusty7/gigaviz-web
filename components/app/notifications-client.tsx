"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CheckCheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  ExternalLinkIcon,
  FilterIcon,
  InboxIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// ---------------------------------------------------
// Types
// ---------------------------------------------------

type Notification = {
  id: string;
  type: string;
  severity: "info" | "warn" | "critical";
  title: string;
  body: string | null;
  meta: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

type TabValue = "all" | "unread";

type Props = {
  workspaceId: string;
  workspaceSlug: string;
};

// ---------------------------------------------------
// Constants
// ---------------------------------------------------

const NOTIFICATION_TYPES = [
  "token_missing",
  "token_near_cap",
  "token_hard_cap_reached",
  "webhook_error_spike",
  "billing_request_created",
  "template_sync_failed",
  "topup_requested",
  "topup_posted",
] as const;

const SEVERITY_OPTIONS = ["info", "warn", "critical"] as const;

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  warn: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  critical: "bg-red-500/20 text-red-300 border-red-500/40",
};

const TYPE_LABEL_KEYS: Record<string, string> = {
  token_missing: "typeTokenMissing",
  token_near_cap: "typeTokenNearCap",
  token_hard_cap_reached: "typeTokenCapReached",
  webhook_error_spike: "typeWebhookErrors",
  billing_request_created: "typeBillingRequest",
  template_sync_failed: "typeTemplateSyncFailed",
  topup_requested: "typeTopupRequested",
  topup_posted: "typeTopupPosted",
};

const PAGE_SIZE = 20;

// ---------------------------------------------------
// Helpers
// ---------------------------------------------------

function getRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

/**
 * Get the action route based on notification type
 */
function getActionRoute(type: string, workspaceSlug: string): { href: string; labelKey: string } | null {
  switch (type) {
    case "topup_requested":
    case "topup_posted":
      return { href: `/${workspaceSlug}/tokens`, labelKey: "actionViewWallet" };
    case "billing_request_created":
      return { href: `/${workspaceSlug}/billing`, labelKey: "actionViewBilling" };
    case "webhook_error_spike":
      return { href: `/${workspaceSlug}/meta-hub/messaging/whatsapp/webhooks`, labelKey: "actionViewWebhooks" };
    case "token_missing":
      return { href: `/${workspaceSlug}/meta-hub/messaging/whatsapp/connections`, labelKey: "actionViewConnections" };
    case "template_sync_failed":
      return { href: `/${workspaceSlug}/meta-hub/messaging/whatsapp`, labelKey: "actionViewTemplates" };
    case "token_near_cap":
    case "token_hard_cap_reached":
      return { href: `/${workspaceSlug}/tokens`, labelKey: "actionManageTokens" };
    default:
      return null;
  }
}

// ---------------------------------------------------
// Component
// ---------------------------------------------------

export function NotificationsClient({ workspaceId, workspaceSlug }: Props) {
  const { toast } = useToast();
  const t = useTranslations("notificationsUI");

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [tab, setTab] = useState<TabValue>("all");
  const [search, setSearch] = useState("");
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());
  const [severityFilters, setSeverityFilters] = useState<Set<string>>(new Set());

  // Details dialog
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [metaExpanded, setMetaExpanded] = useState(false);

  // ---------------------------------------------------
  // Data fetching
  // ---------------------------------------------------

  const fetchNotifications = useCallback(
    async (reset = true) => {
      try {
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const limit = reset ? PAGE_SIZE : notifications.length + PAGE_SIZE;
        const unreadOnly = tab === "unread";

        const res = await fetch(
          `/api/notifications?workspaceId=${workspaceId}&limit=${limit}&unreadOnly=${unreadOnly}`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (data.ok) {
          const fetched = data.notifications ?? [];
          setNotifications(fetched);
          setUnreadCount(data.unreadCount ?? 0);
          setHasMore(fetched.length >= limit);
        }
      } catch {
        toast({ title: t("failedToLoad"), variant: "destructive" });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [workspaceId, tab, notifications.length, toast, t]
  );

  // Fetch on mount and when tab changes
  useEffect(() => {
    fetchNotifications(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, tab]);

  // ---------------------------------------------------
  // Actions
  // ---------------------------------------------------

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
        toast({ title: t("allMarkedRead") });
      }
    } catch {
      toast({ title: t("failedToMark"), variant: "destructive" });
    }
  }, [workspaceId, toast, t]);

  const handleMarkRead = useCallback(
    async (ids: string[]) => {
      try {
        const res = await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, notificationIds: ids }),
        });
        const data = await res.json();
        if (data.ok) {
          const idSet = new Set(ids);
          setNotifications((prev) =>
            prev.map((n) =>
              idSet.has(n.id) ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - ids.length));
        }
      } catch {
        // Ignore
      }
    },
    [workspaceId]
  );

  const openDetails = useCallback(
    (notif: Notification) => {
      setSelectedNotification(notif);
      setMetaExpanded(false);
      setDetailsOpen(true);

      // Mark as read when opening
      if (!notif.read_at) {
        handleMarkRead([notif.id]);
      }
    },
    [handleMarkRead]
  );

  const copyMeta = useCallback(() => {
    if (selectedNotification?.meta) {
      navigator.clipboard.writeText(JSON.stringify(selectedNotification.meta, null, 2));
      toast({ title: t("metaCopied") });
    }
  }, [selectedNotification, toast, t]);

  // ---------------------------------------------------
  // Filtering
  // ---------------------------------------------------

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesBody = n.body?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBody) return false;
      }

      // Type filter
      if (typeFilters.size > 0 && !typeFilters.has(n.type)) {
        return false;
      }

      // Severity filter
      if (severityFilters.size > 0 && !severityFilters.has(n.severity)) {
        return false;
      }

      return true;
    });
  }, [notifications, search, typeFilters, severityFilters]);

  const activeFilterCount = typeFilters.size + severityFilters.size;

  const toggleTypeFilter = (type: string) => {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const toggleSeverityFilter = (sev: string) => {
    setSeverityFilters((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) {
        next.delete(sev);
      } else {
        next.add(sev);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilters(new Set());
    setSeverityFilters(new Set());
  };

  // ---------------------------------------------------
  // Render
  // ---------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gigaviz-surface/50 border-gigaviz-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("total")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{notifications.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gigaviz-surface/50 border-gigaviz-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("unread")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-400">{unreadCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-gigaviz-surface/50 border-gigaviz-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("critical")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">
              {notifications.filter((n) => n.severity === "critical" && !n.read_at).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs */}
        <div className="inline-flex rounded-lg border border-gigaviz-border bg-gigaviz-surface/50 p-1">
          <button
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              tab === "all"
                ? "bg-gigaviz-gold text-gigaviz-bg"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setTab("all")}
          >
            {t("tabAll")}
          </button>
          <button
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              tab === "unread"
                ? "bg-gigaviz-gold text-gigaviz-bg"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setTab("unread")}
          >
            {t("tabUnread")} {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gigaviz-surface/50"
          />
        </div>

        {/* Filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <FilterIcon className="h-4 w-4" />
              {t("filters")}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t("filterType")}</DropdownMenuLabel>
            {NOTIFICATION_TYPES.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={typeFilters.has(type)}
                onCheckedChange={() => toggleTypeFilter(type)}
              >
                {TYPE_LABEL_KEYS[type] ? t(TYPE_LABEL_KEYS[type]) : type}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t("filterSeverity")}</DropdownMenuLabel>
            {SEVERITY_OPTIONS.map((sev) => (
              <DropdownMenuCheckboxItem
                key={sev}
                checked={severityFilters.has(sev)}
                onCheckedChange={() => toggleSeverityFilter(sev)}
              >
                <span className="capitalize">{sev}</span>
              </DropdownMenuCheckboxItem>
            ))}
            {activeFilterCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <button
                  className="w-full px-2 py-1.5 text-sm text-left text-muted-foreground hover:text-foreground"
                  onClick={clearFilters}
                >
                  {t("clearAllFilters")}
                </button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Actions */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchNotifications(true)}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCwIcon className={cn("h-4 w-4", loading && "animate-spin")} />
          {t("refresh")}
        </Button>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
            <CheckCheckIcon className="h-4 w-4" />
            {t("markAllRead")}
          </Button>
        )}
      </div>

      {/* Notifications list */}
      <div className="rounded-xl border border-gigaviz-border bg-gigaviz-card/50 overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <RefreshCwIcon className="h-5 w-5 animate-spin mr-2" />
            {t("loadingNotifications")}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <InboxIcon className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm font-medium">
              {search || activeFilterCount > 0
                ? t("noMatchFilters")
                : tab === "unread"
                ? t("allCaughtUp")
                : t("noNotificationsYet")}
            </p>
            {(search || activeFilterCount > 0) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2">
                {t("clearFilters")}
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gigaviz-border">
            {filteredNotifications.map((notif) => {
              const action = getActionRoute(notif.type, workspaceSlug);
              return (
                <div
                  key={notif.id}
                  className={cn(
                    "flex items-start gap-4 p-4 transition-colors hover:bg-gigaviz-surface/30 cursor-pointer",
                    !notif.read_at && "bg-gigaviz-surface/50"
                  )}
                  onClick={() => openDetails(notif)}
                >
                  {/* Unread indicator */}
                  <div className="pt-1.5">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        !notif.read_at ? "bg-gigaviz-gold" : "bg-transparent"
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-1.5 py-0", SEVERITY_STYLES[notif.severity])}
                      >
                        {notif.severity}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {TYPE_LABEL_KEYS[notif.type] ? t(TYPE_LABEL_KEYS[notif.type]) : notif.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTime(notif.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium leading-tight">{notif.title}</p>
                    {notif.body && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {notif.body}
                      </p>
                    )}
                  </div>

                  {/* Quick actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {action && (
                      <Link href={action.href} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                          {t(action.labelKey)}
                          <ExternalLinkIcon className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                    {!notif.read_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead([notif.id]);
                        }}
                        title="Mark as read"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    )}
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {hasMore && filteredNotifications.length >= PAGE_SIZE && (
          <div className="flex justify-center py-4 border-t border-gigaviz-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNotifications(false)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                  {t("loading")}
                </>
              ) : (
                t("loadMore")
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Details dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          {selectedNotification && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs px-2 py-0.5",
                      SEVERITY_STYLES[selectedNotification.severity]
                    )}
                  >
                    {selectedNotification.severity}
                  </Badge>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {TYPE_LABEL_KEYS[selectedNotification.type] ? t(TYPE_LABEL_KEYS[selectedNotification.type]) : selectedNotification.type}
                  </Badge>
                </div>
                <DialogTitle>{selectedNotification.title}</DialogTitle>
                <DialogDescription>
                  {formatDateTime(selectedNotification.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {selectedNotification.body && (
                  <p className="text-sm text-muted-foreground">{selectedNotification.body}</p>
                )}

                {/* Meta data viewer */}
                {selectedNotification.meta && Object.keys(selectedNotification.meta).length > 0 && (
                  <div className="rounded-lg border border-gigaviz-border bg-gigaviz-surface/50">
                    <button
                      className="flex w-full items-center justify-between p-3 text-sm font-medium"
                      onClick={() => setMetaExpanded(!metaExpanded)}
                    >
                      <span>{t("additionalData")}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyMeta();
                          }}
                        >
                          <CopyIcon className="h-3 w-3 mr-1" />
                          {t("copy")}
                        </Button>
                        <ChevronDownIcon
                          className={cn(
                            "h-4 w-4 transition-transform",
                            metaExpanded && "rotate-180"
                          )}
                        />
                      </div>
                    </button>
                    {metaExpanded && (
                      <pre className="max-h-48 overflow-auto border-t border-gigaviz-border p-3 text-xs font-mono bg-gigaviz-bg/50">
                        {JSON.stringify(selectedNotification.meta, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                {/* Action button */}
                {(() => {
                  const action = getActionRoute(selectedNotification.type, workspaceSlug);
                  if (!action) return null;
                  return (
                    <Link href={action.href}>
                      <Button className="w-full gap-2">
                        {t(action.labelKey)}
                        <ExternalLinkIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
