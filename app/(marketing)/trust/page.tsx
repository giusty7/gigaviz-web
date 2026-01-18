import type { Metadata } from "next";
import Link from "next/link";
import { EvidenceCarousel } from "@/components/marketing/evidence-carousel";

export const metadata: Metadata = {
  title: "Verification & Trust — Gigaviz Ecosystem",
  description:
    "Proof of Technology Provider status for WhatsApp Business Platform, onboarding completed (2/2 steps), built on the official Cloud API.",
};

const bullets = [
  "Technology Provider — WhatsApp Business Platform (Cloud API).",
  "Onboarding completed (2/2 steps); designed for policy-aligned messaging flows.",
  "Built on the official Cloud API; does not imply Meta endorsement or partnership.",
];

export default function TrustPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border bg-gradient-to-b from-background via-card/30 to-background">
          <div className="container space-y-10 py-16 md:py-20">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Trust</p>
              <h1 className="text-4xl font-gvDisplay font-semibold md:text-5xl">Verification &amp; Trust</h1>
              <p className="text-sm text-muted-foreground md:text-base">
                Technology Provider — WhatsApp Business Platform. Onboarding completed (2/2 steps).
                Built on the official WhatsApp Business Platform (Cloud API) for policy-aligned messaging workflows.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</div>
                <h2 className="mt-3 text-xl font-semibold">Technology Provider — WhatsApp Business Platform</h2>
                <p className="mt-2 text-sm text-muted-foreground">Onboarding completed (2/2 steps).</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
                  Built on the official Cloud API
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  This status powers the Meta Hub module; it does not replace the Gigaviz Ecosystem brand or imply Meta endorsement.
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Links</div>
                <div className="mt-3 space-y-3 text-sm">
                  <Link href="/" className="font-semibold text-gigaviz-gold hover:underline">
                    Back to homepage
                  </Link>
                  <Link href="/integrations" className="block font-semibold text-gigaviz-gold hover:underline">
                    View integrations
                  </Link>
                  <Link href="/get-started" className="block font-semibold text-gigaviz-gold hover:underline">
                    Request onboarding
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Evidence</div>
                <div className="mt-4">
                  <EvidenceCarousel aspectClass="aspect-video" showThumbnails />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Sanitized screenshots from Meta Business Suite verifying Technology Provider status.
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">What this means</div>
                <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
                  {bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span aria-hidden className="mt-[6px] h-1.5 w-1.5 rounded-full bg-gigaviz-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-background p-6">
              <h3 className="text-base font-semibold">Trademark disclaimer</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                WhatsApp, Meta, and other trademarks are the property of their respective owners. The Technology Provider status and integrations do not imply affiliation, partnership, or endorsement by Meta.
              </p>
            </div>
          </div>
        </section>
    </main>
  );
}
