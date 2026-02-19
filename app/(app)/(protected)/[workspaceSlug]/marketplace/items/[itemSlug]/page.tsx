import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  Store, Star, Download, ShoppingCart, ArrowLeft,
  Calendar, Package, Shield, CheckCircle, Tag, User,
} from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { FeatureGate } from "@/components/gates/feature-gate";
import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { MarketplacePurchaseButton } from "@/components/marketplace/MarketplacePurchaseButton";

type Props = {
  params: Promise<{ workspaceSlug: string; itemSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function MarketplaceItemDetailPage({ params }: Props) {
  const { workspaceSlug, itemSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const entitlement = await requireEntitlement(ctx.currentWorkspace.id, "marketplace");
  const t = await getTranslations("marketplace");
  const supabase = await supabaseServer();

  // Fetch item by slug
  const { data: item, error } = await supabase
    .from("marketplace_items")
    .select("*")
    .eq("slug", itemSlug)
    .single();

  if (error || !item) {
    notFound();
  }

  // Only show approved items to non-creators
  const isCreator = item.creator_workspace_id === ctx.currentWorkspace.id;
  if (item.status !== "approved" && !isCreator) {
    notFound();
  }

  // Check if user already purchased this item
  const { data: existingPurchase } = await supabase
    .from("marketplace_purchases")
    .select("id, download_count, download_limit, license_key")
    .eq("item_id", item.id)
    .eq("buyer_workspace_id", ctx.currentWorkspace.id)
    .eq("payment_status", "completed")
    .maybeSingle();

  // Fetch reviews for this item
  const { data: reviews } = await supabase
    .from("marketplace_reviews")
    .select("*")
    .eq("item_id", item.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const hasPurchased = !!existingPurchase;
  const isFree = item.price_usd === 0;

  return (
    <FeatureGate allowed={entitlement.allowed}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Back Navigation */}
        <div className="border-b bg-background/95 backdrop-blur">
          <div className="container max-w-6xl py-4">
            <Link
              href={`/${workspaceSlug}/marketplace`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToMarketplace")}
            </Link>
          </div>
        </div>

        <div className="container max-w-6xl py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Thumbnail */}
              <div className="flex h-64 items-center justify-center rounded-lg border bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                {item.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="h-full w-full rounded-lg object-cover"
                  />
                ) : (
                  <Store className="h-16 w-16 text-muted-foreground/30" />
                )}
              </div>

              {/* Title & Meta */}
              <div>
                {!isCreator && item.status !== "approved" && (
                  <span className="mb-2 inline-block rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-600">
                    {item.status}
                  </span>
                )}
                <h1 className="text-3xl font-bold">{item.title}</h1>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    <Tag className="h-3 w-3" />
                    {item.category.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {Number(item.rating_average).toFixed(1)} ({item.reviews_count} {t("detailReviews")})
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    {item.purchases_count} {t("detailPurchases")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">{t("descriptionLabel")}</h2>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                  {item.description}
                </div>
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="rounded-lg border bg-card p-6">
                  <h2 className="mb-4 text-lg font-semibold">{t("tags")}</h2>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-3 py-1 text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Compatible With */}
              {item.compatible_with && item.compatible_with.length > 0 && (
                <div className="rounded-lg border bg-card p-6">
                  <h2 className="mb-4 text-lg font-semibold">{t("compatibleWith")}</h2>
                  <div className="flex flex-wrap gap-2">
                    {item.compatible_with.map((mod: string) => (
                      <span
                        key={mod}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-600"
                      >
                        <CheckCircle className="h-3 w-3" />
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  {t("detailReviews")} ({item.reviews_count})
                </h2>
                {reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.review_text && (
                          <p className="text-sm text-muted-foreground">{review.review_text}</p>
                        )}
                        {review.creator_response && (
                          <div className="mt-2 ml-4 rounded-md bg-muted p-3">
                            <p className="text-xs font-medium mb-1">{t("detailCreatorResponse")}</p>
                            <p className="text-sm text-muted-foreground">{review.creator_response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("detailNoReviews")}</p>
                )}
              </div>
            </div>

            {/* Sidebar (1 col) */}
            <div className="space-y-4">
              {/* Price Card */}
              <div className="rounded-lg border bg-card p-6 sticky top-4">
                <div className="mb-4 text-center">
                  {isFree ? (
                    <p className="text-3xl font-bold text-green-600">{t("detailFree")}</p>
                  ) : (
                    <p className="text-3xl font-bold">
                      ${(item.price_usd / 100).toFixed(2)}
                    </p>
                  )}
                </div>

                {isCreator ? (
                  <div className="rounded-md bg-muted p-3 text-center text-sm text-muted-foreground">
                    <User className="mx-auto mb-2 h-5 w-5" />
                    {t("detailYourItem")}
                  </div>
                ) : hasPurchased ? (
                  <div className="space-y-3">
                    <div className="rounded-md bg-green-500/10 p-3 text-center text-sm text-green-600">
                      <CheckCircle className="mx-auto mb-2 h-5 w-5" />
                      {t("detailAlreadyPurchased")}
                    </div>
                    {existingPurchase && existingPurchase.download_count < existingPurchase.download_limit && (
                      <a
                        href={`/api/marketplace/items/${item.id}/download?license=${existingPurchase.license_key}`}
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        <Download className="h-4 w-4" />
                        {t("download")} ({existingPurchase.download_count}/{existingPurchase.download_limit})
                      </a>
                    )}
                  </div>
                ) : (
                  <MarketplacePurchaseButton
                    itemId={item.id}
                    itemTitle={item.title}
                    priceCents={item.price_usd}
                  />
                )}

                {/* Item Details */}
                <div className="mt-6 space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("licenseType")}</span>
                    <span className="font-medium">
                      {item.license_type === "single_use" && t("licenseSingleUse")}
                      {item.license_type === "multi_use" && t("licenseMultiUse")}
                      {item.license_type === "unlimited" && t("licenseUnlimited")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("category")}</span>
                    <span className="font-medium">
                      {item.category === "template" && t("categoryTemplate")}
                      {item.category === "prompt_pack" && t("categoryPromptPack")}
                      {item.category === "asset" && t("categoryAsset")}
                      {item.category === "mini_app" && t("categoryMiniApp")}
                      {item.category === "integration" && t("categoryIntegration")}
                    </span>
                  </div>
                  {item.version && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("detailVersion")}</span>
                      <span className="font-medium">{item.version}</span>
                    </div>
                  )}
                  {item.file_format && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("detailFormat")}</span>
                      <span className="font-medium uppercase">{item.file_format}</span>
                    </div>
                  )}
                </div>

                {/* Trust Signals */}
                <div className="mt-6 space-y-2 border-t pt-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-4 w-4 text-green-500" />
                    {t("detailSecureDownload")}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="h-4 w-4 text-blue-500" />
                    {t("detailInstantDelivery")}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShoppingCart className="h-4 w-4 text-purple-500" />
                    {t("detailPlatformGuarantee")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}
