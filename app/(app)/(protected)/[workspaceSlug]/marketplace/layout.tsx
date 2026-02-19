import { getTranslations } from "next-intl/server";
import { Store, ShoppingCart, TrendingUp, LayoutDashboard } from "lucide-react";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
};

export default async function MarketplaceLayout({ children, params }: Props) {
  const { workspaceSlug } = await params;
  const t = await getTranslations("marketplace");

  const navItems = [
    {
      href: `/${workspaceSlug}/marketplace`,
      label: t("navMarketplace"),
      icon: Store,
    },
    {
      href: `/${workspaceSlug}/marketplace/sell`,
      label: t("navSell"),
      icon: TrendingUp,
    },
    {
      href: `/${workspaceSlug}/marketplace/purchases`,
      label: t("navPurchases"),
      icon: ShoppingCart,
    },
    {
      href: `/${workspaceSlug}/marketplace/dashboard`,
      label: t("navDashboard"),
      icon: LayoutDashboard,
    },
  ];

  return (
    <div>
      {/* Sub-Navigation Bar */}
      <div className="border-b bg-background">
        <div className="container max-w-7xl">
          <nav className="flex gap-1 overflow-x-auto py-2" aria-label="Marketplace navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
