import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  Package, DollarSign, TrendingUp, Clock,
  ArrowLeft, Edit, Plus, Eye,
} from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { FeatureGate } from "@/components/gates/feature-gate";
import { getSellerDashboard } from "@/lib/marketplace";
import Link from "next/link";
import { MarketplaceItemActions } from "@/components/marketplace/MarketplaceItemActions";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function MarketplaceDashboardPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const entitlement = await requireEntitlement(ctx.currentWorkspace.id, "marketplace");
  const t = await getTranslations("marketplace");

  const dashboard = await getSellerDashboard(ctx.currentWorkspace.id);

  const statusColors: Record<string, string> = {
    draft: "bg-gray-500/10 text-gray-600",
    under_review: "bg-yellow-500/10 text-yellow-600",
    approved: "bg-green-500/10 text-green-600",
    rejected: "bg-red-500/10 text-red-600",
    archived: "bg-gray-500/10 text-gray-500",
  };

  return (
    <FeatureGate allowed={entitlement.allowed}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container max-w-6xl py-8">
          <Link
            href={`/${workspaceSlug}/marketplace`}
            className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToMarketplace")}
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold">{t("dashboardTitle")}</h1>
            <p className="mt-2 text-muted-foreground">{t("dashboardDesc")}</p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{dashboard.total_items}</p>
                  <p className="text-sm text-muted-foreground">{t("dashboardItems")}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{dashboard.total_sales}</p>
                  <p className="text-sm text-muted-foreground">{t("dashboardSales")}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold">
                    ${(dashboard.total_earnings_cents / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("dashboardEarnings")}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{dashboard.pending_review}</p>
                  <p className="text-sm text-muted-foreground">{t("dashboardPending")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("dashboardItems")}</h2>
            <Link
              href={`/${workspaceSlug}/marketplace/sell`}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              {t("startSelling")}
            </Link>
          </div>

          {/* Items List */}
          {dashboard.items.length === 0 ? (
            <div className="rounded-lg border bg-card p-12 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="mb-2 text-lg font-semibold">{t("dashboardNoItems")}</h3>
              <p className="mb-4 text-sm text-muted-foreground">{t("dashboardNoItemsDesc")}</p>
              <Link
                href={`/${workspaceSlug}/marketplace/sell`}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                {t("startSelling")}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[item.status] ?? ""}`}>
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>${(item.price_usd / 100).toFixed(2)}</span>
                      <span>{item.purchases_count} {t("dashboardSales").toLowerCase()}</span>
                      <span>{item.views_count} views</span>
                      <span>
                        {t("dashboardCreatedAt")}: {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === "approved" && (
                      <Link
                        href={`/${workspaceSlug}/marketplace/items/${item.slug}`}
                        className="inline-flex h-9 items-center gap-1 rounded-md border bg-background px-3 text-sm hover:bg-accent"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    )}
                    <Link
                      href={`/${workspaceSlug}/marketplace/items/${item.slug}/edit`}
                      className="inline-flex h-9 items-center gap-1 rounded-md border bg-background px-3 text-sm hover:bg-accent"
                    >
                      <Edit className="h-4 w-4" />
                      {t("dashboardEditItem")}
                    </Link>
                    <MarketplaceItemActions
                      itemId={item.id}
                      hasPurchases={item.purchases_count > 0}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FeatureGate>
  );
}
