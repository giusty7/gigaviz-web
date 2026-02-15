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
  shipped: "text-emerald-400",
  improved: "text-blue-400",
  fixed: "text-amber-400",
  security: "text-red-400",
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
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-[#f5f5dc]/30">
          What&apos;s New
        </h3>
        <Link
          href={`/${workspaceSlug}/changelog`}
          className="text-[11px] font-medium text-[#d4af37]/60 hover:text-[#d4af37] transition flex items-center gap-1"
        >
          View all <Sparkles className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y divide-[#f5f5dc]/[0.04] rounded-xl border border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02]">
        {updates.map((update) => {
          const Icon = typeIcons[update.type];
          return (
            <Link
              key={update.slug}
              href={`/${workspaceSlug}/changelog/${update.slug}`}
              className="flex items-start gap-3 px-3 py-2.5 transition hover:bg-[#f5f5dc]/[0.02]"
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${typeColors[update.type]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-medium text-[#f5f5dc]/70 line-clamp-1">
                    {update.title}
                  </h4>
                  <time className="text-[10px] text-[#f5f5dc]/20 whitespace-nowrap">
                    {formatUpdateDate(update.date)}
                  </time>
                </div>
                <p className="mt-0.5 text-[11px] text-[#f5f5dc]/30 line-clamp-1">
                  {update.summary}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
