import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  chart_type: z.enum(["bar", "line", "pie", "area", "scatter", "radar", "heatmap"]),
  config_json: z.unknown().optional(),
  data_source: z.enum(["manual", "api", "database", "csv"]).optional(),
  data_json: z.unknown().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export async function GET() {
  try {
    const ctx = await getAppContext();
    if (!ctx.user || !ctx.currentWorkspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await supabaseServer();
    const { data, error } = await db
      .from("graph_charts")
      .select("id, title, chart_type, tags, data_source, updated_at")
      .eq("workspace_id", ctx.currentWorkspace.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("Failed to fetch charts", { error, workspace: ctx.currentWorkspace.id });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("GET /api/studio/graph/charts error", { error: err });
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
      .from("graph_charts")
      .insert({
        workspace_id: ctx.currentWorkspace.id,
        title: validated.title,
        description: validated.description ?? null,
        chart_type: validated.chart_type,
        config_json: validated.config_json ?? null,
        data_source: validated.data_source ?? "manual",
        data_json: validated.data_json ?? null,
        tags: validated.tags ?? [],
        created_by: ctx.user.id,
      })
      .select("id, title, chart_type, created_at")
      .single();

    if (error) {
      logger.error("Failed to create chart", { error, workspace: ctx.currentWorkspace.id });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    logger.info("Chart created", { chartId: data.id, workspace: ctx.currentWorkspace.id });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    logger.error("POST /api/studio/graph/charts error", { error: err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
