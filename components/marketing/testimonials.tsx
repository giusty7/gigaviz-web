"use client";

import { useTranslations } from "next-intl";
import { testimonials, type Testimonial } from "@/lib/data/testimonials";

/* ------------------------------------------------------------------ */
/*  Star icon                                                          */
/* ------------------------------------------------------------------ */
function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${filled ? "text-amber-400" : "text-[color:var(--gv-border)]"}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Single card                                                        */
/* ------------------------------------------------------------------ */
function TestimonialCard({ item }: { item: Testimonial }) {
  const t = useTranslations("testimonials");

  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
      {/* Stars */}
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} filled={i < item.rating} />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-[color:var(--gv-text)]">
        &ldquo;{t(`${item.key}.quote`)}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="mt-6 flex items-center gap-3">
        <div
          className={`grid h-10 w-10 place-items-center rounded-full ring-2 ${item.accent} bg-[color:var(--gv-surface-soft)] text-xs font-bold text-[color:var(--gv-text)]`}
        >
          {item.initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-[color:var(--gv-text)]">
            {t(`${item.key}.name`)}
          </p>
          <p className="text-xs text-[color:var(--gv-muted)]">
            {t(`${item.key}.role`)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */
export function TestimonialsSection() {
  const t = useTranslations("testimonials");

  return (
    <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
      <div className="container py-16 md:py-24">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-400">
            {t("badge")}
          </span>
          <h2 className="mt-4 text-2xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-3xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-sm text-[color:var(--gv-muted)] md:text-base">
            {t("subtitle")}
          </p>
        </div>

        {/* Cards */}
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item) => (
            <TestimonialCard key={item.key} item={item} />
          ))}
        </div>

        {/* Beta note */}
        <p className="mt-8 text-center text-xs text-[color:var(--gv-muted)]">
          {t("beta_note")}
        </p>
      </div>
    </section>
  );
}
