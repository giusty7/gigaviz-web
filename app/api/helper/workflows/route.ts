import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireWorkspaceMember } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

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
export async function GET(req: NextRequest) {
  const userRes = await requireUser(req);
  if (!userRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = userRes;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const membership = await requireWorkspaceMember(user.id, workspaceId);
  if (!membership.ok) {
    return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
  }

  const db = supabaseAdmin();
  const { data: workflows, error } = await db
    .from("helper_workflows")
    .select("id, name, description, trigger_type, trigger_config, steps, is_active, run_count, last_run_at, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to load workflows:", error);
    return NextResponse.json({ error: "Failed to load workflows" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, workflows });
}

/**
 * POST /api/helper/workflows
 * Create a new workflow
 */
export async function POST(req: NextRequest) {
  const userRes = await requireUser(req);
  if (!userRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = userRes;

  try {
    const body = await req.json();
    const parsed = CreateWorkflowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { workspaceId, name, description, triggerType, triggerConfig, steps } = parsed.data;

    const membership = await requireWorkspaceMember(user.id, workspaceId);
    if (!membership.ok) {
      return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
    }

    const db = supabaseAdmin();
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
      console.error("Failed to create workflow:", error);
      return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, workflow });
  } catch (err) {
    console.error("Create workflow error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * PUT /api/helper/workflows
 * Update an existing workflow
 */
export async function PUT(req: NextRequest) {
  const userRes = await requireUser(req);
  if (!userRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = userRes;

  try {
    const body = await req.json();
    const parsed = UpdateWorkflowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { workspaceId, id, name, description, triggerType, triggerConfig, steps } = parsed.data;

    const membership = await requireWorkspaceMember(user.id, workspaceId);
    if (!membership.ok) {
      return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
    }

    const db = supabaseAdmin();
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
      console.error("Failed to update workflow:", error);
      return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, workflow });
  } catch (err) {
    console.error("Update workflow error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * PATCH /api/helper/workflows
 * Toggle workflow active status
 */
export async function PATCH(req: NextRequest) {
  const userRes = await requireUser(req);
  if (!userRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = userRes;

  try {
    const body = await req.json();
    const parsed = PatchWorkflowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { workspaceId, id, isActive } = parsed.data;

    const membership = await requireWorkspaceMember(user.id, workspaceId);
    if (!membership.ok) {
      return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
    }

    const db = supabaseAdmin();
    const { error } = await db
      .from("helper_workflows")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) {
      console.error("Failed to toggle workflow:", error);
      return NextResponse.json({ error: "Failed to toggle workflow" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Patch workflow error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * DELETE /api/helper/workflows
 * Delete a workflow
 */
export async function DELETE(req: NextRequest) {
  const userRes = await requireUser(req);
  if (!userRes.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = userRes;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const id = searchParams.get("id");

  if (!workspaceId || !id) {
    return NextResponse.json({ error: "workspaceId and id required" }, { status: 400 });
  }

  const membership = await requireWorkspaceMember(user.id, workspaceId);
  if (!membership.ok) {
    return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
  }

  const db = supabaseAdmin();
  const { error } = await db
    .from("helper_workflows")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error("Failed to delete workflow:", error);
    return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
