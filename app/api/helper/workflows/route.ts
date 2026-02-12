import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { randomUUID } from "crypto";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const CreateWorkflowSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  triggerType: z.enum(["message_received", "scheduled", "tag_added", "manual"]),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  steps: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["action", "condition", "delay"]),
      action: z.string().optional(),
      params: z.record(z.string(), z.unknown()).optional(),
      condition: z.string().optional(),
      delay_seconds: z.number().optional(),
    })
  ).default([]),
});

const UpdateWorkflowSchema = CreateWorkflowSchema.extend({
  id: z.string().uuid(),
});

const PatchWorkflowSchema = z.object({
  workspaceId: z.string().uuid(),
  id: z.string().uuid(),
  isActive: z.boolean(),
});

/**
 * GET /api/helper/workflows
 * List workflows for a workspace
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const { data: workflows, error } = await db
    .from("helper_workflows")
    .select("id, name, description, trigger_type, trigger_config, steps, is_active, run_count, last_run_at, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logger.error("Failed to load workflows:", error);
    return withCookies(NextResponse.json({ error: "Failed to load workflows" }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, workflows }));
});

/**
 * POST /api/helper/workflows
 * Create a new workflow
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, user, withCookies, supabase: db } = guard;

  try {
    const body = guard.body ?? await req.json();
    const parsed = CreateWorkflowSchema.safeParse(body);

    if (!parsed.success) {
      return withCookies(
        NextResponse.json(
          { error: "Invalid input", details: parsed.error.issues },
          { status: 400 }
        )
      );
    }

    const { name, description, triggerType, triggerConfig, steps } = parsed.data;

    const { data: workflow, error } = await db
      .from("helper_workflows")
      .insert({
        id: randomUUID(),
        workspace_id: workspaceId,
        name,
        description: description ?? null,
        trigger_type: triggerType,
        trigger_config: triggerConfig ?? {},
        steps,
        is_active: false,
        run_count: 0,
        created_by: user.id,
      })
      .select("id, name, description, trigger_type, trigger_config, steps, is_active, run_count, last_run_at, created_at")
      .single();

    if (error) {
      logger.error("Failed to create workflow:", error);
      return withCookies(NextResponse.json({ error: "Failed to create workflow" }, { status: 500 }));
    }

    return withCookies(NextResponse.json({ ok: true, workflow }));
  } catch (err) {
    logger.error("Create workflow error:", err);
    return withCookies(NextResponse.json({ error: "Internal error" }, { status: 500 }));
  }
});

/**
 * PUT /api/helper/workflows
 * Update an existing workflow
 */
export const PUT = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  try {
    const body = guard.body ?? await req.json();
    const parsed = UpdateWorkflowSchema.safeParse(body);

    if (!parsed.success) {
      return withCookies(
        NextResponse.json(
          { error: "Invalid input", details: parsed.error.issues },
          { status: 400 }
        )
      );
    }

    const { id, name, description, triggerType, triggerConfig, steps } = parsed.data;

    const { data: workflow, error } = await db
      .from("helper_workflows")
      .update({
        name,
        description: description ?? null,
        trigger_type: triggerType,
        trigger_config: triggerConfig ?? {},
        steps,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select("id, name, description, trigger_type, trigger_config, steps, is_active, run_count, last_run_at, created_at")
      .single();

    if (error) {
      logger.error("Failed to update workflow:", error);
      return withCookies(NextResponse.json({ error: "Failed to update workflow" }, { status: 500 }));
    }

    return withCookies(NextResponse.json({ ok: true, workflow }));
  } catch (err) {
    logger.error("Update workflow error:", err);
    return withCookies(NextResponse.json({ error: "Internal error" }, { status: 500 }));
  }
});

/**
 * PATCH /api/helper/workflows
 * Toggle workflow active status
 */
export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  try {
    const body = guard.body ?? await req.json();
    const parsed = PatchWorkflowSchema.safeParse(body);

    if (!parsed.success) {
      return withCookies(
        NextResponse.json(
          { error: "Invalid input", details: parsed.error.issues },
          { status: 400 }
        )
      );
    }

    const { id, isActive } = parsed.data;

    const { error } = await db
      .from("helper_workflows")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) {
      logger.error("Failed to toggle workflow:", error);
      return withCookies(NextResponse.json({ error: "Failed to toggle workflow" }, { status: 500 }));
    }

    return withCookies(NextResponse.json({ ok: true }));
  } catch (err) {
    logger.error("Patch workflow error:", err);
    return withCookies(NextResponse.json({ error: "Internal error" }, { status: 500 }));
  }
});

/**
 * DELETE /api/helper/workflows
 * Delete a workflow
 */
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return withCookies(NextResponse.json({ error: "id required" }, { status: 400 }));
  }

  const { error } = await db
    .from("helper_workflows")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) {
    logger.error("Failed to delete workflow:", error);
    return withCookies(NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true }));
});
