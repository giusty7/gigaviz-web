"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { VerificationModal } from "./verification-modal";

const trustIntegrations = ["Meta", "WhatsApp Cloud API", "Supabase", "Vercel"];
const builtWithChips = ["Next.js 15", "Supabase", "PostgreSQL", "Tailwind CSS", "TypeScript"];

export function TrustConsole() {
  const t = useTranslations("marketingUI");

  return (
    <section className="border-b border-gigaviz-border/50 bg-gradient-to-b from-gigaviz-bg via-gigaviz-surface/40 to-gigaviz-bg">
      <div className="container py-8 md:py-10">
        {/* Console header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.5)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-gigaviz-gold/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-gigaviz-cream/30" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {t("trustConsole.status")}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Status Card - Dark Glass with gold accent */}
          <div className="glass-premium console-border rounded-2xl border-gigaviz-gold/25 p-5 shadow-[0_0_20px_-6px_var(--gv-gold)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-gigaviz-muted">
                Verification
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-green-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase text-green-500">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Verified
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold leading-snug text-gigaviz-cream">
              Technology Provider — WhatsApp Business Platform
            </h3>
            <p className="mt-1 text-xs text-gigaviz-muted">
              Onboarding completed (2/2 steps)
            </p>
            <div className="mt-3">
              <VerificationModal>View verification →</VerificationModal>
            </div>
          </div>

          {/* Integrations Card - Dark Glass */}
          <div className="glass-premium console-border rounded-2xl p-5">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t("trustConsole.integrations")}
            </span>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {trustIntegrations.map((item) => (
                <span
                  key={item}
                  className="inline-flex h-6 items-center rounded-full border border-gigaviz-cream/15 bg-gigaviz-surface/80 px-2.5 text-[10px] font-medium text-gigaviz-cream"
                >
                  {item}
                </span>
              ))}
            </div>
            <Link
              href="/integrations"
              className="mt-3 inline-flex items-center text-xs font-semibold text-gigaviz-gold hover:underline"
            >
              All integrations →
            </Link>
          </div>

          {/* Built with Card - Dark Glass */}
          <div className="glass-premium console-border rounded-2xl p-5">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t("trustConsole.builtWith")}
            </span>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {builtWithChips.map((item) => (
                <span
                  key={item}
                  className="inline-flex h-6 items-center rounded-full border border-gigaviz-cream/15 bg-gigaviz-surface/80 px-2.5 text-[10px] font-medium text-gigaviz-cream"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-[10px] text-muted-foreground/80">
          Logos belong to their owners. Integrations do not imply affiliation or endorsement.
        </p>
      </div>
    </section>
  );
}
