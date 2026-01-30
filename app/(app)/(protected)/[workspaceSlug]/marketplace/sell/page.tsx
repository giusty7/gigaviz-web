import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { MarketplaceSellerForm } from "@/components/marketplace/MarketplaceSellerForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function MarketplaceSellPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-4xl py-8">
        <Link
          href={`/${workspaceSlug}/marketplace`}
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">List Your Product</h1>
          <p className="mt-2 text-muted-foreground">
            Sell templates, prompts, assets, or mini-apps. 15% platform fee, 85% creator earnings.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-8">
          <MarketplaceSellerForm
            workspaceId={ctx.currentWorkspace.id}
            workspaceSlug={workspaceSlug}
            userId={ctx.user.id}
          />
        </div>
      </div>
    </div>
  );
}
