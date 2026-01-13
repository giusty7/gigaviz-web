import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";
import { getProductBySlug, productStatusLabel, products } from "@/lib/products";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function resolveParams(params: Promise<{ slug: string }>) {
  return await params;
}

export async function generateStaticParams() {
  const excluded = new Set([
    "platform",
    "meta-hub",
    "helper",
    "office",
    "studio",
    "marketplace",
    "arena",
    "apps",
    "pay",
    "community",
  ]);
  return products
    .filter((product) => !excluded.has(product.slug))
    .map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await resolveParams(params);
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product not found",
    };
  }

  return {
    title: product.name,
    description: product.short,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await resolveParams(params);
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = product.related
    .map((relatedSlug) => products.find((item) => item.slug === relatedSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="gv-marketing flex min-h-screen flex-col bg-[color:var(--gv-bg)] font-gv">
      <Navbar variant="marketing" />

      <main className="flex-1">
        <section className="border-b border-[color:var(--gv-border)]">
          <div className="container grid gap-8 py-16 md:grid-cols-[1.2fr_0.8fr] md:items-center md:py-24">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)]">
                  <MarketingIcon
                    name={product.icon}
                    className="h-6 w-6 text-[color:var(--gv-accent)]"
                  />
                </div>
                <StatusBadge status={product.status} />
              </div>
              <div className="space-y-3">
                <h1 className="text-balance text-3xl font-gvDisplay font-semibold text-[color:var(--gv-text)] md:text-4xl">
                  {product.name}
                </h1>
                <p className="text-sm text-[color:var(--gv-muted)] md:text-base">
                  {product.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1 text-xs text-[color:var(--gv-muted)]"
                  >
                    {category}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)]"
                >
                  Start with this module
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)] hover:border-[color:var(--gv-accent)]"
                >
                  Back to products
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface-soft)] p-6">
              <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                Module summary
              </h2>
              <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
                {product.short}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                {product.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-4 text-xs text-[color:var(--gv-muted)]">
                Status modul:{" "}
                <span className="font-semibold">
                  {productStatusLabel[product.status]}
                </span>
                .
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--gv-border)] bg-[color:var(--gv-surface)]">
          <div className="container grid gap-6 py-12 md:grid-cols-2 md:py-16">
            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
              <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                Key features
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                {product.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6">
              <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                Best for
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-[color:var(--gv-muted)]">
                {product.whoFor.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--gv-accent-2)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-[color:var(--gv-bg)]">
          <div className="container py-12 md:py-16">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-[color:var(--gv-text)]">
                Related modules
              </h2>
              <Link
                href="/products"
                className="text-sm font-semibold text-[color:var(--gv-accent)] hover:underline"
              >
                All products
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/products/${item.slug}`}
                  className="flex flex-col justify-between rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
                      <MarketingIcon
                        name={item.icon}
                        className="h-5 w-5 text-[color:var(--gv-accent)]"
                      />
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-semibold text-[color:var(--gv-text)]">
                      {item.name}
                    </div>
                    <p className="mt-2 text-xs text-[color:var(--gv-muted)]">
                      {item.short}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
