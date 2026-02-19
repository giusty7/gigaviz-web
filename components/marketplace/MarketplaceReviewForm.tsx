"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Star, Loader2 } from "lucide-react";

type Props = {
  itemId: string;
  purchaseId: string;
};

export function MarketplaceReviewForm({ itemId, purchaseId }: Props) {
  const router = useRouter();
  const t = useTranslations("marketplace");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/marketplace/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: itemId,
          purchase_id: purchaseId,
          rating,
          review_text: reviewText || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-md bg-green-500/10 p-4 text-center text-sm text-green-600">
        {t("reviewSuccess")}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-6">
      <h3 className="font-semibold">{t("reviewTitle")}</h3>

      {error && (
        <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Star Rating */}
      <div>
        <label className="mb-2 block text-sm font-medium">{t("reviewRating")} *</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`h-6 w-6 ${
                  star <= (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Review Text */}
      <div>
        <label htmlFor="review-text" className="mb-2 block text-sm font-medium">
          {t("reviewText")}
        </label>
        <textarea
          id="review-text"
          rows={3}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder={t("reviewTextPlaceholder")}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("reviewSubmitting")}
          </>
        ) : (
          t("reviewSubmit")
        )}
      </button>
    </form>
  );
}
