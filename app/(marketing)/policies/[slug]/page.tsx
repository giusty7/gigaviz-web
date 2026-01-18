import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import path from "path";
import { readFile } from "fs/promises";
import { renderMarkdown } from "@/lib/markdown";
import { getPolicyBySlug, policySlugs } from "@/lib/policies";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function resolveParams(params: Promise<{ slug: string }>) {
  return await params;
}

export async function generateStaticParams() {
  return policySlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await resolveParams(params);
  const policy = getPolicyBySlug(slug);

  if (!policy) {
    return {
      title: "Policy not found",
    };
  }

  return {
    title: policy.title,
    description: policy.description,
  };
}

export default async function PolicyDetailPage({ params }: PageProps) {
  const { slug } = await resolveParams(params);
  const policy = getPolicyBySlug(slug);

  if (!policy) {
    notFound();
  }

  const filePath = path.join(process.cwd(), "content", "policies", policy.file);
  const content = await readFile(filePath, "utf8");

  return (
    <main className="flex-1">
      <section className="border-b border-[color:var(--gv-border)]">
          <div className="container py-16 md:py-24">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
                Policy
              </p>
              <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                {policy.title}
              </h1>
              <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                {policy.description}
              </p>
              <Link
                href="/policies"
                className="text-sm font-semibold text-[color:var(--gv-accent)] hover:underline"
              >
                Back to policies
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--gv-surface)]">
          <div className="container py-12 md:py-16">
            <div className="space-y-4 rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
              {renderMarkdown(content)}
            </div>
          </div>
        </section>
    </main>
  );
}
