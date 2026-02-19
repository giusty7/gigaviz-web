"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShoppingCart, Loader2, Coins } from "lucide-react";

type Props = {
  itemId: string;
  itemTitle: string;
  priceCents: number;
};

export function MarketplacePurchaseButton({
  itemId,
  itemTitle,
  priceCents,
}: Props) {
  const router = useRouter();
  const t = useTranslations("marketplace");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const isFree = priceCents === 0;
  const priceDisplay = isFree ? t("detailFree") : `$${(priceCents / 100).toFixed(2)}`;

  const handlePurchase = async () => {
    setIsPurchasing(true);
    setError(null);

    try {
      const res = await fetch("/api/marketplace/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Purchase failed");
      }

      // Refresh to show download button
      router.refresh();
      setShowConfirm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setIsPurchasing(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="space-y-3">
        <div className="rounded-md border bg-muted p-4">
          <p className="mb-2 text-sm font-medium">{t("detailConfirmPurchase")}</p>
          <p className="text-sm text-muted-foreground">
            {itemTitle} — {priceDisplay}
          </p>
          {!isFree && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Coins className="h-3 w-3" />
              {t("detailTokenDeduction")}
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handlePurchase}
            disabled={isPurchasing}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPurchasing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("detailProcessing")}
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                {t("detailConfirmButton")}
              </>
            )}
          </button>
          <button
            onClick={() => {
              setShowConfirm(false);
              setError(null);
            }}
            disabled={isPurchasing}
            className="rounded-md border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      <ShoppingCart className="h-4 w-4" />
      {isFree ? t("detailGetFree") : t("detailBuyNow")}
    </button>
  );
}
