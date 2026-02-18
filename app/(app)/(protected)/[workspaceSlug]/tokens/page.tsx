import { redirect } from "next/navigation";
import { Coins, Zap, Sparkles, MessageSquare, BarChart3 } from "lucide-react";
import TokenEstimator from "@/components/app/TokenEstimator";
import { TokenOverviewClient } from "@/components/tokens/token-overview-client";
import { getAppContext } from "@/lib/app-context";
import { PageHeader } from "@/components/ui/page-header";

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
    <div className="relative space-y-6">
      {/* Cyber-Batik Pattern Background */}
      <div className="pointer-events-none fixed inset-0 batik-pattern opacity-[0.03]" aria-hidden />

      {/* Imperium Page Header */}
      <PageHeader
        title="Imperial Tokens"
        description="Manage your token balance, track usage, and power your AI operations."
        titleClassName="bg-gradient-to-r from-gigaviz-gold via-gigaviz-gold-bright to-gigaviz-gold bg-clip-text text-transparent"
        badge={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-gigaviz-gold-bright/10 shadow-lg shadow-accent/10">
              <Coins className="h-5 w-5 text-accent" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-success">
              <Zap className="h-3 w-3" aria-hidden="true" />
              Royal Vault
            </div>
          </div>
        }
      />

      <TokenOverviewClient workspaceId={ctx.currentWorkspace.id} workspaceSlug={ctx.currentWorkspace.slug} />

      {/* Token Rates - Imperium Styled */}
      <section className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gigaviz-surface/80 p-6 backdrop-blur-xl">
        {/* Gold gradient overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl gradient-overlay-gold-bl-soft"
          aria-hidden
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-accent" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-foreground">Token Rates</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Tokens cover AI/API usage. Subscriptions unlock modules and seats, while token usage is calculated separately.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 transition-all hover:border-destructive/40">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-destructive" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">Messaging / Helper</p>
              </div>
              <p className="text-xs text-muted-foreground">Typical flows cost 8-60 tokens per action.</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-semibold text-destructive">8-60 tokens</span>
              </div>
            </div>
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 transition-all hover:border-accent/40">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">Studio / Graph</p>
              </div>
              <p className="text-xs text-muted-foreground">Media + graph generation costs 20-60 tokens per render.</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">20-60 tokens</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TokenEstimator />
    </div>
  );
}

