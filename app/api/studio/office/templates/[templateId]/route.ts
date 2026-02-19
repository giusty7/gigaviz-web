import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { requireStudioAccess } from "@/lib/studio/require-access";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  category: z.enum(["document", "spreadsheet", "presentation", "form", "workflow"]).optional(),
  template_json: z.unknown().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  is_public: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ templateId: string }> };

export const GET = withErrorHandler(async (_req: NextRequest, { params }: RouteContext) => {
  const auth = await requireStudioAccess("office");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const { templateId } = await params;

  const { data, error } = await db
    .from("office_templates")
    .select("*")
    .eq("id", templateId)
    .or(`workspace_id.eq.${ctx.currentWorkspace!.id},is_public.eq.true`)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
});

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: RouteContext) => {
  const auth = await requireStudioAccess("office");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const { templateId } = await params;
  const body = await req.json();
  const validated = updateSchema.parse(body);

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (validated.title !== undefined) updateData.title = validated.title;
  if (validated.description !== undefined) updateData.description = validated.description;
  if (validated.category !== undefined) updateData.category = validated.category;
  if (validated.template_json !== undefined) updateData.template_json = validated.template_json;
  if (validated.tags !== undefined) updateData.tags = validated.tags;
  if (validated.is_public !== undefined) updateData.is_public = validated.is_public;

  const { data, error } = await db
    .from("office_templates")
    .update(updateData)
    .eq("id", templateId)
    .eq("workspace_id", ctx.currentWorkspace!.id)
    .select("id, title, slug, category, is_public, updated_at")
    .single();

  if (error || !data) {
    logger.error("Failed to update template", { error, templateId, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ error: "Template not found or update failed" }, { status: 404 });
  }

  logger.info("Template updated", { templateId: data.id, workspace: ctx.currentWorkspace!.id });
  return NextResponse.json({ data });
});

export const DELETE = withErrorHandler(async (_req: NextRequest, { params }: RouteContext) => {
  const auth = await requireStudioAccess("office");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const { templateId } = await params;

  const { error } = await db
    .from("office_templates")
    .delete()
    .eq("id", templateId)
    .eq("workspace_id", ctx.currentWorkspace!.id);

  if (error) {
    logger.error("Failed to delete template", { error, templateId, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  logger.info("Template deleted", { templateId, workspace: ctx.currentWorkspace!.id });
  return NextResponse.json({ success: true });
});
