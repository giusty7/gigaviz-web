"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ProductKPICard } from "./ProductKPICard";
import type { ProductWidget } from "@/lib/dashboard/overview";

type UnifiedProductGridProps = {
  products: ProductWidget[];
};

export function UnifiedProductGrid({ products }: UnifiedProductGridProps) {
  const [showP1, setShowP1] = useState(true);
  const [showP2, setShowP2] = useState(false);

  // Group products by priority
  const p0Products = products.filter((p) => p.priority === 0);
  const p1Products = products.filter((p) => p.priority === 1);
  const p2Products = products.filter((p) => p.priority === 2);

  const hasP1 = p1Products.length > 0;
  const hasP2 = p2Products.length > 0;

  return (
    <div className="space-y-6">
      {/* P0: Core Products (Always Visible) */}
      {p0Products.length > 0 && (
        <section>
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]/80 font-semibold">
              Core Platform
            </p>
            <h2 className="text-xl font-bold text-[#f5f5dc]">Active Products</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {p0Products.map((widget, index) => (
              <ProductKPICard key={widget.productKey} widget={widget} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* P1: Conditional Products (Collapsible) */}
      {hasP1 && (
        <section>
          <button
            onClick={() => setShowP1(!showP1)}
            className="group mb-4 flex w-full items-center justify-between rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/40 px-4 py-3 transition hover:border-[#d4af37]/40 hover:bg-[#0a1229]/60"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]/80 font-semibold">
                Active Modules
              </p>
              <h2 className="text-lg font-bold text-[#f5f5dc]">
                Extended Features ({p1Products.length})
              </h2>
            </div>
            {showP1 ? (
              <ChevronUp className="h-5 w-5 text-[#d4af37] transition group-hover:scale-110" />
            ) : (
              <ChevronDown className="h-5 w-5 text-[#d4af37] transition group-hover:scale-110" />
            )}
          </button>
          {showP1 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {p1Products.map((widget, index) => (
                <ProductKPICard key={widget.productKey} widget={widget} index={index} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* P2: Coming Soon Products (Collapsed by Default) */}
      {hasP2 && (
        <section>
          <button
            onClick={() => setShowP2(!showP2)}
            className="group mb-4 flex w-full items-center justify-between rounded-xl border border-slate-500/20 bg-[#0a1229]/40 px-4 py-3 transition hover:border-slate-500/40 hover:bg-[#0a1229]/60"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400/80 font-semibold">
                Product Roadmap
              </p>
              <h2 className="text-lg font-bold text-[#f5f5dc]">
                Coming Soon ({p2Products.length})
              </h2>
            </div>
            {showP2 ? (
              <ChevronUp className="h-5 w-5 text-slate-400 transition group-hover:scale-110" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400 transition group-hover:scale-110" />
            )}
          </button>
          {showP2 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {p2Products.map((widget, index) => (
                <ProductKPICard key={widget.productKey} widget={widget} index={index} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
