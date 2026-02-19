import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Store, ShoppingCart, TrendingUp, Star, Package, Download } from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { FeatureGate } from "@/components/gates/feature-gate";
import { getMarketplaceItems, getMarketplaceStats } from "@/lib/marketplace";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { MarketplaceSearchFilter } from "@/components/marketplace/MarketplaceSearchFilter";

type MarketplaceItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  subcategory: string | null;
  price_usd: number;
  currency: string;
  thumbnail_url: string | null;
  tags: string[];
  compatible_with: string[];
  rating_average: number;
  reviews_count: number;
  purchases_count: number;
  creator_workspace_id: string;
};

type Props = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ q?: string; category?: string; sort?: string; free?: string }>;
};

export const dynamic = "force-dynamic";

export default async function MarketplacePage({ params, searchParams }: Props) {
  const { workspaceSlug } = await params;
  const filters = await searchParams;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const entitlement = await requireEntitlement(ctx.currentWorkspace.id, "marketplace");

  const t = await getTranslations("marketplace");

  // Fetch items with filters from lib/marketplace
  const marketplaceItems = await getMarketplaceItems({
    category: filters.category,
    search: filters.q,
    sortBy: (filters.sort as "popular" | "newest" | "price_asc" | "price_desc" | "rating") || "popular",
    freeOnly: filters.free === "1",
  }) as MarketplaceItem[];

  // Fetch marketplace stats
  const stats = await getMarketplaceStats();

  // Group by category
  const categories = Array.from(new Set(marketplaceItems.map((i) => i.category)));

  return (
    <FeatureGate allowed={entitlement.allowed}>
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl py-8">
          <PageHeader
            title={t("title")}
            description={t("description")}
            badge={
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
                <Store className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            }
            actions={
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/${workspaceSlug}/marketplace/sell`}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <TrendingUp className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t("startSelling")}
                </Link>
                <Link
                  href={`/${workspaceSlug}/marketplace/purchases`}
                  className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium hover:bg-accent"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t("myPurchases")}
                </Link>
              </div>
            }
          />
        </div>
      </div>

      <div className="container max-w-7xl py-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_items}</p>
                <p className="text-sm text-muted-foreground">{t("itemsListed")}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_creators}</p>
                <p className="text-sm text-muted-foreground">{t("activeCreators")}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <Download className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_purchases}</p>
                <p className="text-sm text-muted-foreground">{t("totalSales")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <MarketplaceSearchFilter workspaceSlug={workspaceSlug} />

        {/* Items by Category */}
        {categories.map((category) => {
          const categoryItems = marketplaceItems.filter((i) => i.category === category);
          const categoryLabel = category
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

          return (
            <div key={category} className="mb-12">
              <h2 className="mb-4 text-2xl font-bold">{categoryLabel}s</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {categoryItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/${workspaceSlug}/marketplace/items/${item.slug}`}
                    className="group rounded-lg border bg-card p-6 transition-all hover:shadow-lg"
                  >
                    {/* Thumbnail placeholder */}
                    <div className="mb-4 flex h-40 items-center justify-center rounded-md bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                      <Store className="h-12 w-12 text-muted-foreground/40" />
                    </div>

                    <h3 className="mb-2 font-semibold group-hover:text-primary">
                      {item.title}
                    </h3>
                    <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>

                    {/* Tags */}
                    <div className="mb-4 flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Stats and Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{item.rating_average.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          <span>{item.purchases_count}</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold">
                        ${(item.price_usd / 100).toFixed(2)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {marketplaceItems.length === 0 && (filters.q || filters.category) && (
          <div className="py-12 text-center">
            <Store className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="mb-2 text-lg font-semibold">{t("noResults")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("noResultsDesc")}
            </p>
          </div>
        )}

        {marketplaceItems.length === 0 && !filters.q && !filters.category && (
          <div className="py-12 text-center">
            <Store className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="mb-2 text-lg font-semibold">{t("noItemsYet")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("noItemsDesc")}
            </p>
            <Link
              href={`/${workspaceSlug}/marketplace/sell`}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <TrendingUp className="h-4 w-4" />
              {t("startSelling")}
            </Link>
          </div>
        )}
      </div>
    </div>
    </FeatureGate>
  );
}
