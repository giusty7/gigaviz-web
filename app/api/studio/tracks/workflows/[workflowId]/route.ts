import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudioAccess } from "@/lib/studio/require-access";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["draft", "active", "paused", "archived"]).optional(),
  steps_json: z.unknown().optional(),
  triggers_json: z.unknown().optional(),
  estimated_tokens_per_run: z.number().positive().optional(),
});

type RouteContext = { params: Promise<{ workflowId: string }> };

export const GET = withErrorHandler(
  async (_req: NextRequest, routeCtx: RouteContext) => {
    const { workflowId } = await routeCtx.params;
    const auth = await requireStudioAccess("tracks");
    if (!auth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ctx, db } = auth;
    const { data, error } = await db
      .from("tracks_workflows")
      .select("*")
      .eq("id", workflowId)
      .eq("workspace_id", ctx.currentWorkspace!.id)
      .single();

    if (error || !data)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data });
  }
);

export const PATCH = withErrorHandler(
  async (req: NextRequest, routeCtx: RouteContext) => {
    const { workflowId } = await routeCtx.params;
    const auth = await requireStudioAccess("tracks");
    if (!auth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ctx, db } = auth;
    const body = await req.json();
    const validated = updateSchema.parse(body);

    const { data, error } = await db
      .from("tracks_workflows")
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq("id", workflowId)
      .eq("workspace_id", ctx.currentWorkspace!.id)
      .select("id, title, slug, status, updated_at")
      .single();

    if (error || !data)
      return NextResponse.json({ error: "Update failed" }, { status: 404 });

    logger.info("Workflow updated", {
      workflowId: data.id,
      workspace: ctx.currentWorkspace!.id,
    });
    return NextResponse.json({ data });
  }
);

export const DELETE = withErrorHandler(
  async (_req: NextRequest, routeCtx: RouteContext) => {
    const { workflowId } = await routeCtx.params;
    const auth = await requireStudioAccess("tracks");
    if (!auth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ctx, db } = auth;
    const { error } = await db
      .from("tracks_workflows")
      .delete()
      .eq("id", workflowId)
      .eq("workspace_id", ctx.currentWorkspace!.id);

    if (error) {
      logger.error("Failed to delete workflow", { error, workflowId });
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    logger.info("Workflow deleted", {
      workflowId,
      workspace: ctx.currentWorkspace!.id,
    });
    return NextResponse.json({ success: true });
  }
);
