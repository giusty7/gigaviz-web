"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Crown, Sparkles, ArrowUpRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { BillingSummary } from "@/lib/billing/summary";

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  initialSummary?: BillingSummary | null;
};

export function BillingSummaryClient({ workspaceId, workspaceSlug, initialSummary }: Props) {
  const t = useTranslations("billing");
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
      const res = await fetch(`/api/billing/summary?workspaceId=${workspaceId}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || t("failedLoadBilling"));
      }
      setSummary(data.summary as BillingSummary);
    } catch (err) {
      toast({
        title: t("failedLoadBilling"),
        description: err instanceof Error ? err.message : t("tryAgainLater"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch("/api/billing/subscription/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, planCode: upgradePlanCode }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || data?.error || t("upgradeFailed"));
      }
      toast({
        title: t("subscriptionActivated"),
        description: t("planActivated", { plan: upgradePlanCode.toUpperCase() }),
      });
      await fetchSummary();
    } catch (err) {
      toast({
        title: t("upgradeFailed"),
        description: err instanceof Error ? err.message : t("tryAgainLater"),
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <div className="relative space-y-6">
      {/* Cyber-Batik Pattern Background */}
      <div className="pointer-events-none absolute inset-0 batik-pattern opacity-[0.03]" aria-hidden />

      {/* Royal Treasury Header Card */}
      <motion.section
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6 backdrop-blur-xl"
      >
        {/* Gold gradient overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl gradient-overlay-gold-tr-10"
          aria-hidden
        />
        
        <div className="relative flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Crown Icon */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 shadow-lg shadow-[#d4af37]/10">
                <Crown className="h-7 w-7 text-[#d4af37]" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#d4af37]">{t("treasury")}</p>
                <h1 className="mt-1 text-2xl font-bold">
                  <span className="bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent">
                    {loading ? t("loading") : activePlanName}
                  </span>
                </h1>
                <p className="mt-1 text-sm text-[#f5f5dc]/60">
                  {t("planCode")}: <span className="font-mono text-[#f5f5dc]/80">{summary?.subscription?.plan_code ?? "free_locked"}</span>
                </p>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 rounded-full bg-[#10b981]/15 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10b981]" />
                </span>
                <span className="text-xs font-semibold text-[#10b981]">
                  {summary?.statusLabel ?? t("active")}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-2 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[#d4af37]/10 bg-[#050a18]/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/40">{t("billingPeriod")}</p>
              <p className="mt-1 text-sm font-semibold text-[#f5f5dc]">
                {summary?.periodLabel ?? t("periodNotAvailable")}
              </p>
            </div>
            {summary?.plan?.seat_limit && (
              <div className="rounded-xl border border-[#d4af37]/10 bg-[#050a18]/50 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/40">{t("seatLimit")}</p>
                <p className="mt-1 text-sm font-semibold text-[#f5f5dc]">{t("seats", { count: summary.plan.seat_limit })}</p>
              </div>
            )}
            <div className="rounded-xl border border-[#10b981]/20 bg-[#10b981]/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#10b981]" />
                <p className="text-xs font-medium text-[#10b981]">{t("enterpriseSecurity")}</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18] font-semibold hover:from-[#f9d976] hover:to-[#d4af37] shadow-lg shadow-[#d4af37]/20"
            >
              {upgrading ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                <>
                  <Crown className="mr-2 h-4 w-4" />
                  {t("upgradePlan")}
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Upgrade Section */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-[#d4af37]/15 bg-[#0a1229]/60 p-6 backdrop-blur-xl"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#e11d48]" />
              <h2 className="text-lg font-semibold text-[#f5f5dc]">{t("upgradeEmpire")}</h2>
            </div>
            <p className="mt-1 text-sm text-[#f5f5dc]/60">
              {t("contactSalesDesc")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleUpgrade}
              variant="outline"
              disabled={upgrading}
              className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37]/50"
            >
              {upgrading ? t("processing") : t("contactSales")}
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
            <Link
              href={`/${workspaceSlug}/billing`}
              className="text-sm text-[#f5f5dc]/50 hover:text-[#d4af37] transition-colors"
            >
              {t("refresh")}
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
