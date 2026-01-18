import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact Gigaviz",
  description:
    "Contact Gigaviz for partnerships, product questions, or support needs.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Gigaviz",
    description:
      "Contact Gigaviz for partnerships, product questions, or support needs.",
    url: "/contact",
  },
};

const contactNotes = [
  "Include your main goal and business context.",
  "Share your team size and the targets you want to reach.",
  "If you need press assets, use the official Media Kit.",
];

export default function ContactPage() {
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
                Contact
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                Contact Gigaviz
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                Send your questions or needs, and our team will respond as soon as possible.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container grid gap-8 py-12 md:grid-cols-[1.05fr_0.95fr] md:py-16">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                  Quick guide
                </p>
                <h2 className="mt-2 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)]">
                  What to include
                </h2>
                <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                  {contactNotes.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <p className="font-semibold text-[color:var(--gv-text)]">
                  Response time
                </p>
                <p className="mt-2">
                  1-2 business days for general questions, faster for priority needs.
                </p>
              </div>

              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                <p className="font-semibold text-[color:var(--gv-text)]">
                  Additional resources
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    href="/media-kit"
                    className="inline-flex items-center rounded-2xl border border-[color:var(--gv-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                  >
                    Media Kit
                  </Link>
                  <Link
                    href="/status"
                    className="inline-flex items-center rounded-2xl border border-[color:var(--gv-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                  >
                    Product Status
                  </Link>
                </div>
              </div>
            </div>

            <ContactForm />
          </div>
        </section>
    </main>
  );
}
