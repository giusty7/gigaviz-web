import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { formatBlogDate, getPublishedPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog Gigaviz",
  description:
    "Cerita, pembaruan, dan insight tentang ekosistem Gigaviz dari tim dan komunitas.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog Gigaviz",
    description:
      "Cerita, pembaruan, dan insight tentang ekosistem Gigaviz dari tim dan komunitas.",
    url: "/blog",
  },
};

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="gv-marketing flex min-h-screen flex-col bg-[color:var(--gv-bg)] font-gv">
      <Navbar variant="marketing" />

      <main className="flex-1">
        <section className="border-b border-[color:var(--gv-border)]">
          <div className="container py-16 md:py-24">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Blog Gigaviz
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                Cerita dan pembaruan ekosistem
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                Catatan perjalanan, insight produk, dan cerita di balik Gigaviz.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            {posts.length === 0 ? (
              <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
                Belum ada postingan. Nantikan cerita terbaru dari tim Gigaviz.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
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
      </main>

      <Footer />
    </div>
  );
}
