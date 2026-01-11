import Link from "next/link";

type LockedScreenProps = {
  title: string;
  description?: string;
  workspaceSlug?: string | null;
};

export default function LockedScreen({
  title,
  description,
  workspaceSlug,
}: LockedScreenProps) {
  const billingHref = workspaceSlug ? `/${workspaceSlug}/billing` : "/billing";

  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6 text-amber-100">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-amber-100/80 mt-2">
        {description ||
          "Upgrade your plan to unlock this module and start consuming tokens."}
      </p>
      <Link
        href={billingHref}
        className="mt-4 inline-flex items-center rounded-xl border border-amber-400/40 bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-50 hover:bg-amber-500/30"
      >
        Upgrade plan
      </Link>
    </div>
  );
}
