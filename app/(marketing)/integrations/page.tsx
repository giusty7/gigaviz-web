import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Integrations — Gigaviz Ecosystem",
  description:
    "Integrations that work with Gigaviz Ecosystem: WhatsApp Business Platform (Cloud API), AI providers, Supabase, email, and deployment stack.",
};

const categories = [
  {
    title: "Messaging",
    items: ["WhatsApp Business Platform (Cloud API)"],
    desc: "Technology Provider onboarding, template management, inbox, delivery status, and policy-aligned workflows.",
  },
  {
    title: "AI",
    items: ["OpenAI", "Google Gemini", "Anthropic Claude", "Ollama"],
    desc: "Choose your model mix for assistance, copy, retrieval, and orchestration.",
  },
  {
    title: "Backend & Email",
    items: ["Supabase", "Resend"],
    desc: "Data, auth, storage, and transactional messaging that match workspace isolation.",
  },
  {
    title: "Deployment & Stack",
    items: ["Vercel", "Next.js", "GitHub", "Turbopack"],
    desc: "Built and shipped with modern tooling; continuous delivery for the ecosystem.",
  },
  {
    title: "Domain",
    items: ["Squarespace Domains (Registrar)"],
    desc: "Domain management used alongside the stack; no endorsement implied.",
  },
];

export default function IntegrationsPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border bg-gradient-to-b from-background via-card/30 to-background">
          <div className="container space-y-10 py-16 md:py-20">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Integrations</p>
              <h1 className="text-4xl font-gvDisplay font-semibold md:text-5xl">Integrations catalog</h1>
              <p className="text-sm text-muted-foreground md:text-base">
                Built on the official WhatsApp Business Platform (Cloud API) as a Technology Provider. Works with
                your AI stack, data, email, and deployment tooling. Integrations do not imply affiliation or endorsement.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Featured</div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-border bg-background px-3 py-1 font-semibold text-foreground">
                  Technology Provider — WhatsApp Business Platform
                </span>
                <span className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground">
                  Onboarding completed (2/2 steps)
                </span>
                <Link href="/trust" className="text-sm font-semibold text-gigaviz-gold hover:underline">
                  View verification →
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div key={category.title} className="rounded-3xl border border-border bg-card p-6">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{category.title}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {category.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{category.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/get-started"
                className="inline-flex items-center justify-center rounded-2xl bg-gigaviz-gold px-5 py-3 font-semibold text-gigaviz-navy shadow-[0_10px_40px_-15px_rgba(214,178,94,0.8)] hover:bg-gigaviz-gold/90"
              >
                Request onboarding
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl border border-border px-5 py-3 font-semibold hover:border-gigaviz-gold"
              >
                Talk to us
              </Link>
            </div>

            <div className="rounded-3xl border border-border bg-background p-6">
              <h2 className="text-base font-semibold">Trademark disclaimer</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                WhatsApp, Meta, and other trademarks are the property of their respective owners. Integrations do not imply affiliation or endorsement.
              </p>
            </div>
          </div>
        </section>
    </main>
  );
}
