"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import type { TokenOverview, TokenLedgerRow } from "@/lib/tokens";

const packages = [
  { key: "starter_50k", label: "50k tokens", tokens: 50_000, bonus: "", price: "IDR 50k" },
  { key: "growth_120k", label: "120k tokens", tokens: 120_000, bonus: "+10% bonus", price: "IDR 120k" },
  { key: "scale_500k", label: "500k tokens", tokens: 500_000, bonus: "+15% bonus", price: "IDR 500k" },
];

type Props = {
  workspaceId: string;
  canActivate: boolean;
};

type PendingTopup = TokenLedgerRow & { requestId?: string | null };

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US").format(value);
}

export function TokenWalletClient({ workspaceId, canActivate }: Props) {
  const { toast } = useToast();
  const [overview, setOverview] = useState<TokenOverview | null>(null);
  const [pending, setPending] = useState<PendingTopup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);

  const selected = useMemo(() => packages.find((pkg) => pkg.key === selectedKey) ?? packages[0], [selectedKey]);

  async function loadOverview() {
    try {
      const res = await fetch(`/api/tokens/overview?workspaceId=${workspaceId}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.overview) throw new Error(json?.error || "Failed to load balance");
      setOverview(json.overview as TokenOverview);
    } catch (err) {
      toast({
        title: "Failed to load balance",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    }
  }

  async function loadPending() {
    try {
      const res = await fetch(`/api/tokens/ledger?workspaceId=${workspaceId}&type=topup&status=pending&pageSize=50`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      const rows = (json?.ledger?.rows ?? []) as PendingTopup[];
      setPending(rows);
    } catch {
      setPending([]);
    }
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadOverview(), loadPending()])
      .catch(() => null)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function submitTopup() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tokens/topup-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          packageKey: selected.key,
          tokens: selected.tokens,
          notes: notes.trim() || null,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Top up request failed");
      toast({ title: "Top up request sent", description: "We will confirm and credit tokens shortly." });
      setDialogOpen(false);
      setNotes("");
      await Promise.all([loadOverview(), loadPending()]);
    } catch (err) {
      toast({
        title: "Unable to request top up",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function activate(requestId: string) {
    setActivating(requestId);
    try {
      const res = await fetch("/api/tokens/topup-activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, requestId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to activate");
      toast({ title: "Top up activated", description: `New balance: ${formatNumber(json?.balance ?? 0)} tokens` });
      await Promise.all([loadOverview(), loadPending()]);
    } catch (err) {
      toast({
        title: "Activation failed",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      setActivating(null);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="border-border/80 bg-card/90">
        <CardContent className="p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-gigaviz-gold">Wallet</p>
              <h2 className="text-xl font-semibold text-foreground">Token Wallet</h2>
              <p className="text-sm text-muted-foreground">
                Available balance powers AI/API calls. Top ups post to the ledger for auditability.
              </p>
            </div>
            <div className="rounded-2xl border border-gigaviz-gold/40 bg-gigaviz-surface/70 px-4 py-3 text-right shadow-inner">
              <p className="text-xs text-muted-foreground">Available balance</p>
              <p className="text-3xl font-semibold text-foreground">
                {loading ? "…" : formatNumber(overview?.balance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {packages.map((pkg) => (
          <div
            key={pkg.key}
            className="flex flex-col justify-between rounded-2xl border border-border/70 bg-gradient-to-b from-gigaviz-surface/90 to-slate-950/80 p-5 shadow-lg shadow-black/10"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{pkg.label}</p>
                {pkg.bonus ? (
                  <Badge variant="outline" className="border-emerald-400/60 text-emerald-100">
                    {pkg.bonus}
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">{pkg.price} · premium routing</p>
              <p className="text-xs text-muted-foreground">{formatNumber(pkg.tokens)} tokens</p>
            </div>
            <Dialog open={dialogOpen && selectedKey === pkg.key} onOpenChange={(open) => {
              setDialogOpen(open);
              setSelectedKey(pkg.key);
            }}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="mt-4" onClick={() => setSelectedKey(pkg.key)}>
                  Top up
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm top up</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <div className="rounded-xl border border-border/70 bg-gigaviz-surface/60 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Package</span>
                      <span className="font-semibold text-foreground">{pkg.label}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Tokens</span>
                      <span className="text-foreground">{formatNumber(pkg.tokens)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Notes (optional)</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Invoice memo, cost center, or special handling."
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={submitTopup} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit request"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>

      <Card className="border-border/80 bg-card/90">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Pending</p>
              <h3 className="text-sm font-semibold text-foreground">Top up requests</h3>
              <p className="text-xs text-muted-foreground">Pending entries appear before activation. Activation posts to wallet + ledger.</p>
            </div>
            <Badge variant="outline" className="border-border/70 text-muted-foreground">{pending.length} pending</Badge>
          </div>
          <div className="space-y-2">
            {pending.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-gigaviz-surface/60 px-4 py-3 text-sm text-muted-foreground">
                No pending top ups.
              </div>
            ) : (
              pending.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/70 bg-gigaviz-surface/70 px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{formatNumber(row.tokens)} tokens</p>
                    <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="border-amber-400/60 text-amber-100">Pending</Badge>
                    {row.note ? <span className="text-muted-foreground">{row.note}</span> : null}
                  </div>
                  {canActivate && row.ref_id ? (
                    <Button
                      variant="secondary"
                      onClick={() => activate(row.ref_id as string)}
                      disabled={activating === row.ref_id}
                    >
                      {activating === row.ref_id ? "Activating..." : "Mark paid"}
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </div>
          {canActivate ? (
            <div className="flex items-center gap-2 rounded-xl border border-gigaviz-gold/40 bg-gigaviz-gold/10 px-3 py-2 text-xs text-gigaviz-gold">
              <ShieldCheck className="h-4 w-4" /> Only owners/admins can activate requests.
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="h-4 w-4" /> Waiting for admin to confirm payment.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/90">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-gigaviz-gold" />
            <div>
              <p className="text-sm font-semibold text-foreground">Premium wallet</p>
              <p className="text-xs text-muted-foreground">
                Top ups stay per-workspace. Ledger keeps a signed trail for audits.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-gigaviz-gold/50 text-gigaviz-gold">
            Multi-tenant safe
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
