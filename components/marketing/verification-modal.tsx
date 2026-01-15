"use client";

import Image from "next/image";
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
  const [imageError, setImageError] = useState(false);

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

        {/* Proof Image */}
        <div className="mt-2 overflow-hidden rounded-xl border border-gigaviz-border bg-gigaviz-surface">
          {imageError ? (
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
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gigaviz-cream">Verification proof pending</p>
                <p className="text-xs text-gigaviz-muted">
                  Add your sanitized screenshot to:
                  <br />
                  <code className="mt-1 inline-block rounded bg-gigaviz-surface px-1.5 py-0.5 text-[10px]">
                    /public/trust/technology-provider-proof-1.png
                  </code>
                </p>
              </div>
            </div>
          ) : (
            <div className="relative aspect-video">
              <Image
                src="/trust/technology-provider-proof-1.png"
                alt="Technology Provider verification proof showing onboarding completion status"
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                priority
              />
            </div>
          )}
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
