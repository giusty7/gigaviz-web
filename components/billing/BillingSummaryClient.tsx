"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { BillingSummary } from "@/lib/billing/summary";

type Props = {
  workspaceSlug: string;
  initialSummary?: BillingSummary | null;
};

export function BillingSummaryClient({ workspaceSlug, initialSummary }: Props) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<BillingSummary | null>(initialSummary ?? null);
  const [loading, setLoading] = useState(!initialSummary);
  const [upgrading, setUpgrading] = useState(false);

  const activePlanName =
    summary?.plan?.name ?? summary?.subscription?.plan_code ?? "Free (Locked)";

  const upgradePlanCode = useMemo(() => {
    if (!summary?.plans?.length) return "team";
    const team = summary.plans.find((plan) => plan.code === "team");
    return team?.code ?? summary.plans[summary.plans.length - 1]?.code ?? "team";
  }, [summary?.plans]);

  async function fetchSummary() {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/summary?workspaceSlug=${workspaceSlug}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "Failed to load billing");
      }
      setSummary(data.summary as BillingSummary);
    } catch (err) {
      toast({
        title: "Failed to load billing",
        description: err instanceof Error ? err.message : "Try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch("/api/billing/subscription/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceSlug, planCode: upgradePlanCode }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || data?.error || "Failed to update subscription");
      }
      toast({
        title: "Subscription activated",
        description: `Plan ${upgradePlanCode.toUpperCase()} is now active.`,
      });
      await fetchSummary();
    } catch (err) {
      toast({
        title: "Upgrade failed",
        description: err instanceof Error ? err.message : "Try again later.",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50">Active plan</p>
              <h1 className="text-2xl font-semibold text-white">
                {loading ? "Loading..." : activePlanName}
              </h1>
              <p className="text-sm text-white/60">
                Code: {summary?.subscription?.plan_code ?? "free_locked"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">Status</p>
              <p className="text-sm font-semibold text-white">
                {summary?.statusLabel ?? "—"}
              </p>
            </div>
          </div>
          <div className="text-sm text-white/60">{summary?.periodLabel ?? "Period not available"}</div>
          {summary?.plan?.seat_limit ? (
            <div className="text-sm text-white/60">Seat limit: {summary.plan.seat_limit}</div>
          ) : null}
          <div className="pt-3">
            <Button onClick={handleUpgrade} variant="secondary" disabled={upgrading}>
              {upgrading ? "Processing..." : "Upgrade (coming soon)"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Upgrade</h2>
            <p className="text-sm text-white/60">Upgrade via sales. Payments are not enabled yet.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleUpgrade} variant="secondary" disabled={upgrading}>
              {upgrading ? "Processing..." : "Contact sales / Upgrade"}
            </Button>
            <Link href={`/${workspaceSlug}/billing`} className="text-sm text-white/60 underline">
              Refresh
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
