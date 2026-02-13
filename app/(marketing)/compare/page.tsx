import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Gigaviz vs Competitors — WhatsApp Business Platform Comparison",
  description:
    "See how Gigaviz compares to Respond.io, WATI, Twilio, and Bird (MessageBird) for WhatsApp Business messaging, CRM, and automation.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Gigaviz vs Competitors — WhatsApp Business Platform Comparison",
    description:
      "Feature-by-feature comparison of leading WhatsApp Business platforms.",
    url: "/compare",
  },
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Competitor {
  slug: string;
  name: string;
  tagline: string;
  strengths: string[];
  gaps: string[];
}

const competitors: Competitor[] = [
  {
    slug: "respond-io",
    name: "Respond.io",
    tagline: "Omnichannel messaging platform",
    strengths: [
      "Established brand with broad channel support",
      "Workflow automation builder",
      "Team collaboration features",
    ],
    gaps: [
      "No built-in AI reply assistant",
      "No Conversions API (CAPI) integration",
      "USD pricing unfavorable for SEA teams",
    ],
  },
  {
    slug: "wati",
    name: "WATI",
    tagline: "WhatsApp team inbox & automation",
    strengths: [
      "Easy onboarding for small teams",
      "Template management UI",
      "Chatbot builder",
    ],
    gaps: [
      "WhatsApp-only (no Instagram or Messenger)",
      "Limited multi-workspace support",
      "No native CRM or AI insights",
    ],
  },
  {
    slug: "twilio",
    name: "Twilio",
    tagline: "Programmable messaging APIs",
    strengths: [
      "Massive scale infrastructure",
      "Flexible API-first approach",
      "Global carrier reach",
    ],
    gaps: [
      "Requires developer expertise to set up",
      "No built-in UI for inbox or CRM",
      "Pay-per-message pricing adds up fast",
    ],
  },
  {
    slug: "bird",
    name: "Bird (MessageBird)",
    tagline: "Customer communication cloud",
    strengths: [
      "Enterprise-grade infrastructure",
      "Flow builder for automation",
      "Multi-channel (SMS, WhatsApp, Email)",
    ],
    gaps: [
      "Complex setup for small businesses",
      "No integrated CRM with AI insights",
      "Enterprise pricing not suited for SMBs",
    ],
  },
];

type FeatureRow = {
  feature: string;
  gigaviz: string | boolean;
  respondio: string | boolean;
  wati: string | boolean;
  twilio: string | boolean;
  bird: string | boolean;
};

