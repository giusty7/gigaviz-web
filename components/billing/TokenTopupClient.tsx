"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { BillingSummary } from "@/lib/billing/summary";

type Props = {
  workspaceId: string;
  initialSummary?: BillingSummary | null;
  canEdit: boolean;
};

const packages = [
  { id: "pkg_50k", label: "50.000", tokens: 50_000, amountIdr: 50_000 },
  { id: "pkg_100k", label: "100.000 + bonus", tokens: 105_000, amountIdr: 100_000 },
  { id: "pkg_500k", label: "500.000 + bonus", tokens: 550_000, amountIdr: 500_000 },
];

const numberFormatter = new Intl.NumberFormat("id-ID");

export function TokenTopupClient({ workspaceId, initialSummary, canEdit }: Props) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<BillingSummary | null>(initialSummary ?? null);
  const [loading, setLoading] = useState(!initialSummary);
  const [active, setActive] = useState<string | null>(null);
  const [pending, setPending] = useState<
    Array<{ id: string; amount_idr: number; created_at: string; meta: Record<string, unknown> }>
  >([]);
  const [marking, setMarking] = useState<string | null>(null);

  async function fetchSummary() {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/summary?workspaceId=${workspaceId}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "Failed to load wallet");
      }
      setSummary(data.summary as BillingSummary);
    } catch (err) {
      toast({
        title: "Failed to load wallet",
        description: err instanceof Error ? err.message : "Try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchPending() {
    if (!canEdit) return;
    try {
      const res = await fetch(`/api/billing/topup/pending?workspaceId=${workspaceId}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "Failed to load pending top ups");
      }
      setPending(
        Array.isArray(data?.intents)
          ? data.intents.map((intent: Record<string, unknown>) => ({
              id: String(intent.id),
              amount_idr: Number(intent.amount_idr ?? 0),
              created_at: String(intent.created_at ?? new Date().toISOString()),
              meta: (intent.meta as Record<string, unknown>) ?? {},
            }))
          : []
      );
    } catch (err) {
      toast({
        title: "Failed to load pending top ups",
        description: err instanceof Error ? err.message : "Try again later.",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, canEdit]);

  async function handleTopup(packageId: string) {
    setActive(packageId);
    try {
      const res = await fetch("/api/billing/topup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, packageId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "Failed to create top up");
      }
      if (data?.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank", "noopener,noreferrer");
      }
      toast({
        title: "Top up created",
        description: data?.checkoutUrl
          ? "Continue to payment to finish."
          : "Waiting for manual activation for this top up.",
      });
      await fetchSummary();
      await fetchPending();
    } catch (err) {
      toast({
        title: "Top up failed",
        description: err instanceof Error ? err.message : "Try again later.",
        variant: "destructive",
      });
    } finally {
      setActive(null);
    }
  }

  async function handleMarkPaid(intentId: string) {
    setMarking(intentId);
    try {
      const res = await fetch("/api/billing/topup/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, paymentIntentId: intentId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "Failed to mark as paid");
      }
      toast({
        title: "Top up confirmed",
        description: `Balance increased by ${numberFormatter.format(data.tokens ?? 0)} tokens.`,
      });
      await fetchSummary();
      await fetchPending();
    } catch (err) {
      toast({
        title: "Confirmation failed",
        description: err instanceof Error ? err.message : "Try again later.",
        variant: "destructive",
      });
    } finally {
      setMarking(null);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Token Wallet</h2>
          <p className="text-sm text-muted-foreground">
            Token balance is used for AI/API usage. Top ups add balance immediately after payment is
            confirmed.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className="text-2xl font-semibold text-foreground">
            {loading ? "Loading..." : numberFormatter.format(summary?.wallet.balance ?? 0)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="rounded-xl border border-border bg-gigaviz-surface p-4"
          >
            <p className="text-sm font-semibold text-foreground">{pkg.label}</p>
            <p className="text-xs text-muted-foreground mt-1">
              +{numberFormatter.format(pkg.tokens)} tokens
            </p>
            <Button
              className="mt-4 w-full"
              variant="secondary"
              onClick={() => handleTopup(pkg.id)}
              disabled={active === pkg.id}
            >
              {active === pkg.id ? "Processing..." : "Top up"}
            </Button>
          </div>
        ))}
      </div>

      {canEdit ? (
        <div className="mt-6 rounded-xl border border-border bg-background/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Manual activation</p>
              <p className="text-xs text-muted-foreground">
                Use this button to mark pending top ups as paid (manual MVP flow).
              </p>
            </div>
            <Button variant="outline" onClick={fetchPending}>
              Refresh
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending top ups.</p>
            ) : (
              pending.map((intent) => (
                <div
                  key={intent.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-gigaviz-surface px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      Rp {numberFormatter.format(intent.amount_idr)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(intent.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleMarkPaid(intent.id)}
                    disabled={marking === intent.id}
                  >
                    {marking === intent.id ? "Processing..." : "Mark paid"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
