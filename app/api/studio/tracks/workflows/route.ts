import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudioAccess } from "@/lib/studio/require-access";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

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

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireStudioAccess("tracks");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const status = url.searchParams.get("status") || "";
  const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 20), 1), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = db
    .from("tracks_workflows")
    .select("id, title, slug, status, runs_count, success_count, failure_count, updated_at", { count: "exact" })
    .eq("workspace_id", ctx.currentWorkspace!.id)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (q) query = query.ilike("title", `%${q}%`);
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;

  if (error) {
    logger.error("Failed to fetch workflows", { error, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ data, total: count ?? 0, page, limit });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireStudioAccess("tracks");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const body = await req.json();
  const validated = createSchema.parse(body);

  const { data, error } = await db
    .from("tracks_workflows")
    .insert({
      workspace_id: ctx.currentWorkspace!.id,
      title: validated.title,
      slug: slugify(validated.title),
      description: validated.description ?? null,
      steps_json: validated.steps_json ?? null,
      triggers_json: validated.triggers_json ?? null,
      estimated_tokens_per_run: validated.estimated_tokens_per_run ?? null,
      status: "draft",
      created_by: ctx.user!.id,
    })
    .select("id, title, slug, status, created_at")
    .single();

  if (error) {
    logger.error("Failed to create workflow", { error, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  logger.info("Workflow created", { workflowId: data.id, workspace: ctx.currentWorkspace!.id });
  return NextResponse.json({ data }, { status: 201 });
});
