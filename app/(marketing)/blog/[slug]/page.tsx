import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatBlogDate, getPostBySlug, getPublishedPosts } from "@/lib/blog";
import { renderMarkdown } from "@/lib/markdown";
import { SCHEMA_CONTEXT, blogPostingSchema, faqPageSchema, type FAQItem } from "@/lib/seo/schema";

/**
 * FAQ data for specific blog posts that include FAQ sections.
 * The key is the slug of the post.
 */
const POST_FAQ_DATA: Record<string, FAQItem[]> = {
  "meta-technology-provider-verification": [
    {
      question: "Is Gigaviz a Meta partner?",
      answer:
        "Gigaviz does not claim Meta partnership or endorsement. We only claim what is shown in Meta's official product interfaces, and we publish sanitized proof on our trust page.",
    },
    {
      question: "Can I onboard my business through Gigaviz?",
      answer:
        "Gigaviz Meta Hub is designed to support onboarding flows on the official WhatsApp Business Platform (Cloud API). The exact availability may depend on your account requirements and region-specific constraints.",
    },
    {
      question: "Does this guarantee no bans?",
      answer:
        "No platform can guarantee outcomes if policies are violated. Gigaviz focuses on policy-aligned design to reduce operational risk and improve long-term reliability.",
    },
  ],
};

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
      title: "Article not found",
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

  // FAQ schema for posts that have FAQ sections
  const faqItems = POST_FAQ_DATA[slug];
  const faqJsonLd = faqItems
    ? {
        "@context": SCHEMA_CONTEXT,
        ...faqPageSchema(faqItems),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

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
                Back to Blog
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
