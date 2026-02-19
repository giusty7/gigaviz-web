import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudioAccess } from "@/lib/studio/require-access";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  style: z.enum([
    "photo-realistic", "illustration", "3d-render", "watercolor",
    "pixel-art", "abstract", "flat-design", "anime", "logo", "icon",
  ]).optional(),
  prompt: z.string().max(4000).optional(),
  negative_prompt: z.string().max(2000).optional(),
  width: z.number().int().min(256).max(4096).optional(),
  height: z.number().int().min(256).max(4096).optional(),
  format: z.enum(["png", "jpg", "webp", "svg"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

type RouteContext = { params: Promise<{ imageId: string }> };

export const GET = withErrorHandler(
  async (_req: NextRequest, routeCtx: RouteContext) => {
    const { imageId } = await routeCtx.params;
    const auth = await requireStudioAccess("graph");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ctx, db } = auth;
    const { data, error } = await db
      .from("graph_images")
      .select("*")
      .eq("id", imageId)
      .eq("workspace_id", ctx.currentWorkspace!.id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  }
);

export const PATCH = withErrorHandler(
  async (req: NextRequest, routeCtx: RouteContext) => {
    const { imageId } = await routeCtx.params;
    const auth = await requireStudioAccess("graph");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ctx, db } = auth;
    const body = await req.json();
    const validated = updateSchema.parse(body);

    const { data, error } = await db
      .from("graph_images")
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq("id", imageId)
      .eq("workspace_id", ctx.currentWorkspace!.id)
      .select("id, title, style, updated_at")
      .single();

    if (error || !data) return NextResponse.json({ error: "Update failed" }, { status: 404 });

    logger.info("Image updated", { imageId: data.id, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ data });
  }
);

export const DELETE = withErrorHandler(
  async (_req: NextRequest, routeCtx: RouteContext) => {
    const { imageId } = await routeCtx.params;
    const auth = await requireStudioAccess("graph");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ctx, db } = auth;
    const { error } = await db
      .from("graph_images")
      .delete()
      .eq("id", imageId)
      .eq("workspace_id", ctx.currentWorkspace!.id);

    if (error) {
      logger.error("Failed to delete image", { error, imageId });
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    logger.info("Image deleted", { imageId, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ success: true });
  }
);
