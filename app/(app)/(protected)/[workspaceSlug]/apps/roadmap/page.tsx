import { redirect } from "next/navigation";
import Link from "next/link";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

type RoadmapRow = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  quarter: string | null;
  upvotes: number;
  estimated_release: string | null;
  shipped_at: string | null;
  app_catalog_id: string | null;
};

export default async function RoadmapPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const db = supabaseAdmin();
  const { data: roadmapItems } = await db
    .from("apps_roadmap")
    .select("*")
    .eq("is_public", true)
    .order("upvotes", { ascending: false });

  const planned = (roadmapItems || []).filter((item: RoadmapRow) => item.status === "planned");
  const inProgress = (roadmapItems || []).filter((item: RoadmapRow) => item.status === "in_progress");
  const shipped = (roadmapItems || []).filter((item: RoadmapRow) => item.status === "shipped");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Roadmap</h1>
          <p className="text-sm text-muted-foreground">
            See what we&apos;re building next
          </p>
        </div>
        <Link
          href={`/${workspaceSlug}/apps`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Apps
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Planned */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-slate-500" />
            <h2 className="font-semibold text-slate-600 dark:text-slate-400">
              Planned ({planned.length})
            </h2>
          </div>
          <div className="space-y-3">
            {planned.map((item: RoadmapRow) => (
              <div key={item.id} className="rounded-lg border bg-card p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  {item.quarter && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.quarter}
                    </span>
                  )}
                </div>
                <p className="mb-3 text-xs text-muted-foreground">{item.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {item.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    👍 {item.upvotes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* In Progress */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <h2 className="font-semibold text-blue-600 dark:text-blue-400">
              In Progress ({inProgress.length})
            </h2>
          </div>
          <div className="space-y-3">
            {inProgress.map((item: RoadmapRow) => (
              <div key={item.id} className="rounded-lg border border-blue-200 bg-card p-4 dark:border-blue-900">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  {item.quarter && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.quarter}
                    </span>
                  )}
                </div>
                <p className="mb-3 text-xs text-muted-foreground">{item.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {item.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    👍 {item.upvotes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipped */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <h2 className="font-semibold text-green-600 dark:text-green-400">
              Shipped ({shipped.length})
            </h2>
          </div>
          <div className="space-y-3">
            {shipped.map((item: RoadmapRow) => (
              <div key={item.id} className="rounded-lg border border-green-200 bg-card p-4 opacity-75 dark:border-green-900">
                <div className="mb-2">
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  {item.shipped_at && (
                    <p className="text-xs text-muted-foreground">
                      Shipped {new Date(item.shipped_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <p className="mb-3 text-xs text-muted-foreground">{item.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
