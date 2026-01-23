"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EVIDENCE_COUNT } from "@/components/marketing/evidence-carousel";

const BULLETS = [
  "Built on the official WhatsApp Business Platform (Cloud API)",
  "Designed for policy-aligned messaging flows",
  "No implied Meta endorsement; trademarks belong to their owners",
] as const;

interface VerificationModalProps {
  children: React.ReactNode;
}

export function VerificationModal({ children }: VerificationModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-gigaviz-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold focus-visible:ring-offset-2 focus-visible:ring-offset-gigaviz-bg"
      >
        {children}
      </button>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gigaviz-cream">
            Technology Provider — WhatsApp Business Platform
          </DialogTitle>
          <DialogDescription className="text-sm text-gigaviz-muted">
            Onboarding completed (2/2 steps)
          </DialogDescription>
        </DialogHeader>

        {/* Proof Placeholder (static to avoid hydration swaps) */}
        <div className="mt-2 overflow-hidden rounded-xl border border-gigaviz-border bg-gigaviz-surface">
          <div className="flex aspect-video flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gigaviz-gold/15">
              <svg
                className="h-6 w-6 text-gigaviz-gold"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6l2.121 2.121M12 6L9.879 8.121M12 6v12m0 0l2.121-2.121M12 18l-2.121-2.121M6 12l2.121 2.121M6 12l2.121-2.121M6 12h12m0 0l-2.121-2.121M18 12l-2.121 2.121"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gigaviz-cream">Verification screenshot available on request</p>
              <p className="text-xs text-gigaviz-muted">
                Ask our team for the sanitized proof. Verified status and evidence also live on the trust page.
              </p>
            </div>
          </div>
        </div>

        {/* View all evidence link */}
        <div className="mt-2 text-center">
          <Link
            href="/trust"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gigaviz-gold transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold"
          >
            <span>View all evidence ({EVIDENCE_COUNT})</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </Link>
        </div>

        {/* Bullet Points */}
        <ul className="mt-4 space-y-2">
          {BULLETS.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-sm text-gigaviz-muted">
              <span
                aria-hidden
                className="mt-[6px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gigaviz-gold"
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        {/* CTA Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/get-started"
            className="inline-flex items-center justify-center rounded-xl bg-gigaviz-gold px-5 py-2.5 text-sm font-semibold text-gigaviz-navy shadow-[0_4px_16px_-4px_var(--gv-gold)] transition hover:bg-gigaviz-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold focus-visible:ring-offset-2"
            onClick={() => setOpen(false)}
          >
            Request onboarding
          </Link>
          <Link
            href="/trust"
            className="inline-flex items-center justify-center rounded-xl border border-gigaviz-cream/20 bg-gigaviz-surface/60 px-5 py-2.5 text-sm font-semibold text-gigaviz-cream backdrop-blur transition hover:border-gigaviz-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold focus-visible:ring-offset-2"
            onClick={() => setOpen(false)}
          >
            Open trust page
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
