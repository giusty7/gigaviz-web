import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const revalidate = 3600;

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

const statusStyles: Record<StatusType, string> = {
  available:
    "border-[color:var(--gv-accent)] bg-[color:var(--gv-accent-soft)] text-[color:var(--gv-accent)]",
  beta: "border-[color:var(--gv-accent-2)] bg-[color:var(--gv-magenta-soft)] text-[color:var(--gv-accent-2)]",
  coming:
    "border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] text-[color:var(--gv-muted)]",
};

function StatusPill({ status, label }: { status: StatusType; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${statusStyles[status]}`}
    >
      {label}
    </span>
  );
}

export default async function StatusPage() {
  const t = await getTranslations("status");
  const tc = await getTranslations("common");

  const statusLabel: Record<StatusType, string> = {
    available: t("legendLive"),
    beta: t("legendBeta"),
    coming: t("legendPlanned"),
  };

  const statusItems = [
    {
      slug: "platform",
      name: t("platformName"),
      status: "available" as StatusType,
      available: [t("platformA1"), t("platformA2"), t("platformA3")],
      next: [t("platformN1")],
    },
    {
      slug: "meta-hub",
      name: t("metaHubName"),
      status: "beta" as StatusType,
      available: [t("metaHubA1"), t("metaHubA2"), t("metaHubA3")],
      next: [t("metaHubN1")],
    },
    {
      slug: "helper",
      name: t("helperName"),
      status: "beta" as StatusType,
      available: [t("helperA1"), t("helperA2"), t("helperA3")],
      next: [t("helperN1")],
    },
    {
      slug: "office",
      name: t("officeName"),
      status: "beta" as StatusType,
      available: [t("officeA1"), t("officeA2"), t("officeA3")],
      next: [t("officeN1")],
    },
    {
      slug: "studio",
      name: t("studioName"),
      status: "beta" as StatusType,
      available: [t("studioA1"), t("studioA2"), t("studioA3")],
      next: [t("studioN1")],
      submodules: [
        { label: "Graph (Gallery)", href: "/products/studio#graph" },
        { label: "Tracks (Music)", href: "/products/studio#tracks" },
      ],
    },
    {
      slug: "marketplace",
      name: t("marketplaceName"),
      status: "beta" as StatusType,
      available: [t("marketplaceA1"), t("marketplaceA2"), t("marketplaceA3")],
      next: [t("marketplaceN1")],
    },
    {
      slug: "apps",
      name: t("appsName"),
      status: "beta" as StatusType,
      available: [t("appsA1"), t("appsA2"), t("appsA3")],
      next: [t("appsN1")],
    },
  ];

  return (
    <>
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
                {t("badge")}
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                {t("title")}
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-10">
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status="available" label={statusLabel.available} />
              <StatusPill status="beta" label={statusLabel.beta} />
              <StatusPill status="coming" label={statusLabel.coming} />
              <span className="text-xs text-[color:var(--gv-muted)]">
                {t("legendDesc")}
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
                      <StatusPill status={item.status} label={statusLabel[item.status]} />
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-[color:var(--gv-text)]">
                          {item.name}
                        </h2>
                        <Link
                          href={`/products/${item.slug}`}
                          className="inline-flex items-center rounded-2xl border border-[color:var(--gv-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                        >
                          {tc("viewDetails")}
                        </Link>
                      </div>

                      {"submodules" in item && item.submodules ? (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--gv-muted)]">
                          <span className="rounded-full border border-[color:var(--gv-border)] px-2.5 py-1">
                            {tc("submodule")}
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
                          {tc("availableNow")}
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
                          {tc("comingNext")}
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
                {t("moduleAccessNote")}
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-5 text-sm text-[color:var(--gv-muted)]">
                {t("tokenCostNote")}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 md:flex md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                  {t("ctaTitle")}
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  {t("ctaDesc")}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  {tc("getStarted")}
                </Link>
                <Link
                  href="/roadmap"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  {tc("viewRoadmap")}
                </Link>
              </div>
            </div>
          </div>
        </section>
    </>
  );
}
