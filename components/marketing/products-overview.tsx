"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { products, productCategories } from "@/lib/products";
import { MarketingIcon } from "@/components/marketing/icons";
import { StatusBadge } from "@/components/marketing/status-badge";

const categoryOptions = ["Semua", ...productCategories];

export default function ProductsOverview() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchCategory =
        category === "Semua" || product.categories.includes(category);
      if (!matchCategory) return false;
      if (!q) return true;

      const haystack = [
        product.name,
        product.short,
        product.description,
        ...product.categories,
        ...product.features,
        ...product.whoFor,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [category, query]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <label
            htmlFor="product-search"
            className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]"
          >
            Cari modul
          </label>
          <input
            id="product-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari modul, fitur, atau kata kunci"
            className="mt-2 w-full rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-4 py-3 text-sm text-[color:var(--gv-text)] placeholder:text-[color:var(--gv-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--gv-accent)]"
          />
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
            Filter kategori
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {categoryOptions.map((option) => {
              const active = option === category;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                  aria-pressed={active}
                  className={
                    active
                      ? "rounded-full border border-[color:var(--gv-accent)] bg-[color:var(--gv-accent-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--gv-accent)]"
                      : "rounded-full border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-3 py-1.5 text-xs text-[color:var(--gv-muted)]"
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <Link
            key={product.slug}
            href={`/products/${product.slug}`}
            className="group flex h-full flex-col justify-between rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 transition hover:-translate-y-1 hover:border-[color:var(--gv-accent)]"
          >
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-bg)]">
                <MarketingIcon
                  name={product.icon}
                  className="h-6 w-6 text-[color:var(--gv-accent)]"
                />
              </div>
              <StatusBadge status={product.status} />
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="text-lg font-semibold text-[color:var(--gv-text)]">
                {product.name}
              </h3>
              <p className="text-sm text-[color:var(--gv-muted)]">
                {product.short}
              </p>
            </div>
            <div className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gv-accent)]">
              Lihat detail
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] p-6 text-sm text-[color:var(--gv-muted)]">
          Tidak ada modul yang cocok dengan filter ini. Coba kata kunci lain.
        </div>
      ) : null}
    </div>
  );
}
