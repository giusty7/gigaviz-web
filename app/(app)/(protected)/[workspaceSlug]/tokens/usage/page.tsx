import { redirect } from "next/navigation";
import { Activity, AlertTriangle, Wallet, Info } from "lucide-react";
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
    <div className="relative space-y-6">
      {/* Cyber-Batik Pattern Background */}
      <div className="pointer-events-none fixed inset-0 batik-pattern opacity-[0.03]" aria-hidden />

      {/* Imperium Page Header */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#e11d48]/20 to-[#f43f5e]/10 shadow-lg shadow-[#e11d48]/10">
            <Activity className="h-5 w-5 text-[#e11d48]" />
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[#d4af37]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">
            Analytics
          </div>
        </div>
        <h1 className="text-2xl font-bold md:text-3xl">
          <span className="bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent">
            Token Usage Analytics
          </span>
        </h1>
        <p className="mt-2 text-sm text-[#f5f5dc]/60">
          Monitor consumption patterns, set budget alerts, and optimize your resource allocation.
        </p>
      </div>

      <TokenOverviewClient
        workspaceId={ctx.currentWorkspace.id}
        workspaceSlug={ctx.currentWorkspace.slug}
        showExtraCopy
      />

      {/* Usage Guidance - Imperium Styled */}
      <section className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6 backdrop-blur-xl">
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl gradient-overlay-magenta-tr-soft"
          aria-hidden
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-4 w-4 text-[#d4af37]" />
            <h2 className="text-lg font-semibold text-[#f5f5dc]">Usage Guidance</h2>
          </div>
          <p className="text-sm text-[#f5f5dc]/60 mb-4">
            Set alerts before reaching the cap. Hard cap rejects spends after the limit is hit. Use wallet for top ups.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-[#f5f5dc]">Alert Threshold</p>
                <p className="text-xs text-[#f5f5dc]/60">Get notified when usage reaches 80% of your cap.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-[#10b981]/20 bg-[#10b981]/5 p-3">
              <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-[#10b981]" />
              <div>
                <p className="text-sm font-medium text-[#f5f5dc]">Top Up Wallet</p>
                <p className="text-xs text-[#f5f5dc]/60">Add tokens anytime to keep operations running.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TokenEstimator />
    </div>
  );
}
