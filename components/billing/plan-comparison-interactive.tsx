"use client";

import { useState } from "react";
import { Check, Crown, Zap, Sparkles, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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
  workspaceSlug: string;
  currentPlanCode: string | null;
  plans: Plan[];
};

const planIcons = {
  free: Crown,
  starter: Zap,
  pro: Sparkles,
  business: TrendingUp,
};

export function PlanComparisonInteractive({ workspaceSlug, currentPlanCode, plans }: Props) {
  const { toast } = useToast();
  const [billingMode, setBillingMode] = useState<"individual" | "team">("individual");
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const filteredPlans = plans.filter((p) => p.type === billingMode);

  const handleSelectPlan = async (planCode: string) => {
    if (planCode === currentPlanCode) return;

    setUpgrading(planCode);
    try {
      const res = await fetch("/api/billing/subscription/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceSlug, planCode }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to update plan");
      }

      toast({
        title: "Plan activated",
        description: `${planCode.toUpperCase()} plan is now active. Refresh to see changes.`,
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      toast({
        title: "Failed to update plan",
        description: err instanceof Error ? err.message : "Try again later",
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
              Individual
              <Badge variant="outline" className="ml-2 text-[10px]">
                Solo
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="team">
              Team
              <Badge variant="outline" className="ml-2 text-[10px]">
                Multi-user
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
                  Recommended
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
                        {plan.seat_limit} seat{plan.seat_limit > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="py-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      {plan.monthly_price_idr === 0
                        ? "Free"
                        : `Rp ${(plan.monthly_price_idr / 1000).toLocaleString()}k`}
                    </span>
                    {plan.monthly_price_idr > 0 && (
                      <span className="text-sm text-muted-foreground">/month</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {billingMode === "team" ? "Per workspace" : "Single user"}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2 border-t border-border/60 pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    What&apos;s included
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
                      Current Plan
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
                          Activating...
                        </>
                      ) : (
                        <>
                          Select Plan
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
          💡 Plans can be changed anytime. Token usage is billed separately based on actual consumption.
          Contact support for enterprise pricing or custom plans.
        </p>
      </div>
    </div>
  );
}
