import Link from "next/link";
import { getLatestUpdates, formatUpdateDate, type UpdateType } from "@/lib/updates";
import { Sparkles, Zap, Shield, Wrench } from "lucide-react";

const typeIcons: Record<UpdateType, React.ComponentType<{ className?: string }>> = {
  shipped: Sparkles,
  improved: Zap,
  fixed: Wrench,
  security: Shield,
};

const typeColors: Record<UpdateType, string> = {
  shipped: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  improved: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  fixed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  security: "bg-red-500/10 text-red-400 border-red-500/20",
};

type UpdatesPanelProps = {
  workspaceSlug: string;
};

export async function UpdatesPanel({ workspaceSlug }: UpdatesPanelProps) {
  const updates = await getLatestUpdates({ audience: "app", limit: 5 });

  if (updates.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#d4af37]/15 bg-[#0a1229]/70 p-5">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#d4af37]/10 via-transparent to-transparent" />
      
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#f5f5dc]">Product updates</p>
            <p className="text-xs text-[#f5f5dc]/65">Latest improvements and features</p>
          </div>
          <Link
            href={`/${workspaceSlug}/changelog`}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/30 px-3 py-2 text-xs font-semibold text-[#d4af37] transition hover:border-[#d4af37]/60 hover:bg-[#d4af37]/10"
          >
            View all →
          </Link>
        </div>

        <div className="space-y-3">
          {updates.map((update) => {
            const Icon = typeIcons[update.type];
            return (
              <Link
                key={update.slug}
                href={`/${workspaceSlug}/changelog/${update.slug}`}
                className="flex items-start gap-3 rounded-xl border border-[#d4af37]/10 bg-[#050a18]/50 p-3 transition hover:border-[#d4af37]/20"
              >
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${typeColors[update.type]}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-[#f5f5dc]">
                    {update.title}
                  </h4>
                  <p className="mt-1 text-xs text-[#f5f5dc]/60 line-clamp-2">
                    {update.summary}
                  </p>
                  <time className="mt-1 block text-xs text-[#f5f5dc]/40">
                    {formatUpdateDate(update.date)}
                  </time>
                </div>
            </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
