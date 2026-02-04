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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]/80 font-semibold">
            What&apos;s New
          </p>
          <h2 className="text-xl font-bold text-[#f5f5dc]">Product Updates</h2>
        </div>
        <Link
          href={`/${workspaceSlug}/changelog`}
          className="text-sm font-semibold text-[#d4af37] hover:underline flex items-center gap-1"
        >
          View all <Sparkles className="h-4 w-4" />
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/70">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent" />
        
        <div className="relative divide-y divide-[#d4af37]/10">{updates.map((update) => {
            const Icon = typeIcons[update.type];
            return (
              <Link
                key={update.slug}
                href={`/${workspaceSlug}/changelog/${update.slug}`}
                className="flex items-start gap-4 p-4 transition hover:bg-[#d4af37]/5"
              >
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${typeColors[update.type]}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-semibold text-[#f5f5dc]">
                      {update.title}
                    </h4>
                    <time className="text-xs text-[#f5f5dc]/40 whitespace-nowrap">
                      {formatUpdateDate(update.date)}
                    </time>
                  </div>
                  <p className="mt-1 text-xs text-[#f5f5dc]/60 line-clamp-2">
                    {update.summary}
                  </p>
                </div>
            </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
