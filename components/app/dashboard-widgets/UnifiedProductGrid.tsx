"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { ProductKPICard } from "./ProductKPICard";
import type { ProductWidget } from "@/lib/dashboard/overview";

type UnifiedProductGridProps = {
  products: ProductWidget[];
};

export function UnifiedProductGrid({ products }: UnifiedProductGridProps) {
  const t = useTranslations("dashboardWidgetsUI");
  const [showExtended, setShowExtended] = useState(true);

  const p0Products = products.filter((p) => p.priority === 0);
  const p1Products = products.filter((p) => p.priority === 1);
  const p2Products = products.filter((p) => p.priority === 2);

  const extendedProducts = [...p1Products, ...p2Products];
  const hasExtended = extendedProducts.length > 0;

  return (
    <div className="space-y-5">
      {/* Core products — always visible, single grid */}
      {p0Products.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {p0Products.map((widget, index) => (
            <ProductKPICard key={widget.productKey} widget={widget} index={index} />
          ))}
        </div>
      )}

      {/* Extended — simple toggle */}
      {hasExtended && (
        <div>
          <button
            onClick={() => setShowExtended(!showExtended)}
            className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-[#f5f5dc]/30 transition hover:text-[#f5f5dc]/50"
          >
            {t("moreProducts", { count: extendedProducts.length })}
            <ChevronDown className={`h-3 w-3 transition-transform ${showExtended ? "rotate-180" : ""}`} />
          </button>
          {showExtended && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {extendedProducts.map((widget, index) => (
                <ProductKPICard key={widget.productKey} widget={widget} index={index} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
