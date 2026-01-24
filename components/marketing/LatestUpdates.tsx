import Link from "next/link";
import { getLatestUpdates, formatUpdateDate, type UpdateType } from "@/lib/updates";
import { Sparkles, Zap, Shield, Wrench } from "lucide-react";

const typeIcons: Record<UpdateType, React.ComponentType<{ className?: string }>> = {
  shipped: Sparkles,
  improved: Zap,
  fixed: Wrench,
  security: Shield,
};

const typeLabels: Record<UpdateType, string> = {
  shipped: "Shipped",
  improved: "Improved",
  fixed: "Fixed",
  security: "Security",
};

export async function LatestUpdates() {
  const updates = await getLatestUpdates({ audience: "public", limit: 3 });

  if (updates.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#f5f5dc]">Latest Updates</h2>
          <p className="mt-1 text-sm text-[#f5f5dc]/60">
            See what&apos;s new and what we&apos;re building next
          </p>
        </div>
        <Link
          href="/changelog"
          className="text-sm font-semibold text-[#d4af37] hover:underline"
        >
          View all updates →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {updates.map((update) => {
          const Icon = typeIcons[update.type];
          return (
            <article
              key={update.slug}
              className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6 backdrop-blur-xl transition hover:border-[#d4af37]/40"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4af37]/10">
                  <Icon className="h-4 w-4 text-[#d4af37]" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
                  {typeLabels[update.type]}
                </span>
              </div>

              <h3 className="mb-2 text-lg font-semibold text-[#f5f5dc]">
                {update.title}
              </h3>

              <p className="mb-4 text-sm text-[#f5f5dc]/70">{update.summary}</p>

              <time className="text-xs text-[#f5f5dc]/50">
                {formatUpdateDate(update.date)}
              </time>
            </article>
          );
        })}
      </div>
    </section>
  );
}
