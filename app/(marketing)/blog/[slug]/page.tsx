import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatBlogDate, getPostBySlug, getPublishedPosts } from "@/lib/blog";
import { renderMarkdown } from "@/lib/markdown";
import { SCHEMA_CONTEXT, blogPostingSchema, faqPageSchema, type FAQItem } from "@/lib/seo/schema";

export const revalidate = 3600;

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
  "whatsapp-business-api-vs-whatsapp-web": [
    {
      question: "What is the difference between WhatsApp Web and WhatsApp Cloud API?",
      answer:
        "WhatsApp Web is a free consumer tool for personal and basic business use with one device. Cloud API is Meta's official business platform that supports multi-agent inboxes, message templates, automation, analytics, and CRM integration.",
    },
    {
      question: "Do I need a separate phone number for Cloud API?",
      answer:
        "Yes, Cloud API uses a dedicated business phone number registered through Meta's Business Platform. Your personal WhatsApp number remains separate.",
    },
    {
      question: "How much does WhatsApp Cloud API cost?",
      answer:
        "Cloud API access is free (hosted by Meta). You pay per conversation: marketing, utility, and authentication categories have different rates. Service conversations (customer-initiated) include 1,000 free per month.",
    },
    {
      question: "Can Gigaviz help me migrate from WhatsApp Web to Cloud API?",
      answer:
        "Yes. Gigaviz Meta Hub handles the entire setup — connect your WhatsApp Business Platform account, import contacts, create templates, and start receiving messages in your unified inbox.",
    },
  ],
  "whatsapp-message-templates-complete-guide": [
    {
      question: "How long does template approval take?",
      answer:
        "Template approval typically takes 24-48 hours. Utility and authentication templates tend to be approved faster than marketing templates.",
    },
    {
      question: "Why was my template rejected?",
      answer:
        "Common reasons include wrong category classification, unclear variable usage, prohibited content, missing opt-out language for marketing templates, or duplicate template names.",
    },
    {
      question: "Can I edit an approved template?",
      answer:
        "You cannot edit an approved template directly. You need to create a new version with a different name and submit it for approval. The old template remains active until you delete it.",
    },
    {
      question: "How many templates can I have?",
      answer:
        "Meta allows up to 250 message templates per WhatsApp Business Account. Gigaviz Meta Hub's Template Manager helps you organize and track all of them.",
    },
  ],
  "building-ai-powered-whatsapp-crm": [
    {
      question: "What is RAG and how does it work in Gigaviz Helper?",
      answer:
        "RAG (Retrieval-Augmented Generation) gives AI access to your specific business knowledge without retraining. Your documents are converted to vector embeddings and searched semantically when generating reply suggestions.",
    },
    {
      question: "Does AI have access to other workspaces' data?",
      answer:
        "No. Every knowledge base query is scoped by workspace_id. AI can only access documents uploaded to your specific workspace.",
    },
    {
      question: "Can I control what the AI suggests?",
      answer:
        "Yes. Agents can accept, edit, or reject AI suggestions. The AI assists but never sends messages automatically — humans always have the final say.",
    },
  ],
  "how-to-build-whatsapp-customer-support-team": [
    {
      question: "How many agents do I need for my WhatsApp support team?",
      answer:
        "A general rule: divide your daily conversation volume by the number of conversations an agent can handle per hour (typically 8-12). For 100 daily conversations, you'd need 2-3 agents during business hours.",
    },
    {
      question: "What SLA targets should I set?",
      answer:
        "For WhatsApp support, aim for under 5 minutes first response time during business hours, under 24 hours resolution time, and over 90% customer satisfaction. Adjust based on your industry and customer expectations.",
    },
    {
      question: "Can I use Gigaviz for multiple WhatsApp numbers?",
      answer:
        "Yes. Gigaviz Meta Hub supports multiple WhatsApp Business Platform connections per workspace, each with its own phone number, templates, and inbox.",
    },
  ],
  "why-multi-tenant-saas-architecture-matters": [
    {
      question: "What is multi-tenant architecture?",
      answer:
        "Multi-tenant architecture means multiple customers (tenants) share the same application infrastructure while their data remains completely isolated. Each workspace in Gigaviz is a separate tenant.",
    },
    {
      question: "Is my data safe in a multi-tenant system?",
      answer:
        "Yes. Gigaviz enforces data isolation at three layers: database Row Level Security (RLS), application-level workspace scoping, and entitlement gating. Even platform administrators cannot access your data without explicit authorization.",
    },
    {
      question: "Why not use a single-tenant (dedicated) setup?",
      answer:
        "Single-tenant setups are more expensive to operate and scale. Multi-tenant architecture provides the same security guarantees at lower cost, with faster updates and shared infrastructure improvements.",
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

      <>
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
      </>
    </>
  );
}
