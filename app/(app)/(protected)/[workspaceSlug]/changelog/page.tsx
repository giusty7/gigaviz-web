import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Sparkles, Zap, Shield, Wrench } from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { getAllUpdates, formatUpdateDate, type UpdateType } from "@/lib/updates";

export const dynamic = "force-dynamic";

type ChangelogPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

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

export default async function WorkspaceChangelogPage({ params }: ChangelogPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  const updates = await getAllUpdates({ audience: "app", limit: 50 });

  return (
    <div className="container max-w-5xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${workspace.slug}/dashboard`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#f5f5dc]/60 transition hover:text-[#d4af37]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-[#f5f5dc]">Product Updates</h1>
        <p className="mt-2 text-[#f5f5dc]/60">
          All improvements, features, and fixes for your workspace
        </p>
      </div>

      {/* Updates List */}
      <div className="space-y-6">
        {updates.length === 0 ? (
          <div className="rounded-2xl border border-[#d4af37]/15 bg-[#0a1229]/70 p-12 text-center">
            <p className="text-[#f5f5dc]/60">No updates yet. Check back soon!</p>
          </div>
        ) : (
          updates.map((update) => {
            const Icon = typeIcons[update.type];
            return (
              <Link
                key={update.slug}
                href={`/${workspace.slug}/changelog/${update.slug}`}
                className="group block"
              >
                <article
                  id={update.slug}
                  className="relative overflow-hidden rounded-2xl border border-[#d4af37]/15 bg-[#0a1229]/70 p-6 transition hover:border-[#d4af37]/30"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#d4af37]/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

                  <div className="relative">
                    {/* Header */}
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <div
                        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium ${typeColors[update.type]}`}
                      >
                        <Icon className="h-4 w-4" />
                        {typeLabels[update.type]}
                      </div>

                      <time className="text-sm text-[#f5f5dc]/40">
                        {formatUpdateDate(update.date)}
                      </time>
                    </div>

                    {/* Title */}
                    <h2 className="mb-2 text-xl font-bold text-[#f5f5dc] group-hover:text-[#d4af37]">
                      {update.title}
                    </h2>

                    {/* Summary */}
                    <p className="text-[#f5f5dc]/70">{update.summary}</p>

                    {/* Tags */}
                    {update.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {update.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg border border-[#d4af37]/20 bg-[#d4af37]/5 px-2 py-1 text-xs font-medium text-[#d4af37]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
