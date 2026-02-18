"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  phone: string;
  summary: string;
};

function waNormalize(phone: string) {
  const p = (phone || "").replace(/\D+/g, "");
  if (p.startsWith("0")) return "62" + p.slice(1);
  return p;
}

export function LeadActions({ phone, summary }: Props) {
  const t = useTranslations("adminUI.leadActions");
  const [msg, setMsg] = useState<string | null>(null);

  const wa = waNormalize(phone);
  const waLink = `https://wa.me/${wa}`;

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMsg(t("copied"));
      setTimeout(() => setMsg(null), 900);
    } catch {
      setMsg(t("copyFailed"));
      setTimeout(() => setMsg(null), 900);
    }
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <a
        className="rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-cyan-300"
        href={waLink}
        target="_blank"
        rel="noreferrer"
      >
        {t("chat")}
      </a>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={() => copy(wa)}
          className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] text-white/80 hover:bg-white/10"
        >
          {t("copyWA")}
        </button>
        <button
          onClick={() => copy(waLink)}
          className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] text-white/80 hover:bg-white/10"
        >
          {t("copyLink")}
        </button>
        <button
          onClick={() => copy(summary)}
          className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] text-white/80 hover:bg-white/10"
        >
          {t("copySummary")}
        </button>
      </div>

      {msg ? <div className="text-[11px] text-white/50">{msg}</div> : null}
    </div>
  );
}
