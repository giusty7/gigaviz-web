"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

export function NewsletterCapture({ source = "homepage" }: { source?: string }) {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "success" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || isPending) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, source }),
        });

        if (res.ok) {
          setState("success");
          setEmail("");
        } else {
          setState("error");
        }
      } catch {
        setState("error");
      }
    });
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
        <p className="text-sm font-semibold text-emerald-400">
          {t("success")}
        </p>
        <p className="mt-1 text-xs text-[color:var(--gv-muted)]">
          {t("successDetail")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (state === "error") setState("idle");
        }}
        placeholder={t("placeholder")}
        className="flex-1 rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)] px-4 py-2.5 text-sm text-[color:var(--gv-text)] outline-none placeholder:text-[color:var(--gv-muted)] focus:border-[color:var(--gv-accent)]"
      />
      <button
        type="submit"
        disabled={isPending}
        className="shrink-0 rounded-full bg-[color:var(--gv-accent)] px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? t("sending") : t("cta")}
      </button>
      {state === "error" && (
        <p className="text-xs text-red-400 sm:self-center">{t("error")}</p>
      )}
    </form>
  );
}
