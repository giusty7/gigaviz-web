import { getAllUpdates, formatUpdateDate, type UpdateType } from "@/lib/updates";
import { Sparkles, Zap, Shield, Wrench } from "lucide-react";

const typeIcons: Record<UpdateType, React.ComponentType<{ className?: string }>> = {
  shipped: Sparkles,
  improved: Zap,
  fixed: Wrench,
  security: Shield,
};

const typeLabels: Record<UpdateType, string> = {
  shipped: "New",
  improved: "Improved",
  fixed: "Fixed",
  security: "Security",
};

const typeColors: Record<UpdateType, string> = {
  shipped: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  improved: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  fixed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  security: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default async function ChangelogPage() {
  const updates = await getAllUpdates({ audience: "public", limit: 50 });

  return (
    <main className="min-h-screen bg-[#050a18] py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#f5f5dc] sm:text-5xl">
            Changelog
          </h1>
          <p className="text-lg text-[#f5f5dc]/70">
            Follow along as we build and improve Gigaviz
          </p>
        </div>

        {/* Updates List */}
        <div className="space-y-8">
          {updates.length === 0 ? (
            <div className="rounded-2xl border border-[#d4af37]/15 bg-[#0a1229]/70 p-12 text-center">
              <p className="text-[#f5f5dc]/60">No updates yet. Check back soon!</p>
            </div>
          ) : (
            updates.map((update) => {
              const Icon = typeIcons[update.type];
              return (
                <article
                  key={update.slug}
                  id={update.slug}
                  className="group relative overflow-hidden rounded-2xl border border-[#d4af37]/15 bg-[#0a1229]/70 p-8 transition hover:border-[#d4af37]/30"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#d4af37]/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

                  <div className="relative">
                    {/* Header */}
                    <div className="mb-4 flex flex-wrap items-start gap-3">
                      <div
                        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium ${typeColors[update.type]}`}
                      >
                        <Icon className="h-4 w-4" />
                        {typeLabels[update.type]}
                      </div>

                      <time className="flex items-center gap-2 text-sm text-[#f5f5dc]/40">
                        {formatUpdateDate(update.date)}
                      </time>
                    </div>

                    {/* Title */}
                    <h2 className="mb-3 text-2xl font-bold text-[#f5f5dc]">
                      {update.title}
                    </h2>

                    {/* Summary */}
                    <p className="mb-4 text-[#f5f5dc]/70">{update.summary}</p>

                    {/* Content */}
                    <div
                      className="prose prose-invert prose-sm max-w-none prose-headings:text-[#f5f5dc] prose-p:text-[#f5f5dc]/70 prose-a:text-[#d4af37] prose-a:no-underline hover:prose-a:underline prose-strong:text-[#f5f5dc] prose-code:text-[#d4af37]"
                      dangerouslySetInnerHTML={{ __html: update.content }}
                    />

                    {/* Tags */}
                    {update.tags.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {update.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg border border-[#d4af37]/20 bg-[#d4af37]/5 px-3 py-1 text-xs font-medium text-[#d4af37]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
