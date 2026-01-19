import { redirect } from "next/navigation";
import { Coins, Zap, Sparkles, MessageSquare, BarChart3 } from "lucide-react";
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
    <div className="relative space-y-6">
      {/* Cyber-Batik Pattern Background */}
      <div className="pointer-events-none fixed inset-0 batik-pattern opacity-[0.03]" aria-hidden />

      {/* Imperium Page Header */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 shadow-lg shadow-[#d4af37]/10">
            <Coins className="h-5 w-5 text-[#d4af37]" />
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[#10b981]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#10b981]">
            <Zap className="h-3 w-3" />
            Royal Vault
          </div>
        </div>
        <h1 className="text-2xl font-bold md:text-3xl">
          <span className="bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent">
            Imperial Tokens
          </span>
        </h1>
        <p className="mt-2 text-sm text-[#f5f5dc]/60">
          Manage your token balance, track usage, and power your AI operations.
        </p>
      </div>

      <TokenOverviewClient workspaceId={ctx.currentWorkspace.id} workspaceSlug={ctx.currentWorkspace.slug} />

      {/* Token Rates - Imperium Styled */}
      <section className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6 backdrop-blur-xl">
        {/* Gold gradient overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl gradient-overlay-gold-bl-soft"
          aria-hidden
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-[#d4af37]" />
            <h2 className="text-lg font-semibold text-[#f5f5dc]">Token Rates</h2>
          </div>
          <p className="text-sm text-[#f5f5dc]/60">
            Tokens cover AI/API usage. Subscriptions unlock modules and seats, while token usage is calculated separately.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-[#e11d48]/20 bg-[#e11d48]/5 p-4 transition-all hover:border-[#e11d48]/40">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-[#e11d48]" />
                <p className="text-sm font-semibold text-[#f5f5dc]">Messaging / Helper</p>
              </div>
              <p className="text-xs text-[#f5f5dc]/60">Typical flows cost 8-60 tokens per action.</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-[#e11d48]/20 px-2 py-0.5 text-[10px] font-semibold text-[#e11d48]">8-60 tokens</span>
              </div>
            </div>
            <div className="rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-4 transition-all hover:border-[#d4af37]/40">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-[#d4af37]" />
                <p className="text-sm font-semibold text-[#f5f5dc]">Studio / Graph</p>
              </div>
              <p className="text-xs text-[#f5f5dc]/60">Media + graph generation costs 20-60 tokens per render.</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-[#d4af37]/20 px-2 py-0.5 text-[10px] font-semibold text-[#d4af37]">20-60 tokens</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TokenEstimator />
    </div>
  );
}

