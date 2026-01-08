import Link from "next/link";
import { tokenSafetyCopy } from "@/lib/tokenRates";

type TokenCardProps = {
  balance: number;
  workspaceSlug?: string | null;
};

export default function TokenCard({ balance, workspaceSlug }: TokenCardProps) {
  const tokensHref = workspaceSlug ? `/app/${workspaceSlug}/tokens` : "/app/tokens";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/60">Token Wallet</p>
          <h2 className="text-2xl font-semibold">{balance.toLocaleString()}</h2>
          <p className="text-xs text-white/50 mt-1">Tokens available</p>
        </div>
        <Link
          href={tokensHref}
          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
        >
          Token rates
        </Link>
      </div>

      <p className="mt-4 text-xs text-amber-100/80">{tokenSafetyCopy}</p>
    </div>
  );
}
