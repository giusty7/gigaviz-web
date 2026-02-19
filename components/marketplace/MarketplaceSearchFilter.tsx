"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Filter, X } from "lucide-react";

const CATEGORIES = [
  "template",
  "prompt_pack",
  "asset",
  "mini_app",
  "integration",
] as const;

const SORT_OPTIONS = [
  "popular",
  "newest",
  "price_asc",
  "price_desc",
  "rating",
] as const;

type Props = {
  workspaceSlug: string;
};

export function MarketplaceSearchFilter({ workspaceSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("marketplace");

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const currentCategory = searchParams.get("category") ?? "";
  const currentSort = searchParams.get("sort") ?? "popular";
  const currentFreeOnly = searchParams.get("free") === "1";

  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`/${workspaceSlug}/marketplace?${params.toString()}`);
    },
    [router, searchParams, workspaceSlug]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: search });
  };

  const clearFilters = () => {
    setSearch("");
    router.push(`/${workspaceSlug}/marketplace`);
  };

  const hasActiveFilters = !!currentCategory || !!searchParams.get("q") || currentFreeOnly;

  return (
    <div className="mb-8 space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-md border bg-background py-2 pl-10 pr-4 text-sm"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />

        {/* Category Filters */}
        <button
          onClick={() => updateFilters({ category: "" })}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !currentCategory
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("filterAll")}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => updateFilters({ category: cat })}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              currentCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t(`category${cat.charAt(0).toUpperCase()}${cat.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase())}` as "categoryTemplate")}
          </button>
        ))}

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Free Only Toggle */}
        <button
          onClick={() => updateFilters({ free: currentFreeOnly ? "" : "1" })}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            currentFreeOnly
              ? "bg-green-600 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("filterFreeOnly")}
        </button>

        {/* Sort Dropdown */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("sortBy")}:</span>
          <select
            value={currentSort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="rounded-md border bg-background px-2 py-1 text-xs"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {t(`sort${opt.charAt(0).toUpperCase()}${opt.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase())}` as "sortPopular")}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-2 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/20"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
