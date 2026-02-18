"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Crown, Zap, Sparkles, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: Record<string, unknown>) => void;
          onPending?: (result: Record<string, unknown>) => void;
          onError?: (result: Record<string, unknown>) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

type Plan = {
  code: string;
  name: string;
  type: "individual" | "team";
  monthly_price_idr: number;
  seat_limit: number;
  features: string[];
  recommended?: boolean;
};

type Props = {
  workspaceId: string;
  currentPlanCode: string | null;
  plans: Plan[];
  midtransEnabled?: boolean;
};

const planIcons = {
  free: Crown,
  starter: Zap,
  pro: Sparkles,
  business: TrendingUp,
};

export function PlanComparisonInteractive({ workspaceId, currentPlanCode, plans, midtransEnabled }: Props) {
  const { toast } = useToast();
  const t = useTranslations("billing");
  const [billingMode, setBillingMode] = useState<"individual" | "team">("individual");
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const filteredPlans = plans.filter((p) => p.type === billingMode);

  /** Load Midtrans Snap.js script */
  function loadSnapScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.snap) { resolve(); return; }
      const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
      const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
      if (!clientKey) { reject(new Error("Midtrans client key not set")); return; }
      const script = document.createElement("script");
      script.src = isProduction
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";
      script.setAttribute("data-client-key", clientKey);
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Midtrans Snap"));
      document.head.appendChild(script);
    });
  }

  const handleSelectPlan = async (planCode: string) => {
    if (planCode === currentPlanCode) return;

    setUpgrading(planCode);
    try {
      // Map plan codes to Midtrans-compatible plan codes
      const midtransPlanCodes = ["starter", "growth", "business"];
      const isPaidPlan = midtransPlanCodes.includes(planCode) || 
        planCode.includes("starter") || planCode.includes("pro");

      if (midtransEnabled && isPaidPlan) {
        // Normalize legacy plan codes to new plan codes for Midtrans
        let normalizedCode = planCode;
        if (planCode === "ind_starter" || planCode === "team_starter") normalizedCode = "starter";
        if (planCode === "ind_pro" || planCode === "team_pro") normalizedCode = "business";

        const res = await fetch("/api/billing/midtrans/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planCode: normalizedCode, interval: "monthly" }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.token) {
          throw new Error(data?.message || data?.error || t("failedCreateCheckout"));
        }

        await loadSnapScript();

        if (window.snap) {
          window.snap.pay(data.token, {
            onSuccess: () => {
              toast({ title: t("subscriptionActivated"), description: t("planActivatedReload", { plan: planCode.toUpperCase() }) });
              setTimeout(() => window.location.reload(), 1500);
            },
            onPending: () => {
              toast({ title: t("paymentPending"), description: t("completePayment") });
            },
            onError: () => {
              toast({ title: t("paymentFailed"), description: t("tryDifferentMethod"), variant: "destructive" });
            },
          });
        } else if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      } else {
        // Free plan or no Midtrans — direct subscription set
        const res = await fetch("/api/billing/subscription/set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, planCode }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.message || t("failedUpdatePlan"));
        }
        toast({
          title: t("subscriptionActivated"),
          description: t("planActivatedReload", { plan: planCode.toUpperCase() }),
        });
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      toast({
        title: t("failedUpdatePlan"),
        description: err instanceof Error ? err.message : t("tryAgainLater"),
        variant: "destructive",
      });
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Billing mode selector */}
      <div className="flex justify-center">
        <Tabs value={billingMode} onValueChange={(v) => setBillingMode(v as "individual" | "team")}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="individual">
              {t("individual")}
              <Badge variant="outline" className="ml-2 text-[10px]">
                {t("solo")}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="team">
              {t("team")}
              <Badge variant="outline" className="ml-2 text-[10px]">
                {t("multiUser")}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plans grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlans.map((plan) => {
          const isCurrent = plan.code === currentPlanCode;
          const isUpgrading = upgrading === plan.code;
          const Icon = planIcons[plan.code.split("_")[1] as keyof typeof planIcons] ?? Zap;

          return (
            <Card
              key={plan.code}
              className={cn(
                "relative overflow-hidden border transition-all",
                plan.recommended
                  ? "border-[#d4af37] bg-[#d4af37]/5 shadow-lg shadow-[#d4af37]/10"
                  : "border-border/80 bg-card/90 hover:border-border hover:shadow-md",
                isCurrent && "ring-2 ring-[#d4af37] ring-offset-2 ring-offset-background"
              )}
            >
              {/* Recommended badge */}
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-[#d4af37] to-[#f9d976] px-3 py-1 text-xs font-semibold text-[#050a18] rounded-bl-lg">
                  {t("recommended")}
                </div>
              )}

              <CardContent className="p-6 space-y-4">
                {/* Plan header */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 border border-[#d4af37]/30">
                      <Icon className="h-6 w-6 text-[#d4af37]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {t("seats", { count: plan.seat_limit })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="py-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      {plan.monthly_price_idr === 0
                        ? t("free")
                        : `Rp ${(plan.monthly_price_idr / 1000).toLocaleString()}k`}
                    </span>
                    {plan.monthly_price_idr > 0 && (
                      <span className="text-sm text-muted-foreground">{t("pricePerMonth")}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {billingMode === "team" ? t("perWorkspace") : t("singleUser")}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2 border-t border-border/60 pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("whatsIncluded")}
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-[#d4af37] mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="pt-2">
                  {isCurrent ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {t("currentPlan")}
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        "w-full",
                        plan.recommended &&
                          "bg-gradient-to-r from-[#d4af37] to-[#f9d976] hover:from-[#f9d976] hover:to-[#d4af37] text-[#050a18] font-semibold"
                      )}
                      onClick={() => handleSelectPlan(plan.code)}
                      disabled={isUpgrading}
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t("activating")}
                        </>
                      ) : (
                        <>
                          {t("selectPlan")}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground text-center">
        <p>
          {t("planDisclaimer")}
        </p>
      </div>
    </div>
  );
}
