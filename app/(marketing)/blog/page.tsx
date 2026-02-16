import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { formatBlogDate, getPublishedPosts } from "@/lib/blog";
import { getTranslations } from "next-intl/server";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Gigaviz Blog",
  description:
    "Stories, updates, and insights about the Gigaviz ecosystem from our team and community.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Gigaviz Blog",
    description:
      "Stories, updates, and insights about the Gigaviz ecosystem from our team and community.",
    url: "/blog",
  },
};

/** Featured/pinned posts that appear at the top (newest first) */
const FEATURED_POSTS = [
  {
    slug: "imperium-era",
    date: "2026-01-16",
    title: "Part 4: The Dawn of an Imperium — 7 Pillars of Digital Sovereignty",
    description:
      "From a technical struggle to a digital powerhouse. Discover how Gigaviz evolved into a 7-product ecosystem, officially verified by Meta to redefine digital infrastructure.",
    tags: ["IMPERIUM", "8 PRODUCTS", "META VERIFIED", "ECOSYSTEM", "VISION"],
    isNew: true,
  },
];

export default async function BlogIndexPage() {
  const t = await getTranslations("blog");
  const tc = await getTranslations("common");
  const posts = await getPublishedPosts();

  return (
    <>
      <section className="border-b border-[color:var(--gv-border)]">
          <div className="container py-16 md:py-24">
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
          <div className="container py-12 md:py-16">
            {posts.length === 0 && FEATURED_POSTS.length === 0 ? (
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                {t("noPosts")}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Featured Posts (with special styling) */}
                {FEATURED_POSTS.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border-2 border-[#d4af37]/50 bg-gradient-to-br from-[#0a1229]/80 to-[#050a18]/90 p-6 shadow-lg shadow-[#d4af37]/10 transition hover:-translate-y-1 hover:border-[#d4af37] hover:shadow-[#d4af37]/25"
                  >
                    {/* Glow effect */}
                    <div className="pointer-events-none absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-[#d4af37]/20 via-transparent to-[#e11d48]/10 opacity-60" />
                    
                    <div className="relative space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                          {formatBlogDate(post.date)}
                        </div>
                        {post.isNew && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#d4af37] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#050a18]">
                            <Sparkles className="h-3 w-3" />
                            {tc("newRelease")}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-semibold text-[#f5f5dc] group-hover:text-[#d4af37] transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-[#f5f5dc]/70">
                        {post.description}
                      </p>
                    </div>
                    {post.tags.length > 0 ? (
                      <div className="relative mt-4 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4af37]/80">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-2.5 py-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </Link>
                ))}

                {/* Regular Posts */}
                {posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group flex h-full flex-col justify-between rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 transition hover:-translate-y-1 hover:border-[color:var(--gv-accent)]"
                  >
                    <div className="space-y-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                        {formatBlogDate(post.date)}
                      </div>
                      <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                        {post.title}
                      </h2>
                      <p className="text-sm text-[color:var(--gv-muted)]">
                        {post.description}
                      </p>
                    </div>
                    {post.tags.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)] px-2.5 py-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
    </>
  );
}
