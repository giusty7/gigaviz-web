import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gigaviz Product Status",
  description:
    "View the readiness status of Gigaviz v1.1 modules: Live, Beta, and Planned.",
  alternates: {
    canonical: "/status",
  },
  openGraph: {
    title: "Gigaviz Product Status",
    description:
      "View the readiness status of Gigaviz v1.1 modules: Live, Beta, and Planned.",
    url: "/status",
  },
};

type StatusType = "available" | "beta" | "coming";

const statusLabel: Record<StatusType, string> = {
  available: "Live",
  beta: "Beta",
  coming: "Planned",
};

const statusStyles: Record<StatusType, string> = {
  available:
    "border-[color:var(--gv-accent)] bg-[color:var(--gv-accent-soft)] text-[color:var(--gv-accent)]",
  beta: "border-[color:var(--gv-accent-2)] bg-[color:var(--gv-magenta-soft)] text-[color:var(--gv-accent-2)]",
  coming:
    "border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] text-[color:var(--gv-muted)]",
};

const statusItems = [
  {
    slug: "platform",
    name: "Gigaviz Platform (Core OS)",
    status: "available",
    available: [
      "Account & SSO with unified identity.",
      "Workspace for organization and billing.",
      "Core RBAC and audit logs.",
    ],
    next: ["Audit export and compliance reports (planned)."],
  },
  {
    slug: "meta-hub",
    name: "Gigaviz Meta Hub",
    status: "beta",
    available: [
      "WhatsApp Cloud API integration.",
      "Template manager & webhook receiver.",
      "Shared inbox + campaign scheduler.",
    ],
    next: ["Campaign segmentation and advanced analytics (planned)."],
  },
  {
    slug: "helper",
    name: "Gigaviz Helper",
    status: "beta",
    available: [
      "AI chat for quick ideas.",
      "Copy generator and reply drafts.",
      "Summarizer for messages and documents.",
    ],
    next: ["Controlled browsing and workspace prompt sharing (planned)."],
  },
  {
    slug: "office",
    name: "Gigaviz Office",
    status: "beta",
    available: [
      "Template library for docs and sheets.",
      "Formula assistant and document generator.",
      "Simple dashboard builder.",
    ],
    next: ["Phased import/export connectors (planned)."],
  },
  {
    slug: "studio",
    name: "Gigaviz Studio",
    status: "beta",
    available: [
      "Generative images and asset library.",
      "Prompt library and versioning.",
      "Submodules: Graph (Gallery) & Tracks (Music).",
    ],
    next: ["Generative video & music, watermark controls (planned)."],
    submodules: [
      { label: "Graph (Gallery)", href: "/products/studio#graph" },
      { label: "Tracks (Music)", href: "/products/studio#tracks" },
    ],
  },
  {
    slug: "marketplace",
    name: "Gigaviz Marketplace",
    status: "beta",
    available: [
      "Digital product listings ready to sell.",
      "Personal and commercial licenses.",
      "Discovery and basic bundling.",
    ],
    next: ["User reviews and creator payouts (planned)."],
  },
  {
    slug: "arena",
    name: "Gigaviz Arena",
    status: "beta",
    available: [
      "Arena Play for curated games.",
      "Commission requests for custom games.",
      "Integration with Apps for ticketing.",
    ],
    next: ["Mini-game builder and gamification (planned)."],
  },
  {
    slug: "apps",
    name: "Gigaviz Apps",
    status: "beta",
    available: [
      "App catalog and app requests.",
      "Ticketing and status tracking.",
      "Mini roadmap per workspace.",
    ],
    next: ["Attachment collaboration and SLA tiers (planned)."],
  },
  {
    slug: "pay",
    name: "Gigaviz Pay",
    status: "beta",
    available: [
      "Invoice generator and payment links.",
      "Subscription billing for plans.",
      "Transaction history and exports.",
    ],
    next: ["Refunds and marketplace payouts (planned)."],
  },
  {
    slug: "community",
    name: "Gigaviz Community",
    status: "coming",
    available: [
      "Community roadmap and initial curation.",
      "Moderation guidelines and safety rules.",
    ],
    next: ["Forum & Q&A, feedback board, showcase (planned)."],
  },
] as const;

function StatusPill({ status }: { status: StatusType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${statusStyles[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}

export default function StatusPage() {
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b border-[color:var(--gv-border)]">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(214,178,94,0.22),_transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(226,75,168,0.18),_transparent_60%)]" />
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(247,241,231,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(247,241,231,0.08) 1px, transparent 1px)",
                backgroundSize: "64px 64px",
              }}
            />
          </div>

          <div className="container relative z-10 py-16 md:py-24">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Product Status
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                Gigaviz Product Status
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                This page shows the readiness status of Gigaviz v1.1 modules — from Live, Beta, to Planned.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-10">
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status="available" />
              <StatusPill status="beta" />
              <StatusPill status="coming" />
              <span className="text-xs text-[color:var(--gv-muted)]">
                Live = production-ready, Beta = limited access, Planned = not yet available.
              </span>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="space-y-6">
              {statusItems.map((item) => (
                <div
                  key={item.slug}
                  className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6"
                >
                  <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                    <div className="space-y-3">
                      <StatusPill status={item.status} />
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-[color:var(--gv-text)]">
                          {item.name}
                        </h2>
                        <Link
                          href={`/products/${item.slug}`}
                          className="inline-flex items-center rounded-2xl border border-[color:var(--gv-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                        >
                          View Details
                        </Link>
                      </div>

                      {"submodules" in item ? (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--gv-muted)]">
                          <span className="rounded-full border border-[color:var(--gv-border)] px-2.5 py-1">
                            Submodule
                          </span>
                          {item.submodules.map((submodule) => (
                            <Link
                              key={submodule.href}
                              href={submodule.href}
                              className="rounded-full border border-[color:var(--gv-border)] px-2.5 py-1 text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                            >
                              {submodule.label}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface-soft)] p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                          Available Now
                        </div>
                        <ul className="mt-3 space-y-2 text-sm text-[color:var(--gv-muted)]">
                          {item.available.map((point) => (
                            <li key={point} className="flex gap-2">
                              <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)] p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                          Coming Next
                        </div>
                        <ul className="mt-3 space-y-2 text-sm text-[color:var(--gv-muted)]">
                          {item.next.map((point) => (
                            <li key={point} className="flex gap-2">
                              <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent-2)]" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-10">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-5 text-sm text-[color:var(--gv-muted)]">
                Module access depends on your subscription plan.
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-5 text-sm text-[color:var(--gv-muted)]">
                Token costs (AI/WhatsApp API) are calculated separately based on usage.
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 md:flex md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                  Ready to join the Gigaviz ecosystem?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Choose a plan that fits your needs and follow our development roadmap.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Get Started
                </Link>
                <Link
                  href="/roadmap"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  View Roadmap
                </Link>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}
