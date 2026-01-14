import { redirect } from "next/navigation";
import TokenEstimator from "@/components/app/TokenEstimator";
import { TokenOverviewClient } from "@/components/tokens/token-overview-client";
import { getAppContext } from "@/lib/app-context";

export const dynamic = "force-dynamic";

type TokensPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function TokensPage({ params }: TokensPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <TokenOverviewClient workspaceId={ctx.currentWorkspace.id} workspaceSlug={ctx.currentWorkspace.slug} />

      <section className="rounded-2xl border border-border bg-card/90 p-6 shadow-lg shadow-black/10">
        <h2 className="text-lg font-semibold text-foreground">Token Rates</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tokens cover AI/API usage. Subscriptions unlock modules and seats, while token usage is calculated separately.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-gigaviz-surface/80 p-4">
            <p className="text-sm font-semibold text-foreground">Messaging / Helper</p>
            <p className="text-xs text-muted-foreground mt-1">Typical flows cost 8-60 tokens per action.</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-gigaviz-surface/80 p-4">
            <p className="text-sm font-semibold text-foreground">Studio / Graph</p>
            <p className="text-xs text-muted-foreground mt-1">Media + graph generation costs 20-60 tokens per render.</p>
          </div>
        </div>
      </section>

      <TokenEstimator />
    </div>
  );
}

