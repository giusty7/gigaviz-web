"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ContactSalesDialog from "@/components/app/ContactSalesDialog";
import { Button } from "@/components/ui/button";
import type { PlanMeta } from "@/lib/entitlements";

type ComparePlansProps = {
  plans: PlanMeta[];
  activePlanId?: string | null;
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  userEmail: string;
};

export default function ComparePlans({ plans, activePlanId, workspaceId, workspaceSlug, workspaceName, userEmail }: ComparePlansProps) {
  const t = useTranslations("appUI.comparePlans");
  const [mode, setMode] = useState<"individual" | "team">("individual");

  const filtered = useMemo(
    () => plans.filter((plan) => plan.billing_mode === mode),
    [plans, mode]
  );

  return (
    <ContactSalesDialog
      workspaceId={workspaceId}
      workspaceName={workspaceName}
      workspaceSlug={workspaceSlug}
      userEmail={userEmail}
      planOptions={plans}
      defaultPlanId={activePlanId}
    >
      {(openDialog) => (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t("title")}</h2>
              <p className="text-sm text-white/60">
                {t("description")}
              </p>
            </div>
            <div className="flex rounded-xl border border-white/10 bg-black/20 p-1 text-xs">
              {(["individual", "team"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMode(tab)}
                  className={`rounded-lg px-3 py-2 transition ${
                    mode === tab ? "bg-white/10 text-white" : "text-white/50"
                  }`}
                >
                  {tab === "individual" ? t("individual") : t("team")}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {filtered.map((plan) => (
              <div
                key={plan.plan_id}
                className={`rounded-2xl border ${
                  activePlanId === plan.plan_id
                    ? "border-[color:var(--gv-accent)]"
                    : "border-white/10"
                } bg-black/20 p-5`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold">{plan.name}</h3>
                    <p className="text-xs text-white/50 mt-1">
                      {t("seatLimit", { limit: plan.seat_limit })}
                    </p>
                  </div>
                  <span
                    className={`text-xs ${
                      activePlanId === plan.plan_id ? "text-[color:var(--gv-accent)]" : "text-white/40"
                    }`}
                  >
                    {activePlanId === plan.plan_id ? t("currentPlan") : plan.plan_id}
                  </span>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-white/70">
                  {plan.highlightBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openDialog(plan.plan_id)}
                    className="w-full"
                  >
                    {plan.ctaLabel}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ContactSalesDialog>
  );
}
