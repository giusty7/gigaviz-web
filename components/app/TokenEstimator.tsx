"use client";

import { useMemo, useState } from "react";

type EstimatorMode = "messages_per_day" | "tokens_per_month";

const TOKENS_PER_MESSAGE = 350;
const COST_PER_1K_TOKENS = 0.004;

export default function TokenEstimator() {
  const [mode, setMode] = useState<EstimatorMode>("messages_per_day");
  const [inputValue, setInputValue] = useState("");

  const parsedValue = Number(inputValue) > 0 ? Number(inputValue) : 0;

  const tokensPerMonth = useMemo(() => {
    if (mode === "tokens_per_month") return parsedValue;
    return Math.round(parsedValue * 30 * TOKENS_PER_MESSAGE);
  }, [mode, parsedValue]);

  const estimatedCost = useMemo(
    () => (tokensPerMonth / 1000) * COST_PER_1K_TOKENS,
    [tokensPerMonth]
  );

  const formattedCost = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(estimatedCost),
    [estimatedCost]
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-lg font-semibold">Token Estimator</h2>
      <p className="text-sm text-white/60 mt-1">
        Estimasi sederhana untuk kebutuhan token bulanan.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-white/50">Input mode</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={mode}
              onChange={(event) =>
                setMode(event.target.value as EstimatorMode)
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="messages_per_day">Messages / day</option>
              <option value="tokens_per_month">Tokens / month</option>
            </select>
            <input
              type="number"
              min={0}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={mode === "messages_per_day" ? "50" : "50000"}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </div>
          <p className="text-xs text-white/50">
            Output estimasi, bukan angka final. Rate bisa berubah.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs text-white/50">Estimasi token / bulan</p>
          <p className="text-lg font-semibold">{tokensPerMonth.toLocaleString()}</p>
          <p className="text-xs text-white/50 mt-3">Estimasi biaya (placeholder)</p>
          <p className="text-base font-semibold">{formattedCost}</p>
        </div>
      </div>
    </section>
  );
}
