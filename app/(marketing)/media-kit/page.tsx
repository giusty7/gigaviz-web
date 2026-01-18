import type { Metadata } from "next";
import Link from "next/link";
import MediaKitCopyBlock from "@/components/marketing/media-kit-copy";
import MediaKitLogos from "@/components/marketing/media-kit-logos";

export const metadata: Metadata = {
  title: "Gigaviz Media Kit",
  description:
    "Official Gigaviz brand assets for press, partners, and community.",
  alternates: {
    canonical: "/media-kit",
  },
  openGraph: {
    title: "Gigaviz Media Kit",
    description:
      "Official Gigaviz brand assets for press, partners, and community.",
    url: "/media-kit",
  },
};

const brandSummary = [
  "Gigaviz is a SaaS ecosystem for Create -> Automate -> Monetize -> Manage.",
  "Indonesia-first and global-ready, with a modular approach.",
  "Security-first: access control, audit, and workspace separation.",
  "Operated by PT Gigaviz Digital Indonesia.",
];

const logoAssets = [
  {
    label: "Logo Horizontal",
    file: "/brand/gigaviz-logo-horizontal.png",
    width: 420,
    height: 120,
    previewClass: "bg-[color:var(--gv-bg)]",
  },
  {
    label: "Logo Stacked",
    file: "/brand/gigaviz-logo-stacked.png",
    width: 260,
    height: 260,
    previewClass: "bg-[color:var(--gv-bg)]",
  },
  {
    label: "Mark",
    file: "/brand/gigaviz-mark.png",
    width: 160,
    height: 160,
    previewClass: "bg-[color:var(--gv-bg)]",
  },
  {
    label: "Mark Gold",
    file: "/brand/gigaviz-mark-gold.png",
    width: 160,
    height: 160,
    previewClass: "bg-[#0b1220]",
  },
  {
    label: "Mark Dark",
    file: "/brand/gigaviz-mark-dark.png",
    width: 160,
    height: 160,
    previewClass: "bg-white",
  },
  {
    label: "Mark Mono",
    file: "/brand/gigaviz-mark-mono.png",
    width: 160,
    height: 160,
    previewClass: "bg-[color:var(--gv-bg)]",
  },
];

const palette = [
  { name: "Gold", hex: "#d6b25e" },
  { name: "Navy", hex: "#0b1220" },
  { name: "Magenta", hex: "#e24ba8" },
  { name: "Cream", hex: "#f7f1e7" },
];

const copyBlocks = [
  {
    title: "Short Description (50 words)",
    text:
      "Gigaviz is a SaaS ecosystem that unifies create, automate, monetize, and manage modules in one account. " +
      "Built Indonesia-first and ready to scale globally, Gigaviz helps teams work fast without losing control, security, " +
      "and visibility through consistent workspaces, billing, and audits for operations, creative, and customer comms " +
      "so daily decisions stay measurable.",
  },
  {
    title: "Standard Description (150 words)",
    text:
      "Gigaviz is a digital product ecosystem that helps businesses, creators, and ops teams run end-to-end processes: " +
      "Create, Automate, Monetize, and Manage. With one account and workspace, teams can activate modules like Core OS " +
      "for identity and billing, Meta Hub for WhatsApp Cloud API, Helper for AI, Office for documents, Studio for creative assets, " +
      "plus Marketplace, Arena, Apps, Pay, and Community as growth layers. The Indonesia-first approach covers local needs, while " +
      "modular architecture keeps it ready for global scale. Security is foundational: role-based access control, audit logs, and " +
      "workspace-level data separation. Gigaviz is operated by PT Gigaviz Digital Indonesia and focuses on measurable outcomes—helping teams move fast without losing control. " +
      "We provide transparent release statuses (Live, Beta, Coming Soon) so partners can plan implementations. Each module is built to interconnect, enabling data, access, and costs to be monitored from a single dashboard with concise reports and periodic audits.",
  },
  {
    title: "Tagline",
    text: "Integrated digital ecosystem for Create -> Automate -> Monetize -> Manage.",
  },
];

export default function MediaKitPage() {
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
                Media Kit
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                Gigaviz Media Kit
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                Official brand assets for press, partners, and community.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <a
                  href="#logos"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[color:var(--gv-cream)]"
                >
                  Download Logos
                </a>
                <a
                  href="#copy"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Copy Descriptions
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Brand summary
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Gigaviz at a glance
                </h2>
                <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                  {brandSummary.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  North Star
                </div>
                <div className="mt-2 text-lg font-semibold text-[color:var(--gv-text)]">
                  Create -&gt; Automate -&gt; Monetize -&gt; Manage
                </div>
                <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                  Four pillars that guide module design and user experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="logos" className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Logo assets
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Download official logos
                </h2>
              </div>
              <div className="text-xs text-[color:var(--gv-muted)]">
                Files are available in PNG format.
              </div>
            </div>

            <MediaKitLogos items={logoAssets} />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Usage guide
                </div>
                <ul className="mt-4 space-y-2">
                  <li className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>Keep clear space at least the height of the letter G.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>Do not rotate, stretch, or add effects.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>Use the mark for small sizes, horizontal logo for headers.</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Background variations
                </div>
                <p className="mt-4">
                  Use the gold variant on dark backgrounds and the dark variant on light backgrounds.
                  If unsure, use the horizontal logo on a navy background with high contrast.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Official colors
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Gigaviz color palette
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  The colors below follow the current Gigaviz design tokens in the UI.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {palette.map((color) => (
                  <div
                    key={color.name}
                    className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4"
                  >
                    <div
                      className="h-16 w-full rounded-2xl border border-[color:var(--gv-border)]"
                      style={{ backgroundColor: color.hex }}
                      aria-label={`${color.name} ${color.hex}`}
                    />
                    <div className="mt-3 text-sm font-semibold text-[color:var(--gv-text)]">
                      {color.name}
                    </div>
                    <div className="text-xs text-[color:var(--gv-muted)]">
                      {color.hex}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Typography
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Gigaviz primary fonts
                </h2>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <p>
                  Primary font: Plus Jakarta Sans (text and UI).
                </p>
                <p className="mt-2">
                  Display font: Playfair Display (headlines).
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="copy" className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Official copy
              </p>
              <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                Ready-to-use descriptions and tagline
              </h2>
              <p className="text-sm text-[color:var(--gv-muted)]">
                Use these descriptions for press releases, partner decks, or product catalogs.
              </p>
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {copyBlocks.map((item) => (
                <MediaKitCopyBlock key={item.title} title={item.title} text={item.text} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-start">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Founder & contact
                </p>
                <h2 className="text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
                  Official Gigaviz contact
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Founder: Giusty Adhyarachmat Eryan (Giusty).
                </p>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Business entity: PT Gigaviz Digital Indonesia.
                </p>
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <p>
                  For media questions, please reach us via the Contact page.
                </p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center rounded-2xl border border-[color:var(--gv-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Open Contact
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 md:flex md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                  Ready to introduce Gigaviz?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Download assets, use the official copy, and explore our modules.
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
                  href="/products"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  View Products
                </Link>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}
