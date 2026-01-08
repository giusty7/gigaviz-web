import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { formatBlogDate, getPostBySlug, getPublishedPosts } from "@/lib/blog";
import { renderMarkdown } from "@/lib/markdown";
import { SCHEMA_CONTEXT, blogPostingSchema } from "@/lib/seo/schema";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function resolveParams(params: Promise<{ slug: string }>) {
  return await params;
}

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await resolveParams(params);
  const post = await getPostBySlug(slug);

  if (!post || !post.published) {
    return {
      title: "Artikel tidak ditemukan",
    };
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await resolveParams(params);
  const post = await getPostBySlug(slug);

  if (!post || !post.published) {
    notFound();
  }

  const blogJsonLd = {
    "@context": SCHEMA_CONTEXT,
    ...blogPostingSchema({
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date,
    }),
  };

  return (
    <div className="gv-marketing flex min-h-screen flex-col bg-[color:var(--gv-bg)] font-gv">
      <Navbar variant="marketing" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />

      <main className="flex-1">
        <section className="border-b border-[color:var(--gv-border)]">
          <div className="container py-16 md:py-24">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                {formatBlogDate(post.date)}
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                {post.title}
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                {post.description}
              </p>
              {post.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gv-muted)]">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-2.5 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <article className="max-w-3xl space-y-6 text-[color:var(--gv-text)]">
              <div className="space-y-6">{renderMarkdown(post.content)}</div>
            </article>

            <div className="mt-10">
              <Link
                href="/blog"
                className="text-sm font-semibold text-[color:var(--gv-accent)] hover:underline"
              >
                Kembali ke Blog
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
