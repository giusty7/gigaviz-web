"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2, Loader2, Archive } from "lucide-react";

type Props = {
  itemId: string;
  hasPurchases: boolean;
};

export function MarketplaceItemActions({ itemId, hasPurchases }: Props) {
  const router = useRouter();
  const t = useTranslations("marketplace");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/marketplace/items/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      router.refresh();
    } catch {
      // Error handled silently - refresh to show current state
      router.refresh();
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {t("dashboardDeleteConfirm")}
        </span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex h-8 items-center gap-1 rounded-md bg-destructive px-2 text-xs text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-accent disabled:opacity-50"
        >
          {t("cancel")}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex h-9 items-center gap-1 rounded-md border bg-background px-3 text-sm text-destructive hover:bg-destructive/10"
      title={hasPurchases ? "Will archive (has purchases)" : "Delete item"}
    >
      {hasPurchases ? (
        <Archive className="h-4 w-4" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      {t("dashboardDeleteItem")}
    </button>
  );
}
