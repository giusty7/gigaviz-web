import Link from "next/link";
import type { PlanMeta } from "@/lib/entitlements";

type PlanCardProps = {
  plan: PlanMeta;
  status?: string | null;
  seatLimit?: number | null;
  workspaceSlug?: string | null;
};

export default function PlanCard({
  plan,
  status,
  seatLimit,
  workspaceSlug,
}: PlanCardProps) {
  const billingHref = workspaceSlug ? `/${workspaceSlug}/billing` : "/billing";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/60">Current Plan</p>
          <h2 className="text-xl font-semibold">{plan.name}</h2>
          <p className="text-xs text-white/50 mt-1">
            Status: {status || "active"}
          </p>
        </div>
        <Link
          href={billingHref}
          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
        >
          {plan.ctaLabel}
        </Link>
      </div>

      <div className="mt-4 text-sm text-white/70">
        Seat limit: <span className="text-white">{seatLimit ?? plan.seat_limit}</span>
      </div>

      <ul className="mt-3 space-y-2 text-sm text-white/70">
        {plan.highlightBenefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
