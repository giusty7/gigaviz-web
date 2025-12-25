import type { Metadata } from "next";
import Image from "next/image";
import LeadForm from "../../components/wa/lead-form";


export const metadata: Metadata = {
  title: "Platform WhatsApp Bisnis All-in-One | Gigaviz Services",
  description:
    "Kelola Inbox CS multi-agent, chatbot otomatis, broadcast/campaign resmi via template, dan dashboard analitik dalam satu platform.",
  alternates: { canonical: "/wa-platform" },
  openGraph: {
    title: "Platform WhatsApp Bisnis All-in-One | Gigaviz Services",
    description:
      "Inbox CS, Chatbot, Broadcast/Campaign, Template Resmi, Analitik & Laporan.",
    url: "/wa-platform",
    type: "website",
  },
};

const FEATURES = [
  {
    title: "Broadcast & Campaign",
    desc: "Kirim promo, reminder, notifikasi—terjadwal, tersegmentasi, dan terukur.",
  },
  {
    title: "Inbox CS Multi Agen",
    desc: "Kelola chat pelanggan rapi: assign agent, tag, catatan internal, quick reply.",
  },
  {
    title: "Chatbot Otomatis",
    desc: "Menu klik, auto-reply, keyword trigger, dan handover ke CS.",
  },
  {
    title: "Dashboard & Laporan",
    desc: "Pantau sent/delivered/read/failed, performa agent, dan laporan campaign.",
  },
];

const BENEFITS = [
  "Respon lebih cepat & konsisten",
  "Chat pelanggan lebih rapi (multi agent)",
  "Promosi & reminder lebih terukur",
  "Skalabel: siap jadi layanan untuk banyak klien",
];

export default function WaPlatformPage() {
  return (
    <main className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                WhatsApp Cloud API Ready
              </p>

              <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                Platform WhatsApp Bisnis <span className="text-cyan-500">All-in-One</span>
              </h1>

              <p className="mt-4 text-base text-muted-foreground md:text-lg">
                Kelola <b>Inbox CS</b>, <b>Chatbot</b>, <b>Broadcast/Campaign</b>, dan <b>Dashboard</b> dalam satu
                sistem—rapi, scalable, dan siap buat bisnis serius.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#form-minat"
                  className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-black hover:opacity-90"
                >
                  Minta Demo / Konsultasi
                </a>
                <a
                  href="#fitur"
                  className="inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-semibold hover:bg-muted"
                >
                  Lihat Fitur
                </a>
              </div>

              <div className="mt-6 grid gap-2">
                {BENEFITS.map((b) => (
                  <p key={b} className="text-sm text-muted-foreground">
                    ✅ {b}
                  </p>
                ))}
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Catatan: Pengiriman proaktif mengikuti aturan template & opt-in agar aman dan stabil.
              </p>
            </div>

            <div className="relative">
              <div className="rounded-2xl border bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10 p-6">
                <div className="flex items-center gap-3">
                  {/* taro logo ini di public/images/gv-wa-logo.png */}
                  <div className="relative h-14 w-14">
                    <Image
                      src="/images/gv-wa-logo.png"
                      alt="Gigaviz WA Logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Gigaviz Services</p>
                    <p className="text-xs text-muted-foreground">WhatsApp Business Platform</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <div className="rounded-xl border p-4">
                    <p className="text-sm font-semibold">Inbox CS</p>
                    <p className="text-xs text-muted-foreground">Assign agent • Tag • Quick reply</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="text-sm font-semibold">Campaign</p>
                    <p className="text-xs text-muted-foreground">Segmentasi • Jadwal • Laporan</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="text-sm font-semibold">Chatbot</p>
                    <p className="text-xs text-muted-foreground">Menu klik • Auto-reply • Handover</p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-black/40 p-4 text-xs text-muted-foreground">
                  <b className="text-foreground">Goal:</b> CS rapi, promosi terukur, dan notifikasi otomatis.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="fitur" className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold md:text-3xl">Fitur Utama</h2>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Dibangun untuk tim kecil sampai skala multi-klien (jasa).
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border p-6">
              <p className="text-base font-semibold">{f.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FORM */}
      <section id="form-minat" className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Minta Demo / Konsultasi</h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Isi form ini. Nanti kita mapping kebutuhan: CS, bot, campaign, notifikasi, dan integrasi.
              </p>

              <div className="mt-6 rounded-2xl border bg-background p-6">
                <p className="text-sm font-semibold">Yang biasanya orang minta:</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>• WA massal (campaign) + segmentasi pelanggan</li>
                  <li>• Inbox CS multi-agent + assignment</li>
                  <li>• Notifikasi tagihan / invoice / status</li>
                  <li>• Chatbot menu + auto-reply</li>
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border bg-background p-6">
              <LeadForm />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-2xl border bg-gradient-to-r from-cyan-500/10 via-transparent to-emerald-500/10 p-8">
          <h3 className="text-2xl font-bold">Siap bikin WhatsApp bisnis lebih profesional?</h3>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Kita mulai dari landing + form + auto follow up. Lalu naik ke dashboard inbox & campaign.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="#form-minat"
              className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-black hover:opacity-90"
            >
              Gas Konsultasi
            </a>
            <a
              href="/products"
              className="inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-semibold hover:bg-muted"
            >
              Lihat Produk Lain
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