const comparisonTable: FeatureRow[] = [
  {
    feature: "WhatsApp Business API",
    gigaviz: true,
    respondio: true,
    wati: true,
    twilio: true,
    bird: true,
  },
  {
    feature: "Instagram DM",
    gigaviz: true,
    respondio: true,
    wati: false,
    twilio: false,
    bird: true,
  },
  {
    feature: "Facebook Messenger",
    gigaviz: true,
    respondio: true,
    wati: false,
    twilio: false,
    bird: true,
  },
  {
    feature: "AI Reply Assistant",
    gigaviz: true,
    respondio: false,
    wati: false,
    twilio: false,
    bird: false,
  },
  {
    feature: "Conversions API (CAPI)",
    gigaviz: true,
    respondio: false,
    wati: false,
    twilio: false,
    bird: false,
  },
  {
    feature: "Multi-Workspace / Multi-Tenant",
    gigaviz: true,
    respondio: "Limited",
    wati: false,
    twilio: "Via sub-accounts",
    bird: "Enterprise only",
  },
  {
    feature: "Built-in CRM",
    gigaviz: true,
    respondio: "Basic",
    wati: "Basic",
    twilio: false,
    bird: false,
  },
  {
    feature: "Knowledge Base (RAG)",
    gigaviz: true,
    respondio: false,
    wati: false,
    twilio: false,
    bird: false,
  },
  {
    feature: "Template Management",
    gigaviz: true,
    respondio: true,
    wati: true,
    twilio: "Via API",
    bird: true,
  },
  {
    feature: "Unified Inbox",
    gigaviz: true,
    respondio: true,
    wati: true,
    twilio: false,
    bird: true,
  },
  {
    feature: "Outbox Worker (Queue)",
    gigaviz: true,
    respondio: true,
    wati: true,
    twilio: "Manual",
    bird: true,
  },
  {
    feature: "IDR Pricing",
    gigaviz: "From Rp 0",
    respondio: "USD only",
    wati: "USD only",
    twilio: "USD only",
    bird: "USD only",
  },
  {
    feature: "Free Tier",
    gigaviz: true,
    respondio: "Trial only",
    wati: "Trial only",
    twilio: "Credits",
    bird: false,
  },
  {
    feature: "Workspace Roles & RBAC",
    gigaviz: true,
    respondio: true,
    wati: "Limited",
    twilio: "Via console",
    bird: true,
  },
  {
    feature: "Audit Trail",
    gigaviz: true,
    respondio: false,
    wati: false,
    twilio: "Via logs",
    bird: "Enterprise",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function CellValue({ value }: { value: string | boolean }) {
  if (value === true)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
        ✓
      </span>
    );
  if (value === false)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500/15 text-red-400">
        ✗
      </span>
    );
  return <span className="text-xs text-[color:var(--gv-muted)]">{value}</span>;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ComparePage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full border border-[color:var(--gv-accent)]/30 bg-[color:var(--gv-accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--gv-accent)]">
              Compare
            </span>
            <h1 className="mt-4 text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
              How Gigaviz compares
            </h1>
            <p className="mt-3 text-sm text-[color:var(--gv-muted)] md:text-base">
              Feature-by-feature comparison with leading WhatsApp Business
              platforms. We built what small and medium businesses in Indonesia
              actually need — at a price that makes sense.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
        <div className="container py-12 md:py-16">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-[color:var(--gv-border)]">
                  <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-[color:var(--gv-muted)]">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-center">
                    <span className="rounded-lg bg-[color:var(--gv-accent)]/15 px-2 py-1 text-xs font-bold text-[color:var(--gv-accent)]">
                      Gigaviz
                    </span>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[color:var(--gv-muted)]">
                    Respond.io
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[color:var(--gv-muted)]">
                    WATI
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[color:var(--gv-muted)]">
                    Twilio
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[color:var(--gv-muted)]">
                    Bird
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonTable.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-[color:var(--gv-border)]/50"
                  >
                    <td className="py-3 pr-4 font-medium text-[color:var(--gv-text)]">
                      {row.feature}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CellValue value={row.gigaviz} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CellValue value={row.respondio} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CellValue value={row.wati} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CellValue value={row.twilio} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CellValue value={row.bird} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-xs text-[color:var(--gv-muted)]">
            Comparison data sourced from public documentation as of February
            2026. Features may have changed. Contact us for the latest details.
          </p>
        </div>
      </section>

      {/* Competitor Cards */}
      <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
        <div className="container py-12 md:py-16">
          <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
            How we stack up, one by one
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {competitors.map((c) => (
              <div
                key={c.slug}
                className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[color:var(--gv-text)]">
                    Gigaviz vs {c.name}
                  </h3>
                </div>
                <p className="mt-1 text-xs text-[color:var(--gv-muted)]">
                  {c.tagline}
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--gv-muted)]">
                      Their strengths
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-[color:var(--gv-muted)]">
                      {c.strengths.map((s) => (
                        <li key={s} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Where Gigaviz wins
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-[color:var(--gv-muted)]">
                      {c.gaps.map((g) => (
                        <li key={g} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Gigaviz */}
      <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
        <div className="container py-12 md:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
              Why teams choose Gigaviz
            </h2>
            <p className="mt-3 text-sm text-[color:var(--gv-muted)]">
              The only platform that combines WhatsApp + Instagram + Messenger
              with AI-powered CRM, knowledge base, and IDR pricing — built for
              Indonesian businesses expanding globally.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "All-in-one Meta Platform",
                desc: "WhatsApp, Instagram DM, Messenger, and Conversions API in one workspace.",
              },
              {
                title: "AI-Powered Reply & CRM",
                desc: "Helper AI drafts replies using your knowledge base. Built-in contact management.",
              },
              {
                title: "IDR Pricing, Free Tier",
                desc: "Start free, scale with transparent Rupiah pricing. No USD conversion fees.",
              },
              {
                title: "Multi-Tenant Architecture",
                desc: "Agencies can manage multiple client workspaces with full isolation and audit trails.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-5"
              >
                <h3 className="text-sm font-semibold text-[color:var(--gv-text)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-[color:var(--gv-muted)]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[color:var(--gv-bg)]">
        <div className="container py-16 text-center md:py-20">
          <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
            Ready to switch?
          </h2>
          <p className="mt-3 text-sm text-[color:var(--gv-muted)]">
            Start free, migrate your WhatsApp number in minutes, and see the
            difference.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/get-started"
              className="rounded-full bg-[color:var(--gv-accent)] px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Start free trial
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-[color:var(--gv-border)] px-6 py-2.5 text-sm font-semibold text-[color:var(--gv-text)] transition hover:border-[color:var(--gv-accent)]"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
