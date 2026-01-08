import { redirect } from "next/navigation";
import TokenEstimator from "@/components/app/TokenEstimator";
import { getAppContext } from "@/lib/app-context";
import { getWallet, getLedger } from "@/lib/tokens";
import { tokenRateList, tokenSafetyCopy } from "@/lib/tokenRates";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

type TokensPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function TokensPage({ params }: TokensPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/app/onboarding");

  if (ctx.currentWorkspace.slug !== workspaceSlug) {
    redirect(`/app/${ctx.currentWorkspace.slug}/tokens`);
  }

  await ensureWorkspaceCookie(ctx.currentWorkspace.id);

  const wallet = await getWallet(ctx.currentWorkspace.id);
  const ledger = await getLedger(ctx.currentWorkspace.id, { page: 1, pageSize: 10 });
  const balance = Number(wallet.balance_bigint ?? 0);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Token Wallet</h2>
        <p className="text-3xl font-semibold mt-2">{balance.toLocaleString()}</p>
        <p className="text-sm text-white/60 mt-2">{tokenSafetyCopy}</p>
        <button
          disabled
          className="mt-4 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white opacity-60"
        >
          Top up (coming soon)
        </button>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">How tokens work</h2>
        <p className="text-sm text-white/60 mt-2">
          Token dipakai untuk biaya pemakaian AI/API per aksi. Subscription
          membuka akses modul dan seat, sementara token usage dihitung terpisah.
        </p>
      </section>

      <TokenEstimator />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Token Rates</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {tokenRateList.map((rate) => (
            <div
              key={rate.action}
              className="rounded-xl border border-white/10 bg-black/20 p-4"
            >
              <p className="text-sm font-semibold">{rate.description}</p>
              <p className="text-xs text-white/60 mt-1">
                {rate.tokens} tokens per action
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Token Ledger</h2>
        <div className="mt-4 space-y-3">
          {ledger.length === 0 && (
            <p className="text-sm text-white/60">Belum ada transaksi token.</p>
          )}
          {ledger.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-semibold">{entry.reason}</p>
                <p className="text-xs text-white/60">
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
