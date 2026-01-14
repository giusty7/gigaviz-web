"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import type { TokenLedgerRow } from "@/lib/tokens";

const formatter = new Intl.NumberFormat("en-US");

const typeOptions = [
  { label: "All", value: "" },
  { label: "Top up", value: "topup" },
  { label: "Spend", value: "spend" },
  { label: "Adjust", value: "adjust" },
];

const statusOptions = [
  { label: "All", value: "" },
  { label: "Posted", value: "posted" },
  { label: "Pending", value: "pending" },
  { label: "Void", value: "void" },
];

type LedgerResponse = {
  ledger: {
    rows: TokenLedgerRow[];
    page: number;
    pageSize: number;
    total: number;
  };
  error?: string;
};

type Props = {
  workspaceId: string;
};

function statusBadge(status: string) {
  switch (status) {
    case "pending":
      return "border-amber-400/60 text-amber-100 bg-amber-500/10";
    case "void":
      return "border-muted-foreground/40 text-muted-foreground bg-muted/10";
    default:
      return "border-emerald-400/60 text-emerald-100 bg-emerald-500/10";
  }
}

function typeBadge(type: string) {
  switch (type) {
    case "topup":
      return "border-gigaviz-gold/60 text-gigaviz-gold bg-gigaviz-gold/10";
    case "spend":
      return "border-red-400/60 text-red-200 bg-red-500/10";
    default:
      return "border-slate-400/50 text-foreground bg-card";
  }
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export function TokenLedgerClient({ workspaceId }: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState<TokenLedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: "", status: "", from: "", to: "" });

  const filteredCount = useMemo(() => rows.length, [rows]);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ workspaceId, pageSize: "50" });
      if (filters.type) params.set("type", filters.type);
      if (filters.status) params.set("status", filters.status);
      if (filters.from) params.set("from", `${filters.from}T00:00:00Z`);
      if (filters.to) params.set("to", `${filters.to}T23:59:59Z`);
      const res = await fetch(`/api/tokens/ledger?${params.toString()}`, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as LedgerResponse | null;
      if (!res.ok || !json?.ledger) throw new Error(json?.error || "Failed to load ledger");
      setRows(json.ledger.rows ?? []);
    } catch (err) {
      toast({
        title: "Unable to load ledger",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, filters.type, filters.status, filters.from, filters.to]);

  return (
    <Card className="border-border/80 bg-card/90">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Ledger</p>
            <h3 className="text-lg font-semibold text-foreground">Token ledger</h3>
            <p className="text-sm text-muted-foreground">Signed trail of top ups, spends, and adjustments per workspace.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-gigaviz-surface/60 px-3 py-2 text-xs text-muted-foreground">
              <Filter className="h-4 w-4" />
              {filteredCount} entries
            </div>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-4 md:items-end">
          <label className="text-xs text-muted-foreground">
            Type
            <select
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Status
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            From
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              className="mt-1"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            To
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              className="mt-1"
            />
          </label>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow className="bg-gigaviz-surface/70">
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading ledger...
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    <div className="py-4">No ledger entries yet.</div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const tokenValue = Number(row.tokens ?? row.delta_bigint ?? 0);
                  const isPositive = tokenValue >= 0;
                  return (
                    <TableRow key={row.id} className="hover:bg-gigaviz-surface/40">
                      <TableCell className="whitespace-nowrap text-sm text-foreground">{formatDate(row.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={typeBadge(row.entry_type)}>
                          {row.entry_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadge(row.status)}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${isPositive ? "text-emerald-200" : "text-red-200"}`}>
                        {isPositive ? "+" : "-"}
                        {formatter.format(Math.abs(tokenValue))}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.ref_table || row.reason || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.note || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
