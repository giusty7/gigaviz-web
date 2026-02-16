import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  steps_json: z.unknown().optional(),
  triggers_json: z.unknown().optional(),
  estimated_tokens_per_run: z.number().positive().optional(),
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

export async function GET() {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await supabaseServer();
    const { data, error } = await db
      .from("tracks_workflows")
      .select("id, title, slug, status, runs_count, success_count, failure_count, updated_at")
      .eq("workspace_id", ctx.currentWorkspace.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("Failed to fetch workflows", { error, workspace: ctx.currentWorkspace.id });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("GET /api/studio/tracks/workflows error", { error: err });
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
      .from("tracks_workflows")
      .insert({
        workspace_id: ctx.currentWorkspace.id,
        title: validated.title,
        slug: slugify(validated.title),
        description: validated.description ?? null,
        steps_json: validated.steps_json ?? null,
        triggers_json: validated.triggers_json ?? null,
        estimated_tokens_per_run: validated.estimated_tokens_per_run ?? null,
        status: "draft",
        created_by: ctx.user.id,
      })
      .select("id, title, slug, status, created_at")
      .single();

    if (error) {
      logger.error("Failed to create workflow", { error, workspace: ctx.currentWorkspace.id });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    logger.info("Workflow created", { workflowId: data.id, workspace: ctx.currentWorkspace.id });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    logger.error("POST /api/studio/tracks/workflows error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
