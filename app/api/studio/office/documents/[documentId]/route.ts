import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  category: z.enum(["document", "spreadsheet", "presentation", "invoice", "report"]).optional(),
  content_json: z.unknown().optional(),
});

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { documentId } = await ctx.params;
    const appCtx = await getAppContext();
    if (!appCtx.user || !appCtx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await supabaseServer();
    const { data, error } = await db
      .from("office_documents")
      .select("*")
      .eq("id", documentId)
      .eq("workspace_id", appCtx.currentWorkspace.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("GET /api/studio/office/documents/[id] error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { documentId } = await ctx.params;
    const appCtx = await getAppContext();
    if (!appCtx.user || !appCtx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = updateSchema.parse(body);

    const db = await supabaseServer();
    const { data, error } = await db
      .from("office_documents")
      .update({
        ...validated,
        last_edited_by: appCtx.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("workspace_id", appCtx.currentWorkspace.id)
      .select("id, title, category, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found or update failed" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    logger.error("PATCH /api/studio/office/documents/[id] error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const { documentId } = await ctx.params;
    const appCtx = await getAppContext();
    if (!appCtx.user || !appCtx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await supabaseServer();
    const { error } = await db
      .from("office_documents")
      .delete()
      .eq("id", documentId)
      .eq("workspace_id", appCtx.currentWorkspace.id);

    if (error) {
      logger.error("Failed to delete document", { error, documentId });
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("DELETE /api/studio/office/documents/[id] error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
