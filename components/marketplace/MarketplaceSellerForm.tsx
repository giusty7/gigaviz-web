"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  userId: string;
};

export function MarketplaceSellerForm({ workspaceId, workspaceSlug, userId }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: "template" | "prompt_pack" | "asset" | "mini_app" | "integration";
    subcategory: string;
    price_usd: string;
    tags: string;
    compatible_with: string;
    license_type: "single_use" | "multi_use" | "unlimited";
  }>({
    title: "",
    description: "",
    category: "template",
    subcategory: "",
    price_usd: "0",
    tags: "",
    compatible_with: "",
    license_type: "single_use",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/marketplace/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          user_id: userId,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory || null,
          price_usd: Math.round(parseFloat(formData.price_usd) * 100), // Convert to cents
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
          compatible_with: formData.compatible_with.split(",").map((t) => t.trim()).filter(Boolean),
          license_type: formData.license_type,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      router.push(`/${workspaceSlug}/marketplace`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-medium">
          Product Title *
        </label>
        <input
          id="title"
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="WhatsApp Welcome Message Template Pack"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium">
          Description *
        </label>
        <textarea
          id="description"
          required
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Describe your product, what's included, and how it helps customers..."
        />
      </div>

      {/* Category */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="category" className="mb-2 block text-sm font-medium">
            Category *
          </label>
          <select
            id="category"
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as "template" | "prompt_pack" | "asset" | "mini_app" | "integration" })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="template">Template</option>
            <option value="prompt_pack">Prompt Pack</option>
            <option value="asset">Asset</option>
            <option value="mini_app">Mini App</option>
            <option value="integration">Integration</option>
          </select>
        </div>

        <div>
          <label htmlFor="subcategory" className="mb-2 block text-sm font-medium">
            Subcategory
          </label>
          <input
            id="subcategory"
            type="text"
            value={formData.subcategory}
            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="e.g., whatsapp_template, ai_prompt"
          />
        </div>
      </div>

      {/* Price */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="price" className="mb-2 block text-sm font-medium">
            Price (USD) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-sm text-muted-foreground">$</span>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.price_usd}
              onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })}
              className="w-full rounded-md border bg-background py-2 pl-8 pr-3 text-sm"
              placeholder="9.99"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            85% creator earnings, 15% platform fee
          </p>
        </div>

        <div>
          <label htmlFor="license" className="mb-2 block text-sm font-medium">
            License Type *
          </label>
          <select
            id="license"
            required
            value={formData.license_type}
            onChange={(e) => setFormData({ ...formData, license_type: e.target.value as "single_use" | "multi_use" | "unlimited" })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="single_use">Single Use</option>
            <option value="multi_use">Multi Use (up to 5)</option>
            <option value="unlimited">Unlimited</option>
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="mb-2 block text-sm font-medium">
          Tags
        </label>
        <input
          id="tags"
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="whatsapp, business, templates (comma-separated)"
        />
      </div>

      {/* Compatible With */}
      <div>
        <label htmlFor="compatible" className="mb-2 block text-sm font-medium">
          Compatible With
        </label>
        <input
          id="compatible"
          type="text"
          value={formData.compatible_with}
          onChange={(e) => setFormData({ ...formData, compatible_with: e.target.value })}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="studio, helper, meta-hub (comma-separated)"
        />
      </div>

      {/* Info box */}
      <div className="rounded-md bg-muted p-4 text-sm">
        <p className="font-medium">Review Process</p>
        <p className="mt-1 text-muted-foreground">
          Your submission will be reviewed within 48 hours. You&apos;ll be notified once it&apos;s approved or if changes are needed.
        </p>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Submit for Review
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="h-10 rounded-md border bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
