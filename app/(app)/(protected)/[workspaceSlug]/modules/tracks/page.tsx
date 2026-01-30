import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { Workflow, Plus, Play, Pause, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

type WorkflowType = {
  id: string;
  title: string;
  slug: string;
  status: string;
  runs_count: number;
  success_count: number;
  failure_count: number;
  updated_at: string;
};

type Run = {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  tokens_used: number;
  workflows: {
    title: string;
  };
};

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function TracksPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const supabase = await supabaseServer();

  // Fetch workflows
  const { data: workflows } = await supabase
    .from("tracks_workflows")
    .select("*")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .order("updated_at", { ascending: false });

  // Fetch recent runs
  const { data: runs } = await supabase
    .from("tracks_runs")
    .select(`
      id,
      status,
      started_at,
      completed_at,
      tokens_used,
      workflow_id,
      tracks_workflows!inner(title)
    `)
    .eq("workspace_id", ctx.currentWorkspace.id)
    .order("started_at", { ascending: false })
    .limit(10);

  const activeWorkflows = workflows?.filter((w) => w.status === "active").length ?? 0;
  const totalRuns = workflows?.reduce((acc, w) => acc + w.runs_count, 0) ?? 0;

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gigaviz Tracks</h1>
          <p className="mt-2 text-muted-foreground">
            Workflow orchestration and journey builder
          </p>
        </div>
        <Link
          href={`/${workspaceSlug}/modules/tracks/new`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Workflow
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Workflow className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{workflows?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Total Workflows</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Play className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{activeWorkflows}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{totalRuns}</p>
              <p className="text-sm text-muted-foreground">Total Runs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workflows Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Workflows</h2>
        {workflows && workflows.length > 0 ? (
          <div className="space-y-3">
            {(workflows as WorkflowType[]).map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between rounded-lg border bg-card p-6"
              >
                <div className="flex items-center gap-4">
                  {workflow.status === "active" ? (
                    <Play className="h-5 w-5 text-green-500" />
                  ) : workflow.status === "paused" ? (
                    <Pause className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Workflow className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <h3 className="font-semibold">{workflow.title}</h3>
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        {workflow.runs_count} runs
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {workflow.success_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-red-500" />
                        {workflow.failure_count}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs ${
                    workflow.status === "active" ? "bg-green-500/10 text-green-500" :
                    workflow.status === "paused" ? "bg-yellow-500/10 text-yellow-500" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {workflow.status}
                  </span>
                  <Link
                    href={`/${workspaceSlug}/modules/tracks/workflows/${workflow.slug}`}
                    className="rounded-md border bg-background px-3 py-1 text-sm hover:bg-accent"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-12 text-center">
            <Workflow className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No workflows yet. Create your first automation!
            </p>
          </div>
        )}
      </div>

      {/* Recent Runs */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Recent Runs</h2>
        {runs && runs.length > 0 ? (
          <div className="space-y-2">
            {(runs as unknown as Run[]).map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  {run.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : run.status === "failed" ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Play className="h-5 w-5 text-blue-500 animate-pulse" />
                  )}
                  <div>
                    <p className="font-medium">{run.workflows.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(run.started_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{run.tokens_used} tokens</span>
                  <span className={`rounded-full px-3 py-1 text-xs ${
                    run.status === "completed" ? "bg-green-500/10 text-green-500" :
                    run.status === "failed" ? "bg-red-500/10 text-red-500" :
                    "bg-blue-500/10 text-blue-500"
                  }`}>
                    {run.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-12 text-center">
            <Play className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No runs yet. Activate a workflow to see executions here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
