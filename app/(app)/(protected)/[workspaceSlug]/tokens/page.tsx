import { redirect } from "next/navigation";
import TokenEstimator from "@/components/app/TokenEstimator";
import { getAppContext } from "@/lib/app-context";
import { getLedger } from "@/lib/tokens";
import { tokenRateList } from "@/lib/tokenRates";
import { ensureWorkspaceCookie } from "@/lib/workspaces";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import LockedScreen from "@/components/app/LockedScreen";
import UsageSummaryCard from "@/components/usage/UsageSummaryCard";
import { TokenTopupClient } from "@/components/billing/TokenTopupClient";
import { getBillingSummary } from "@/lib/billing/summary";

export const dynamic = "force-dynamic";

type TokensPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function TokensPage({ params }: TokensPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  if (ctx.currentWorkspace.slug !== workspaceSlug) {
    redirect(`/${ctx.currentWorkspace.slug}/tokens`);
  }

  await ensureWorkspaceCookie(ctx.currentWorkspace.id);

  const ledger = await getLedger(ctx.currentWorkspace.id, { page: 1, pageSize: 10 });
  const summary = await getBillingSummary(ctx.currentWorkspace.id);

  const db = supabaseAdmin();
  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .maybeSingle();

  const plan = getPlanMeta(subscription?.plan_id || "free_locked");
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const allowed = canAccess({ plan_id: plan.plan_id, is_admin: isAdmin }, "tokens_view");
  const canEditCap = ctx.currentRole === "owner" || ctx.currentRole === "admin";

  if (!allowed) {
    return (
      <LockedScreen title="Tokens locked" description="Upgrade to access tokens and top up features." workspaceSlug={ctx.currentWorkspace.slug} />
    );
  }

  return (
    <div className="space-y-6">
      <UsageSummaryCard
        workspaceId={ctx.currentWorkspace.id}
        workspaceSlug={ctx.currentWorkspace.slug}
        canEditCap={canEditCap}
      />

      <TokenTopupClient
        workspaceSlug={ctx.currentWorkspace.slug}
        initialSummary={summary}
        canEdit={canEditCap}
      />

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">How tokens work</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Token dipakai untuk biaya pemakaian AI/API per aksi. Subscription
          membuka akses modul dan seat, sementara token usage dihitung terpisah.
        </p>
      </section>

      <TokenEstimator />

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Token Rates</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {tokenRateList.map((rate) => (
            <div
              key={rate.action}
              className="rounded-xl border border-border bg-gigaviz-surface p-4"
            >
              <p className="text-sm font-semibold text-foreground">{rate.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {rate.tokens} tokens per action
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Token Ledger</h2>
        <div className="mt-4 space-y-3">
          {ledger.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada transaksi token.</p>
          )}
          {ledger.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-xl border border-border bg-gigaviz-surface px-4 py-3 text-sm"
            >
              <div>
                <p className="font-semibold text-foreground">{entry.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>
              <div
                className={
                  Number(entry.delta_bigint) >= 0
                    ? "text-emerald-300"
                    : "text-red-300"
                }
              >
                {Number(entry.delta_bigint) >= 0 ? "+" : ""}
                {Number(entry.delta_bigint).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

