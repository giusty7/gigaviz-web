"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { planMeta, type PlanId } from "@/lib/entitlements";

type AdminPanelProps = {
  workspaceId: string;
  enableBillingTestMode: boolean;
};

export default function AdminPanel({
  workspaceId,
  enableBillingTestMode,
}: AdminPanelProps) {
  const t = useTranslations("appUI.adminPanel");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [planId, setPlanId] = useState<PlanId>("free_locked");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitCredit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const res = await fetch("/api/tokens/credit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        amount: Number(amount),
        note,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setMessage(payload?.error || t("failedCredit"));
      return;
    }

    setAmount("");
    setNote("");
    setMessage(t("tokenCredited"));
  }

  async function submitPlanChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const res = await fetch("/api/subscriptions/test-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        plan_id: planId,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setMessage(payload?.error || t("failedPlan"));
      return;
    }

    setMessage(t("planUpdated"));
  }

  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6">
      <h2 className="text-lg font-semibold text-amber-50">{t("title")}</h2>
      <p className="text-sm text-amber-100/70 mt-2">
        {t("description")}
      </p>

      <form onSubmit={submitCredit} className="mt-4 grid gap-3 md:grid-cols-3">
        <input
          type="number"
          min="1"
          className="rounded-xl border border-amber-400/30 bg-black/30 px-3 py-2 text-sm text-amber-50"
          placeholder={t("amountPlaceholder")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input
          type="text"
          className="rounded-xl border border-amber-400/30 bg-black/30 px-3 py-2 text-sm text-amber-50"
          placeholder={t("notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          disabled={loading}
          className="rounded-xl border border-amber-400/40 bg-amber-500/20 px-3 py-2 text-sm font-semibold text-amber-50 hover:bg-amber-500/30 disabled:opacity-60"
        >
          {t("creditTokens")}
        </button>
      </form>

      {enableBillingTestMode && (
        <form
          onSubmit={submitPlanChange}
          className="mt-5 grid gap-3 md:grid-cols-3"
        >
          <select
            className="rounded-xl border border-amber-400/30 bg-black/30 px-3 py-2 text-sm text-amber-50"
            value={planId}
            title="Select plan"
            onChange={(e) => setPlanId(e.target.value as PlanId)}
          >
            {planMeta.map((plan) => (
              <option key={plan.plan_id} value={plan.plan_id}>
                {plan.name}
              </option>
            ))}
          </select>
          <div className="md:col-span-2">
            <button
              disabled={loading}
              className="w-full rounded-xl border border-amber-400/40 bg-amber-500/20 px-3 py-2 text-sm font-semibold text-amber-50 hover:bg-amber-500/30 disabled:opacity-60"
            >
              {t("simulatePlan")}
            </button>
          </div>
        </form>
      )}

      {message && <p className="mt-3 text-xs text-amber-100">{message}</p>}
    </div>
  );
}
