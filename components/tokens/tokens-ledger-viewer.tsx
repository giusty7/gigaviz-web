"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type LedgerEntry = {
  id: string;
  tokens: number;
  delta_bigint: number;
  entry_type: string | null;
  status: string | null;
  reason: string | null;
  note: string | null;
  ref_table: string | null;
  ref_id: string | null;
  created_at: string;
  created_by: string | null;
};

type Props = {
  workspaceId: string;
};

export function TokensLedgerViewer({ workspaceId }: Props) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        workspaceId,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/tokens/ledger?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load ledger");
      
      const data = await res.json();
      setEntries(data.entries || []);
      setTotalPages(Math.ceil((data.total || 0) / pageSize));
    } catch (err) {
      toast({
        title: "Failed to load ledger",
        description: err instanceof Error ? err.message : "Try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, page, pageSize, typeFilter, statusFilter, toast]);

  useEffect(() => {
    void fetchLedger();
  }, [fetchLedger]);

  const filteredEntries = entries.filter((entry) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const reason = entry.reason?.toLowerCase() ?? "";
      const note = entry.note?.toLowerCase() ?? "";
      const refId = entry.ref_id?.toLowerCase() ?? "";
      return reason.includes(query) || note.includes(query) || refId.includes(query);
    }
    return true;
  });

  const uniqueTypes = Array.from(new Set(entries.map((e) => e.entry_type).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(entries.map((e) => e.status).filter(Boolean)));

  if (loading && page === 1) {
    return (
      <Card className="border-border/80 bg-card/90">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#d4af37]" />
          Token Ledger
        </CardTitle>
        <CardDescription>
          Complete audit trail of all token transactions - topups, spends, and adjustments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reason, note, or ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type!}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status!}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ledger entries */}
        <div className="space-y-2">
          {filteredEntries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
              No ledger entries found
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isPositive = (entry.delta_bigint ?? entry.tokens ?? 0) > 0;
              const amount = Math.abs(entry.delta_bigint ?? entry.tokens ?? 0);

              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
                        isPositive
                          ? "bg-green-500/10 border-green-500/30 text-green-500"
                          : "bg-red-500/10 border-red-500/30 text-red-500"
                      )}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground">
                          {entry.reason || entry.entry_type || "Unknown"}
                        </p>
                        {entry.status && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              entry.status === "posted"
                                ? "border-green-500/30 text-green-500"
                                : entry.status === "pending"
                                  ? "border-yellow-500/30 text-yellow-500"
                                  : "border-border/70 text-muted-foreground"
                            )}
                          >
                            {entry.status}
                          </Badge>
                        )}
                      </div>
                      {entry.note && (
                        <p className="text-xs text-muted-foreground truncate">{entry.note}</p>
                      )}
                      {entry.ref_table && entry.ref_id && (
                        <p className="text-[11px] font-mono text-muted-foreground/80">
                          {entry.ref_table}:{entry.ref_id.slice(0, 8)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatRelative(entry.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={cn(
                        "font-mono font-bold text-base",
                        isPositive ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {isPositive ? "+" : "-"}
                      {amount.toLocaleString()}
                    </span>
                    {entry.entry_type && (
                      <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">
                        {entry.entry_type}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-border/60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{filteredEntries.length} entries displayed</span>
          </div>
          {(searchQuery || typeFilter !== "all" || statusFilter !== "all") && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" />
              <span>Filters active</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
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
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString();
}
