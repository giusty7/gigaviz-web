import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Sparkles, Zap, Shield, Wrench } from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { getUpdateBySlug, formatUpdateDate, type UpdateType } from "@/lib/updates";

export const dynamic = "force-dynamic";

type ChangelogDetailPageProps = {
  params: Promise<{ workspaceSlug: string; slug: string }>;
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

export default async function ChangelogDetailPage({ params }: ChangelogDetailPageProps) {
  const { workspaceSlug, slug } = await params;
  const ctx = await getAppContext(workspaceSlug);

  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  const update = await getUpdateBySlug(slug, { audience: "app" });

  if (!update) {
    notFound();
  }

  const Icon = typeIcons[update.type];

  return (
    <div className="container max-w-4xl py-8">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link
          href={`/${workspace.slug}/changelog`}
          className="inline-flex items-center gap-2 text-sm text-[#f5f5dc]/60 transition hover:text-[#d4af37]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Changelog
        </Link>
      </div>

      {/* Article */}
      <article className="relative overflow-hidden rounded-2xl border border-[#d4af37]/15 bg-[#0a1229]/70 p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#d4af37]/5 via-transparent to-transparent" />

        <div className="relative">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${typeColors[update.type]}`}
            >
              <Icon className="h-4 w-4" />
              {typeLabels[update.type]}
            </div>

            <time className="text-sm text-[#f5f5dc]/40">
              {formatUpdateDate(update.date)}
            </time>
          </div>

          {/* Title */}
          <h1 className="mb-4 text-3xl font-bold text-[#f5f5dc]">{update.title}</h1>

          {/* Summary */}
          <p className="mb-6 text-lg text-[#f5f5dc]/70">{update.summary}</p>

          {/* Content */}
          <div
            className="prose prose-invert prose-sm max-w-none prose-headings:text-[#f5f5dc] prose-p:text-[#f5f5dc]/70 prose-a:text-[#d4af37] prose-a:no-underline hover:prose-a:underline prose-strong:text-[#f5f5dc] prose-code:text-[#d4af37] prose-ul:text-[#f5f5dc]/70 prose-ol:text-[#f5f5dc]/70"
            dangerouslySetInnerHTML={{ __html: update.content }}
          />

          {/* Tags */}
          {update.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {update.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-[#d4af37]/20 bg-[#d4af37]/5 px-3 py-1.5 text-xs font-medium text-[#d4af37]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
