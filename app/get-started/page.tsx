import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import GetStartedForm from "@/components/marketing/get-started-form";

export const metadata: Metadata = {
  title: "Get Started",
  description: "Mulai onboarding Gigaviz dan pilih paket yang sesuai kebutuhan tim Anda.",
};

export default function GetStartedPage() {
  return (
    <div className="gv-marketing flex min-h-screen flex-col bg-[color:var(--gv-bg)] font-gv">
      <Navbar variant="marketing" />

      <main className="flex-1">
        <section className="border-b border-[color:var(--gv-border)]">
          <div className="container grid gap-10 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-24">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Get Started
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                Mulai onboarding Gigaviz
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                Isi data singkat, pilih paket, dan tim kami akan menghubungi Anda untuk setup awal.
              </p>
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-5 text-sm text-[color:var(--gv-muted)]">
                <p className="font-semibold text-[color:var(--gv-text)]">Catatan</p>
                <ul className="mt-3 space-y-2">
                  <li>- Onboarding dilakukan dalam 1 sampai 2 hari kerja.</li>
                  <li>- Paket dan modul dapat disesuaikan setelah konsultasi.</li>
                  <li>- Token usage untuk AI dihitung berdasarkan penggunaan.</li>
                </ul>
                <Link
                  href="/pricing"
                  className="mt-4 inline-flex text-sm font-semibold text-[color:var(--gv-accent)] hover:underline"
                >
                  Lihat detail pricing
                </Link>
              </div>
            </div>

            <GetStartedForm />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
