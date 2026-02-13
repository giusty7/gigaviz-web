"use client";

import { useEffect, useState } from "react";
import { CreditCard, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import type { BillingSummary } from "@/lib/billing/summary";

type Props = {
  workspaceId: string;
  initialSummary?: BillingSummary | null;
  canEdit: boolean;
  /** Whether Stripe is configured (NEXT_PUBLIC_STRIPE_ENABLED) */
  stripeEnabled?: boolean;
};

const packages = [
  { id: "pkg_50k", label: "50.000", tokens: 50_000, amountIdr: 50_000 },
  { id: "pkg_100k", label: "100.000 + bonus", tokens: 105_000, amountIdr: 100_000 },
  { id: "pkg_500k", label: "500.000 + bonus", tokens: 550_000, amountIdr: 500_000 },
];

const numberFormatter = new Intl.NumberFormat("id-ID");

export function TokenTopupClient({ workspaceId, initialSummary, canEdit, stripeEnabled }: Props) {
  const { toast } = useToast();
  const t = useTranslations("billing");
  const [summary, setSummary] = useState<BillingSummary | null>(initialSummary ?? null);
  const [loading, setLoading] = useState(!initialSummary);
  const [active, setActive] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState<string | null>(null);
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
        throw new Error(data?.message || t("failedLoadWallet"));
      }
      setSummary(data.summary as BillingSummary);
    } catch (err) {
      toast({
        title: t("failedLoadWallet"),
        description: err instanceof Error ? err.message : t("tryAgainLater"),
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
        throw new Error(data?.message || t("failedLoadPending"));
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
        title: t("failedLoadPending"),
        description: err instanceof Error ? err.message : t("tryAgainLater"),
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
        throw new Error(data?.message || t("topUpFailed"));
      }
      if (data?.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank", "noopener,noreferrer");
      }
      toast({
        title: t("topUpCreated"),
        description: data?.checkoutUrl
          ? t("continuePayment")
          : t("waitingActivation"),
      });
      await fetchSummary();
      await fetchPending();
    } catch (err) {
      toast({
        title: t("topUpFailed"),
        description: err instanceof Error ? err.message : t("tryAgainLater"),
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
        throw new Error(data?.message || t("confirmFailed"));
      }
      toast({
        title: t("topUpConfirmed"),
        description: t("balanceIncreased", { count: numberFormatter.format(data.tokens ?? 0) }),
      });
      await fetchSummary();
      await fetchPending();
    } catch (err) {
      toast({
        title: t("confirmFailed"),
        description: err instanceof Error ? err.message : t("tryAgainLater"),
        variant: "destructive",
      });
    } finally {
      setMarking(null);
    }
  }

  async function handleStripeCheckout(pkg: (typeof packages)[number]) {
    setStripeLoading(pkg.id);
    try {
      const res = await fetch("/api/billing/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokens: pkg.tokens,
          amountIdr: pkg.amountIdr,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        throw new Error(data?.message || data?.error || t("checkoutFailed"));
      }
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      toast({
        title: t("checkoutFailed"),
        description: err instanceof Error ? err.message : t("tryAgainLater"),
        variant: "destructive",
      });
    } finally {
      setStripeLoading(null);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t("tokenWallet")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("tokenWalletDesc")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{t("balance")}</p>
          <p className="text-2xl font-semibold text-foreground">
            {loading ? t("loading") : numberFormatter.format(summary?.wallet.balance ?? 0)}
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
              {t("tokens", { count: numberFormatter.format(pkg.tokens) })}
            </p>
            <p className="text-xs text-muted-foreground">
              Rp {numberFormatter.format(pkg.amountIdr)}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {stripeEnabled && (
                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => handleStripeCheckout(pkg)}
                  disabled={stripeLoading === pkg.id}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {stripeLoading === pkg.id ? t("redirecting") : t("payWithCard")}
                </Button>
              )}
              <Button
                className="w-full"
                variant={stripeEnabled ? "outline" : "secondary"}
                onClick={() => handleTopup(pkg.id)}
                disabled={active === pkg.id}
              >
                <Banknote className="mr-2 h-4 w-4" />
                {active === pkg.id ? t("processing") : stripeEnabled ? t("manualTransfer") : t("topUp")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {canEdit ? (
        <div className="mt-6 rounded-xl border border-border bg-background/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{t("manualActivation")}</p>
              <p className="text-xs text-muted-foreground">
                {t("manualActivationDesc")}
              </p>
            </div>
            <Button variant="outline" onClick={fetchPending}>
              {t("refresh")}
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noPending")}</p>
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
                    {marking === intent.id ? t("processing") : t("markPaid")}
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
