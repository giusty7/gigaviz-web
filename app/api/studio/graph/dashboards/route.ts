import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudioAccess } from "@/lib/studio/require-access";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  prompt: z.string().max(4000).optional(),
  is_public: z.boolean().optional(),
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireStudioAccess("graph");
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 20), 1), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = db
    .from("graph_dashboards")
    .select("id, title, slug, description, is_public, updated_at", { count: "exact" })
    .eq("workspace_id", ctx.currentWorkspace!.id)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error, count } = await query;

  if (error) {
    logger.error("Failed to fetch dashboards", {
      error,
      workspace: ctx.currentWorkspace!.id,
    });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ data, total: count ?? 0, page, limit });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireStudioAccess("graph");
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const body = await req.json();
  const validated = createSchema.parse(body);

  const { data, error } = await db
    .from("graph_dashboards")
    .insert({
      workspace_id: ctx.currentWorkspace!.id,
      title: validated.title,
      slug: slugify(validated.title),
      description: validated.description ?? null,
      is_public: validated.is_public ?? false,
      prompt: validated.prompt ?? null,
      created_by: ctx.user!.id,
    })
    .select("id, title, slug, created_at")
    .single();

  if (error) {
    logger.error("Failed to create dashboard", {
      error,
      workspace: ctx.currentWorkspace!.id,
    });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  logger.info("Dashboard created", {
    dashboardId: data.id,
    workspace: ctx.currentWorkspace!.id,
  });
  return NextResponse.json({ data }, { status: 201 });
});
