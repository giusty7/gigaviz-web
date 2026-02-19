import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudioAccess } from "@/lib/studio/require-access";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  category: z.enum(["document", "spreadsheet", "presentation", "form", "workflow", "invoice", "report"]).optional(),
  content_json: z.unknown().optional(),
});

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

export const GET = withErrorHandler(async (_req: NextRequest, routeCtx: RouteContext) => {
  const { documentId } = await routeCtx.params;
  const auth = await requireStudioAccess("office");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const { data, error } = await db
    .from("office_documents")
    .select("*")
    .eq("id", documentId)
    .eq("workspace_id", ctx.currentWorkspace!.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
});

export const PATCH = withErrorHandler(async (req: NextRequest, routeCtx: RouteContext) => {
  const { documentId } = await routeCtx.params;
  const auth = await requireStudioAccess("office");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const body = await req.json();
  const validated = updateSchema.parse(body);

  const { data, error } = await db
    .from("office_documents")
    .update({
      ...validated,
      last_edited_by: ctx.user!.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("workspace_id", ctx.currentWorkspace!.id)
    .select("id, title, category, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found or update failed" }, { status: 404 });
  }

  logger.info("Document updated", { docId: data.id, workspace: ctx.currentWorkspace!.id });
  return NextResponse.json({ data });
});

export const DELETE = withErrorHandler(async (_req: NextRequest, routeCtx: RouteContext) => {
  const { documentId } = await routeCtx.params;
  const auth = await requireStudioAccess("office");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const { error } = await db
    .from("office_documents")
    .delete()
    .eq("id", documentId)
    .eq("workspace_id", ctx.currentWorkspace!.id);

  if (error) {
    logger.error("Failed to delete document", { error, documentId });
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  logger.info("Document deleted", { docId: documentId, workspace: ctx.currentWorkspace!.id });
  return NextResponse.json({ success: true });
});
