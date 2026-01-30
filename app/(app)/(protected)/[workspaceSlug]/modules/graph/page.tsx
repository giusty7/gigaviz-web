import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { BarChart3, Plus, PieChart, LineChart } from "lucide-react";
import Link from "next/link";

type Chart = {
  id: string;
  title: string;
  chart_type: string;
  tags: string[];
  updated_at: string;
};

type Dashboard = {
  id: string;
  title: string;
  slug: string;
  updated_at: string;
};

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function GraphPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const supabase = await supabaseServer();

  // Fetch charts
  const { data: charts } = await supabase
    .from("graph_charts")
    .select("id, title, chart_type, tags, updated_at")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .order("updated_at", { ascending: false })
    .limit(12);

  // Fetch dashboards
  const { data: dashboards } = await supabase
    .from("graph_dashboards")
    .select("id, title, slug, updated_at")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .order("updated_at", { ascending: false })
    .limit(10);

  const chartTypeIcons: Record<string, typeof BarChart3> = {
    bar: BarChart3,
    line: LineChart,
    pie: PieChart,
  };

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gigaviz Graph</h1>
          <p className="mt-2 text-muted-foreground">
            Visual and analytics generation with AI
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/${workspaceSlug}/modules/graph/new-chart`}
            className="inline-flex h-10 items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
            New Chart
          </Link>
          <Link
            href={`/${workspaceSlug}/modules/graph/new-dashboard`}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Dashboard
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{charts?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Charts</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <PieChart className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{dashboards?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Dashboards</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Plus className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">Beta</p>
              <p className="text-sm text-muted-foreground">Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Charts</h2>
        {charts && charts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(charts as Chart[]).map((chart) => {
              const Icon = chartTypeIcons[chart.chart_type] || BarChart3;
              return (
                <div
                  key={chart.id}
                  className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {chart.chart_type}
                    </span>
                  </div>
                  <h3 className="mb-2 font-semibold">{chart.title}</h3>
                  <div className="flex flex-wrap gap-1">
                    {chart.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-12 text-center">
            <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No charts yet. Create your first visualization!
            </p>
          </div>
        )}
      </div>

      {/* Dashboards Section */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Dashboards</h2>
        {dashboards && dashboards.length > 0 ? (
          <div className="space-y-2">
            {(dashboards as Dashboard[]).map((dashboard) => (
              <Link
                key={dashboard.id}
                href={`/${workspaceSlug}/modules/graph/dashboards/${dashboard.slug}`}
                className="flex items-center justify-between rounded-lg border bg-card p-4 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <PieChart className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{dashboard.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Updated {new Date(dashboard.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-12 text-center">
            <PieChart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No dashboards yet. Create your first dashboard!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
