import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET - List workflow runs
export async function GET(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const url = new URL(req.url);
  const workflowId = url.searchParams.get("workflow_id");
  const status = url.searchParams.get("status");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  let query = db
    .from("helper_workflow_runs")
    .select(`
      *,
      workflow:helper_workflows(id, name, description)
    `, { count: "exact" })
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (workflowId) {
    query = query.eq("workflow_id", workflowId);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ 
    ok: true, 
    runs: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  }));
}

const runWorkflowSchema = z.object({
  workflow_id: z.string().uuid(),
  trigger_data: z.record(z.string(), z.unknown()).optional(),
});

// POST - Trigger a workflow run
export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, user, withCookies, supabase: db } = guard;
  const userId = user.id;

  const body = await req.json().catch(() => ({}));
  const parsed = runWorkflowSchema.safeParse(body);

  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ ok: false, error: "Invalid request", details: parsed.error.flatten() }, { status: 400 })
    );
  }

  // Get workflow
  const { data: workflow, error: workflowError } = await db
    .from("helper_workflows")
    .select("*")
    .eq("id", parsed.data.workflow_id)
    .eq("workspace_id", workspaceId)
    .single();

  if (workflowError || !workflow) {
    return withCookies(NextResponse.json({ ok: false, error: "Workflow not found" }, { status: 404 }));
  }

  // Parse workflow steps
  const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
  const totalSteps = steps.length;

  // Create run record
  const { data: run, error: runError } = await db
    .from("helper_workflow_runs")
    .insert({
      workspace_id: workspaceId,
      workflow_id: workflow.id,
      trigger_type: "manual",
      trigger_data: parsed.data.trigger_data ?? {},
      status: "pending",
      current_step: 0,
      total_steps: totalSteps,
      steps_completed: [],
      initiated_by: userId,
    })
    .select("*")
    .single();

  if (runError || !run) {
    return withCookies(NextResponse.json({ ok: false, error: runError?.message ?? "Failed to create run" }, { status: 500 }));
  }

  // Start execution asynchronously (in real implementation, this would be a background job)
  executeWorkflowAsync(run.id, workspaceId).catch(err => {
    logger.error("Workflow execution failed:", err);
  });

  return withCookies(NextResponse.json({ 
    ok: true, 
    run,
    message: "Workflow execution started",
  }));
}

// Background workflow execution
async function executeWorkflowAsync(runId: string, workspaceId: string) {
  const db = supabaseAdmin();

  // Update status to running
  await db
    .from("helper_workflow_runs")
    .update({ 
      status: "running",
      started_at: new Date().toISOString(),
    })
    .eq("id", runId)
    .eq("workspace_id", workspaceId);

  // Get run with workflow
  const { data: run } = await db
    .from("helper_workflow_runs")
    .select(`
      *,
      workflow:helper_workflows(*)
    `)
    .eq("id", runId)
    .single();

  if (!run) return;

  const workflow = run.workflow as { steps?: unknown[] } | null;
  const steps = Array.isArray(workflow?.steps) ? workflow.steps : [];
  const stepsCompleted: unknown[] = [];
  let tokensUsed = 0;
  let apiCalls = 0;

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i] as { id?: string; type?: string; config?: unknown };
      const stepStart = Date.now();

      // Update current step
      await db
        .from("helper_workflow_runs")
        .update({ 
          current_step: i + 1,
          steps_completed: stepsCompleted,
        })
        .eq("id", runId);

      // Execute step (simplified - in real implementation, this would handle different step types)
      let stepOutput: unknown = null;
      let stepStatus = "completed";

      try {
        // Simulate step execution
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        stepOutput = { message: `Step ${i + 1} completed successfully` };
        tokensUsed += Math.floor(Math.random() * 100);
        apiCalls += 1;
      } catch (stepError) {
        stepStatus = "failed";
        stepOutput = { error: stepError instanceof Error ? stepError.message : "Unknown error" };
      }

      stepsCompleted.push({
        step_id: step.id ?? `step-${i}`,
        step_index: i,
        status: stepStatus,
        output: stepOutput,
        duration_ms: Date.now() - stepStart,
        completed_at: new Date().toISOString(),
      });

      if (stepStatus === "failed") {
        throw new Error(`Step ${i + 1} failed`);
      }
    }

    // Mark as completed
    await db
      .from("helper_workflow_runs")
      .update({
        status: "completed",
        current_step: steps.length,
        steps_completed: stepsCompleted,
        completed_at: new Date().toISOString(),
        duration_ms: run.started_at ? Date.now() - new Date(run.started_at).getTime() : null,
        tokens_used: tokensUsed,
        api_calls: apiCalls,
        output: { 
          message: "Workflow completed successfully",
          steps_executed: steps.length,
        },
      })
      .eq("id", runId);

  } catch (error) {
    // Mark as failed
    await db
      .from("helper_workflow_runs")
      .update({
        status: "failed",
        steps_completed: stepsCompleted,
        completed_at: new Date().toISOString(),
        duration_ms: run.started_at ? Date.now() - new Date(run.started_at).getTime() : null,
        tokens_used: tokensUsed,
        api_calls: apiCalls,
        error_message: error instanceof Error ? error.message : "Unknown error",
        error_details: { error: String(error) },
      })
      .eq("id", runId);
  }
}
