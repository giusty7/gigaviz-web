import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";

const createSchema = z.object({
  title: z.string().min(1).max(255),
  category: z.enum(["document", "spreadsheet", "presentation", "invoice", "report"]),
  ai_prompt: z.string().max(4096).optional(),
  template_id: z.string().uuid().optional(),
  content_json: z.unknown().optional(),
});

export async function GET() {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await supabaseServer();
    const { data, error } = await db
      .from("office_documents")
      .select("id, title, category, updated_at, created_at")
      .eq("workspace_id", ctx.currentWorkspace.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("Failed to fetch documents", { error, workspace: ctx.currentWorkspace.id });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("GET /api/studio/office/documents error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createSchema.parse(body);

    const db = await supabaseServer();
    const { data, error } = await db
      .from("office_documents")
      .insert({
        workspace_id: ctx.currentWorkspace.id,
        title: validated.title,
        category: validated.category,
        content_json: validated.content_json ?? null,
        template_id: validated.template_id ?? null,
        created_by: ctx.user.id,
        last_edited_by: ctx.user.id,
      })
      .select("id, title, category, created_at")
      .single();

    if (error) {
      logger.error("Failed to create document", { error, workspace: ctx.currentWorkspace.id });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    logger.info("Document created", { docId: data.id, workspace: ctx.currentWorkspace.id });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    logger.error("POST /api/studio/office/documents error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
