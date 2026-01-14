"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  RefreshCw,
  Settings,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type WebhookEvent = {
  id: string;
  channel: string;
  event_type: string | null;
  external_event_id: string | null;
  received_at: string | null;
  processed_at: string | null;
  error_text: string | null;
  payload_json: Record<string, unknown>;
};

type Stats = {
  total24h: number;
  errors24h: number;
  lastEventAt: string | null;
};

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  hasToken: boolean;
  phoneNumberId: string | null;
  displayName: string | null;
  initialEvents: WebhookEvent[];
  initialStats: Stats;
};

const DATE_RANGE_OPTIONS = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "All", value: "all" },
] as const;

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "OK", value: "ok" },
  { label: "Failed", value: "failed" },
] as const;

const AUTO_REFRESH_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "15s", value: 15000 },
  { label: "30s", value: 30000 },
  { label: "60s", value: 60000 },
] as const;

function getDateFrom(range: string): string | null {
  const now = Date.now();
  if (range === "24h") return new Date(now - 24 * 60 * 60 * 1000).toISOString();
  if (range === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (range === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  return null;
}

function formatTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString();
}

function getRelativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function summarizePayload(payload: Record<string, unknown>): string {
  if (!payload) return "-";
  const entry = payload.entry as { id?: string; changes?: unknown[] }[] | undefined;
  if (Array.isArray(entry) && entry[0]?.id) {
    const changes = entry[0].changes as { field?: string }[] | undefined;
    const field = changes?.[0]?.field ?? "";
    return `WABA ${entry[0].id}${field ? ` / ${field}` : ""}`;
  }
  const keys = Object.keys(payload).slice(0, 3).join(", ");
  return keys || "-";
}

function maskPhoneId(id: string | null): string {
  if (!id) return "-";
  if (id.length <= 4) return id;
  return `•••${id.slice(-4)}`;
}

export function WhatsappWebhookMonitorClient({
  workspaceId,
  workspaceSlug,
  hasToken,
  phoneNumberId,
  displayName,
  initialEvents,
  initialStats,
}: Props) {
  const { toast } = useToast();
  const [events, setEvents] = useState<WebhookEvent[]>(initialEvents);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [reconciling, setReconciling] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("24h");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Auto-refresh
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Expanded rows
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Unique event types for dropdown
  const eventTypes = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.event_type) set.add(e.event_type);
    });
    return Array.from(set).sort();
  }, [events]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ workspaceId, limit: "100" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      const from = getDateFrom(dateRange);
      if (from) params.set("from", from);

      const res = await fetch(`/api/meta/whatsapp/webhook-events?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load events");
      }
      setEvents(data.events ?? []);
      setStats(data.stats ?? { total24h: 0, errors24h: 0, lastEventAt: null });
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, statusFilter, typeFilter, dateRange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
    if (autoRefreshInterval > 0) {
      autoRefreshRef.current = setInterval(() => {
        fetchEvents();
      }, autoRefreshInterval);
    }
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [autoRefreshInterval, fetchEvents]);

  const handleReconcile = useCallback(async () => {
    setReconciling(true);
    try {
      const res = await fetch(`/api/meta/whatsapp/process-events?reconcile=1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || data.reason || "Reconcile failed");
      }
      toast({ title: "Reconcile complete", description: `Processed ${data.processed ?? 0} events` });
      fetchEvents();
    } catch (err) {
      toast({
        title: "Reconcile failed",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setReconciling(false);
    }
  }, [workspaceId, fetchEvents, toast]);

  const handleCopyPayload = useCallback(
    (payload: Record<string, unknown>) => {
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast({ title: "Copied", description: "Payload copied to clipboard" });
    },
    [toast]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const healthStatus = useMemo(() => {
    if (!stats.lastEventAt) return "none";
    const diff = Date.now() - new Date(stats.lastEventAt).getTime();
    if (diff <= 24 * 60 * 60 * 1000) return "ok";
    return "stale";
  }, [stats.lastEventAt]);

  const healthBadgeStyle = useMemo(() => {
    if (healthStatus === "ok") return "bg-emerald-400/20 text-emerald-100 border-emerald-400/50";
    if (healthStatus === "stale") return "bg-amber-400/20 text-amber-100 border-amber-400/50";
    return "bg-gray-400/20 text-gray-300 border-gray-400/50";
  }, [healthStatus]);

  // Filter events by search
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter((evt) => {
      const type = evt.event_type?.toLowerCase() ?? "";
      const summary = summarizePayload(evt.payload_json).toLowerCase();
      const errText = evt.error_text?.toLowerCase() ?? "";
      return type.includes(q) || summary.includes(q) || errText.includes(q);
    });
  }, [events, searchQuery]);

  // Group events by day
  const groupedEvents = useMemo(() => {
    const groups: Record<string, WebhookEvent[]> = {};
    filteredEvents.forEach((evt) => {
      const date = evt.received_at ? new Date(evt.received_at).toLocaleDateString() : "Unknown";
      if (!groups[date]) groups[date] = [];
      groups[date].push(evt);
    });
    return groups;
  }, [filteredEvents]);

  const showTokenAlert = !hasToken;
  const showNoEventsAlert = healthStatus === "none" || (stats.total24h === 0 && !showTokenAlert);
  const showErrorsAlert = stats.errors24h > 0;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {showTokenAlert && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="flex-1">
            <p className="font-semibold text-red-300">Token Missing</p>
            <p className="text-red-300/80">WhatsApp connection requires a valid access token.</p>
          </div>
          <Link href={`/${workspaceSlug}/meta-hub/connections`}>
            <Button size="sm" variant="outline" className="border-red-400/50 text-red-300 hover:bg-red-500/20">
              Open Connections
            </Button>
          </Link>
        </div>
      )}

      {showNoEventsAlert && !showTokenAlert && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <div className="flex-1">
            <p className="font-semibold text-amber-300">No Events in 24h</p>
            <p className="text-amber-300/80">Verify your webhook is configured correctly in Meta Business Suite.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="ghost" className="text-amber-300">
                How to Verify <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-400/50 text-amber-300 hover:bg-amber-500/20"
              onClick={handleReconcile}
              disabled={reconciling}
            >
              Reconcile now
            </Button>
          </div>
        </div>
      )}

      {showErrorsAlert && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="flex-1">
            <p className="font-semibold text-red-300">{stats.errors24h} Errors in 24h</p>
            <p className="text-red-300/80">Some webhook events failed to process.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-red-400/50 text-red-300 hover:bg-red-500/20"
            onClick={() => setStatusFilter("failed")}
          >
            Show Errors
          </Button>
        </div>
      )}

      {/* Health Header */}
      <Card className="border-border bg-gradient-to-br from-[#0b1221] via-[#0f1c2c] to-[#111827]">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-gigaviz-gold/20 p-2 text-gigaviz-gold">
                <Zap size={18} />
              </span>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">Webhook Health</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {displayName ?? "WhatsApp"} • {maskPhoneId(phoneNumberId)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("border text-xs", healthBadgeStyle)}>
                {healthStatus === "ok" ? "Healthy" : healthStatus === "stale" ? "Stale" : "No events"}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  hasToken ? "border-emerald-400/50 text-emerald-300" : "border-red-400/50 text-red-300"
                )}
              >
                Token: {hasToken ? "OK" : "Missing"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Last Event</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{getRelativeTime(stats.lastEventAt)}</p>
              <p className="text-xs text-muted-foreground">{formatTime(stats.lastEventAt)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Events (24h)</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{stats.total24h}</p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Errors (24h)</p>
              <p className={cn("mt-1 text-lg font-semibold", stats.errors24h > 0 ? "text-red-400" : "text-foreground")}>
                {stats.errors24h}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Auto Refresh</p>
              <select
                className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1 text-sm"
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              >
                {AUTO_REFRESH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" onClick={handleReconcile} disabled={reconciling}>
              {reconciling ? "Reconciling..." : "Reconcile now"}
            </Button>
            <Button size="sm" variant="ghost" onClick={fetchEvents} disabled={loading}>
              <RefreshCw className={cn("mr-1 h-4 w-4", loading && "animate-spin")} />
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
            <Link href={`/${workspaceSlug}/meta-hub/connections`}>
              <Button size="sm" variant="ghost">
                <Settings className="mr-1 h-4 w-4" />
                Open Connections
              </Button>
            </Link>
            <Link
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="ghost">
                How to Verify <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
            {lastRefreshed && (
              <span className="text-xs text-muted-foreground">
                Last refreshed: {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <input
              type="text"
              placeholder="Search events..."
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="rounded-lg border border-border bg-background px-3 py-1.5"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-border bg-background px-3 py-1.5"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              {eventTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
              {DATE_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition",
                    dateRange === opt.value
                      ? "bg-gigaviz-gold/20 text-gigaviz-gold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setDateRange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {loading && filteredEvents.length === 0 ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border border-border bg-background p-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-sm font-semibold text-foreground">No webhook events found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Check that your webhook is configured correctly in Meta Business Suite.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href="https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gigaviz-gold hover:underline"
                >
                  Verify webhook setup →
                </Link>
                <Button size="sm" variant="outline" onClick={handleReconcile} disabled={reconciling}>
                  Reconcile now
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {Object.entries(groupedEvents).map(([date, dayEvents]) => (
                <div key={date}>
                  <div className="sticky top-0 z-10 border-b border-border bg-gigaviz-surface/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                    {date}
                  </div>
                  {dayEvents.map((evt) => {
                    const isError = !!evt.error_text;
                    const isProcessed = !!evt.processed_at;
                    const isExpanded = expandedIds.has(evt.id);
                    return (
                      <div key={evt.id}>
                        <button
                          className={cn(
                            "flex w-full flex-wrap items-start gap-4 px-4 py-3 text-left text-sm transition hover:bg-gigaviz-surface/30",
                            isError && "bg-red-500/5"
                          )}
                          onClick={() => toggleExpand(evt.id)}
                        >
                          <span className="mt-1 text-muted-foreground">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </span>
                          <div className="min-w-[120px]">
                            <p className="font-medium text-foreground">
                              {evt.received_at ? new Date(evt.received_at).toLocaleTimeString() : "-"}
                            </p>
                            <p className="text-xs text-muted-foreground">{getRelativeTime(evt.received_at)}</p>
                          </div>
                          <div className="min-w-[80px]">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                isError
                                  ? "border-red-400/50 text-red-300"
                                  : isProcessed
                                  ? "border-emerald-400/50 text-emerald-300"
                                  : "border-amber-400/50 text-amber-300"
                              )}
                            >
                              {isError ? "Failed" : isProcessed ? "OK" : "Pending"}
                            </Badge>
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="font-medium text-foreground">{evt.event_type || "event"}</p>
                            <p className="text-xs text-muted-foreground">{summarizePayload(evt.payload_json)}</p>
                            {isError && <p className="text-xs text-red-400">{evt.error_text}</p>}
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-border bg-background px-4 py-3">
                            <div className="flex items-center justify-between gap-2 pb-2">
                              <span className="text-xs font-semibold uppercase text-muted-foreground">Payload</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyPayload(evt.payload_json);
                                }}
                              >
                                <Copy size={12} className="mr-1" />
                                Copy
                              </Button>
                            </div>
                            <pre className="max-h-64 overflow-auto rounded-lg bg-gigaviz-surface p-3 text-xs text-muted-foreground">
                              {JSON.stringify(evt.payload_json, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}
    </div>
  );
}
