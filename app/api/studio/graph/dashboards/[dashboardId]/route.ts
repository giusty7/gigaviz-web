import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudioAccess } from "@/lib/studio/require-access";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  is_public: z.boolean().optional(),
  layout_json: z.unknown().optional(),
});

type RouteContext = { params: Promise<{ dashboardId: string }> };

export const GET = withErrorHandler(
  async (_req: NextRequest, routeCtx: RouteContext) => {
    const { dashboardId } = await routeCtx.params;
    const auth = await requireStudioAccess("graph");
    if (!auth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ctx, db } = auth;
    const { data, error } = await db
      .from("graph_dashboards")
      .select("*")
      .eq("id", dashboardId)
      .eq("workspace_id", ctx.currentWorkspace!.id)
      .single();

    if (error || !data)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data });
  }
);

export const PATCH = withErrorHandler(
  async (req: NextRequest, routeCtx: RouteContext) => {
    const { dashboardId } = await routeCtx.params;
    const auth = await requireStudioAccess("graph");
    if (!auth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ctx, db } = auth;
    const body = await req.json();
    const validated = updateSchema.parse(body);

    const { data, error } = await db
      .from("graph_dashboards")
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq("id", dashboardId)
      .eq("workspace_id", ctx.currentWorkspace!.id)
      .select("id, title, slug, updated_at")
      .single();

    if (error || !data)
      return NextResponse.json({ error: "Update failed" }, { status: 404 });

    logger.info("Dashboard updated", {
      dashboardId: data.id,
      workspace: ctx.currentWorkspace!.id,
    });
    return NextResponse.json({ data });
  }
);

export const DELETE = withErrorHandler(
  async (_req: NextRequest, routeCtx: RouteContext) => {
    const { dashboardId } = await routeCtx.params;
    const auth = await requireStudioAccess("graph");
    if (!auth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ctx, db } = auth;
    const { error } = await db
      .from("graph_dashboards")
      .delete()
      .eq("id", dashboardId)
      .eq("workspace_id", ctx.currentWorkspace!.id);

    if (error) {
      logger.error("Failed to delete dashboard", { error, dashboardId });
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    logger.info("Dashboard deleted", {
      dashboardId,
      workspace: ctx.currentWorkspace!.id,
    });
    return NextResponse.json({ success: true });
  }
);
