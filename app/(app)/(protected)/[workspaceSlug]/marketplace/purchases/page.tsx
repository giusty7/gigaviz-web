import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { Package, Download, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";

type Purchase = {
  id: string;
  item_id: string;
  price_paid_cents: number;
  currency: string;
  purchased_at: string;
  license_key: string;
  download_count: number;
  download_limit: number;
  marketplace_items: {
    title: string;
    slug: string;
    category: string;
  };
};

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function MarketplacePurchasesPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const supabase = await supabaseServer();
  const t = await getTranslations("marketplace");

  // Fetch user's purchases
  const { data: purchases } = await supabase
    .from("marketplace_purchases")
    .select(`
      *,
      marketplace_items (
        title,
        slug,
        category
      )
    `)
    .eq("buyer_workspace_id", ctx.currentWorkspace.id)
    .order("purchased_at", { ascending: false });

  const myPurchases = (purchases ?? []) as unknown as Purchase[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t("purchasesTitle")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("purchasesDesc")}
          </p>
        </div>

        {myPurchases.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="mb-2 text-lg font-semibold">{t("noPurchasesYet")}</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {t("noPurchasesDesc")}
            </p>
            <Link
              href={`/${workspaceSlug}/marketplace`}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t("browseMarketplace")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center justify-between rounded-lg border bg-card p-6"
              >
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold">
                    {purchase.marketplace_items.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(purchase.purchased_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {t("downloads", { current: purchase.download_count, limit: purchase.download_limit })}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ${(purchase.price_paid_cents / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/${workspaceSlug}/marketplace/items/${purchase.marketplace_items.slug}`}
                    className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent"
                  >
                    {t("viewDetails")}
                  </Link>
                  {purchase.download_count < purchase.download_limit && (
                    <button className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                      <Download className="mr-2 h-4 w-4" />
                      {t("download")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
