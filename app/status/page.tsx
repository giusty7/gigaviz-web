import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Status Produk Gigaviz",
  description:
    "Lihat status kesiapan modul Gigaviz v1.1: Live, Beta, hingga Segera (planned).",
  alternates: {
    canonical: "/status",
  },
  openGraph: {
    title: "Status Produk Gigaviz",
    description:
      "Lihat status kesiapan modul Gigaviz v1.1: Live, Beta, hingga Segera (planned).",
    url: "/status",
  },
};

type StatusType = "available" | "beta" | "coming";

const statusLabel: Record<StatusType, string> = {
  available: "Live",
  beta: "Beta",
  coming: "Segera",
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
      "Account & SSO dengan identitas tunggal.",
      "Workspace untuk organisasi dan billing.",
      "RBAC dan audit log inti.",
    ],
    next: ["Ekspor audit dan laporan compliance (planned)."],
  },
  {
    slug: "meta-hub",
    name: "Gigaviz Meta Hub",
    status: "beta",
    available: [
      "Integrasi WhatsApp Cloud API.",
      "Template manager & webhook receiver.",
      "Inbox bersama + scheduler kampanye.",
    ],
    next: ["Segmentasi kampanye dan analitik lanjutan (planned)."],
  },
  {
    slug: "helper",
    name: "Gigaviz Helper",
    status: "beta",
    available: [
      "Chat AI untuk ide cepat.",
      "Copy generator dan draft balasan.",
      "Summarizer untuk ringkasan pesan/dokumen.",
    ],
    next: ["Browsing terkontrol dan prompt sharing workspace (planned)."],
  },
  {
    slug: "office",
    name: "Gigaviz Office",
    status: "beta",
    available: [
      "Template library untuk doc/sheet.",
      "Formula assistant dan generator dokumen.",
      "Dashboard builder sederhana.",
    ],
    next: ["Import/export connector bertahap (planned)."],
  },
  {
    slug: "studio",
    name: "Gigaviz Studio",
    status: "beta",
    available: [
      "Generative image + asset library.",
      "Prompt library dan versioning.",
      "Submodule Graph (Gallery) & Tracks (Music).",
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
      "Listing produk digital siap jual.",
      "Lisensi personal & komersial.",
      "Discovery dan bundle dasar.",
    ],
    next: ["Review pengguna dan payout creator (planned)."],
  },
  {
    slug: "arena",
    name: "Gigaviz Arena",
    status: "beta",
    available: [
      "Arena Play untuk game kurasi.",
      "Commission request untuk game custom.",
      "Koneksi ke Apps untuk tiket.",
    ],
    next: ["Mini-game builder dan gamification (planned)."],
  },
  {
    slug: "apps",
    name: "Gigaviz Apps",
    status: "beta",
    available: [
      "App catalog dan request aplikasi.",
      "Ticketing & status tracking.",
      "Mini roadmap per workspace.",
    ],
    next: ["Kolaborasi lampiran & SLA tier (planned)."],
  },
  {
    slug: "pay",
    name: "Gigaviz Pay",
    status: "beta",
    available: [
      "Invoice generator dan payment links.",
      "Subscription billing untuk paket.",
      "Riwayat transaksi & ekspor.",
    ],
    next: ["Refunds dan marketplace payouts (planned)."],
  },
  {
    slug: "community",
    name: "Gigaviz Community",
    status: "coming",
    available: [
      "Roadmap komunitas dan kurasi awal.",
      "Pedoman moderasi & safety rules.",
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
    <div className="gv-marketing flex min-h-screen flex-col bg-[color:var(--gv-bg)] font-gv">
      <Navbar variant="marketing" />

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
                Status Produk
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                Status Produk Gigaviz
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                Halaman ini menunjukkan kesiapan modul Gigaviz v1.1 - dari Live, Beta, hingga Segera.
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
                Live = siap digunakan, Beta = aktif terbatas, Segera = planned.
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
                          Lihat detail
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
                          Tersedia sekarang
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
                          Berikutnya
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
                Akses modul mengikuti paket langganan.
              </div>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-5 text-sm text-[color:var(--gv-muted)]">
                Biaya token (AI/WhatsApp API) dihitung terpisah sesuai pemakaian.
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 md:flex md:items-center md:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                  Siap masuk ke ekosistem Gigaviz?
                </h2>
                <p className="text-sm text-[color:var(--gv-muted)]">
                  Mulai dari paket yang sesuai lalu pantau roadmap pengembangan.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Mulai
                </Link>
                <Link
                  href="/roadmap"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Lihat Roadmap
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
