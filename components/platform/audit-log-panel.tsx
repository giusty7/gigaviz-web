"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock3, Loader2, ShieldCheck, Sparkles, Users, Search, Filter, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuditLogExport } from "./audit-log-export";

export type AuditEvent = {
  id: string;
  action: string;
  actor_email: string | null;
  created_at: string;
  meta: Record<string, unknown> | null;
};

type AuditLogPanelProps = {
  workspaceId: string;
  workspaceName?: string;
};

const ITEMS_PER_PAGE = 20;

export function AuditLogPanel({ workspaceId, workspaceName = "Workspace" }: AuditLogPanelProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/audit-events?workspaceId=${workspaceId}`);
      if (!res.ok) {
        throw new Error("Failed to load audit events.");
      }
      const payload = (await res.json()) as { events: AuditEvent[] };
      setEvents(payload.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadEvents();
  };

  const uniqueActions = Array.from(new Set(events.map((e) => e.action))).sort();

  const filteredEvents = events.filter((event) => {
    if (actionFilter !== "all" && event.action !== actionFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const action = event.action.toLowerCase();
      const actor = event.actor_email?.toLowerCase() ?? "";
      return action.includes(query) || actor.includes(query);
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, actionFilter]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading audit log...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-background px-4 py-6 text-center text-sm">
        <p className="font-semibold text-foreground">No audit events yet</p>
        <p className="text-xs text-muted-foreground">Perform actions like role updates or billing requests to generate entries.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export + Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {events.length} total events
          </div>
          <AuditLogExport events={events} workspaceName={workspaceName} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by action or actor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Results count */}
      {(searchQuery || actionFilter !== "all") && (
        <div className="text-xs text-muted-foreground">
          Showing {filteredEvents.length} of {events.length} events
          {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
        </div>
      )}

      {/* Events list */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-background px-4 py-6 text-center text-sm">
          <p className="font-semibold text-foreground">No matching events</p>
          <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-start justify-between rounded-xl border border-border/80 bg-background px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-gigaviz-surface/70 text-gigaviz-gold">
                    <IconForAction action={evt.action} />
                  </span>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-foreground">{evt.action}</p>
                    <p className="text-xs text-muted-foreground">{evt.actor_email ?? "Unknown actor"}</p>
                    {evt.meta ? (
                      <p className="text-[11px] text-muted-foreground/80 font-mono">{JSON.stringify(evt.meta)}</p>
                    ) : null}
                  </div>
                </div>
                <Badge variant="outline" className="border-border/70 text-[11px] text-muted-foreground">
                  {formatRelative(evt.created_at)}
                </Badge>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <div className="text-xs text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredEvents.length)} of {filteredEvents.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function IconForAction({ action }: { action: string }) {
  if (action.startsWith("billing")) return <Sparkles className="h-4 w-4" />;
  if (action.startsWith("member")) return <Users className="h-4 w-4" />;
  if (action.startsWith("workspace")) return <ShieldCheck className="h-4 w-4" />;
  return <Clock3 className="h-4 w-4" />;
}

function formatRelative(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "now";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
