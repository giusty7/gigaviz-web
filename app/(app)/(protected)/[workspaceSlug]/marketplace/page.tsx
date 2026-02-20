import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  Store, ShoppingCart, TrendingUp, Star, Package, Download,
  Sparkles, Crown, Zap, ArrowRight, Search, Eye, Heart,
} from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { FeatureGate } from "@/components/gates/feature-gate";
import { getMarketplaceItems, getMarketplaceStats } from "@/lib/marketplace";
import Link from "next/link";
import Image from "next/image";
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
    <div className="space-y-6">
      {/* Compact Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#0a1229]/90 via-[#0d1530] to-[#0a1229]/90 p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(147,51,234,0.08),transparent_60%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-600/20 shadow-lg shadow-purple-500/10">
              <Store className="h-5 w-5 text-purple-400" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#f5f5dc]">{t("title")}</h1>
                <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-purple-400">Beta</span>
              </div>
              <p className="text-xs text-[#f5f5dc]/40">{t("description")}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/${workspaceSlug}/marketplace/sell`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:shadow-purple-500/30"
            >
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              {t("startSelling")}
            </Link>
            <Link
              href={`/${workspaceSlug}/marketplace/purchases`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#f5f5dc]/10 bg-[#f5f5dc]/5 px-3.5 py-2 text-xs font-semibold text-[#f5f5dc]/70 transition hover:bg-[#f5f5dc]/10 hover:text-[#f5f5dc]"
            >
              <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
              {t("myPurchases")}
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row — Compact */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {[
          { icon: Package, label: t("itemsListed"), value: stats.total_items, color: "text-blue-400", bg: "from-blue-500/15 to-blue-400/5", border: "border-blue-500/15" },
          { icon: Crown, label: t("activeCreators"), value: stats.total_creators, color: "text-purple-400", bg: "from-purple-500/15 to-purple-400/5", border: "border-purple-500/15" },
          { icon: Download, label: t("totalSales"), value: stats.total_purchases, color: "text-emerald-400", bg: "from-emerald-500/15 to-emerald-400/5", border: "border-emerald-500/15" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-xl border ${stat.border} bg-gradient-to-br ${stat.bg} p-4`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-[#0a1229]/60 ${stat.color}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#f5f5dc]">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#f5f5dc]/35">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
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
          <div key={category}>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#f5f5dc]/60">{categoryLabel}s</h2>
              <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400">{categoryItems.length}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/${workspaceSlug}/marketplace/items/${item.slug}`}
                  className="group relative overflow-hidden rounded-xl border border-[#f5f5dc]/[0.06] bg-[#0a1229]/60 transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5"
                >
                  {/* Thumbnail */}
                  <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-blue-500/10">
                    {item.thumbnail_url ? (
                      <Image src={item.thumbnail_url} alt={item.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    ) : (
                      <Store className="h-10 w-10 text-purple-400/30" aria-hidden="true" />
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </div>
                    </div>
                    {/* Price badge */}
                    <div className="absolute right-2 top-2 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-bold text-[#f5f5dc] backdrop-blur-sm">
                      {item.price_usd === 0 ? (
                        <span className="text-emerald-400">Free</span>
                      ) : (
                        <span>${(item.price_usd / 100).toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-[#f5f5dc] group-hover:text-purple-300 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#f5f5dc]/40 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#f5f5dc]/[0.04] px-2 py-0.5 text-[10px] text-[#f5f5dc]/40"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer stats */}
                    <div className="mt-3 flex items-center justify-between border-t border-[#f5f5dc]/[0.04] pt-3">
                      <div className="flex items-center gap-3 text-[10px] text-[#f5f5dc]/30">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-amber-400/80">{item.rating_average.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          <span>{item.purchases_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          <span>{item.reviews_count}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-[#f5f5dc]/15 transition-colors group-hover:text-purple-400" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty states */}
      {marketplaceItems.length === 0 && (filters.q || filters.category) && (
        <div className="flex flex-col items-center rounded-2xl border border-[#f5f5dc]/[0.06] bg-[#0a1229]/40 py-16 text-center">
          <Search className="mb-3 h-10 w-10 text-purple-400/30" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-[#f5f5dc]">{t("noResults")}</h3>
          <p className="mt-1 text-xs text-[#f5f5dc]/40">{t("noResultsDesc")}</p>
        </div>
      )}

      {marketplaceItems.length === 0 && !filters.q && !filters.category && (
        <div className="flex flex-col items-center rounded-2xl border border-purple-500/10 bg-gradient-to-br from-purple-500/5 to-pink-500/5 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10">
            <Store className="h-7 w-7 text-purple-400" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-[#f5f5dc]">{t("noItemsYet")}</h3>
          <p className="mt-1 text-xs text-[#f5f5dc]/40">{t("noItemsDesc")}</p>
          <Link
            href={`/${workspaceSlug}/marketplace/sell`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:shadow-purple-500/30"
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            {t("startSelling")}
          </Link>
        </div>
      )}
    </div>
    </FeatureGate>
  );
}
