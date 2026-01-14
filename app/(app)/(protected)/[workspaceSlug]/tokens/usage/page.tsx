import { redirect } from "next/navigation";
import TokenEstimator from "@/components/app/TokenEstimator";
import { TokenOverviewClient } from "@/components/tokens/token-overview-client";
import { getAppContext } from "@/lib/app-context";

export const dynamic = "force-dynamic";

type UsagePageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function TokensUsagePage({ params }: UsagePageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <TokenOverviewClient
        workspaceId={ctx.currentWorkspace.id}
        workspaceSlug={ctx.currentWorkspace.slug}
        showExtraCopy
      />

      <section className="rounded-2xl border border-border bg-card/90 p-6 shadow-lg shadow-black/10">
        <h2 className="text-lg font-semibold text-foreground">Usage guidance</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set alerts before reaching the cap. Hard cap rejects spends after the limit is hit. Use wallet for top ups.
        </p>
      </section>

      <TokenEstimator />
    </div>
  );
}
