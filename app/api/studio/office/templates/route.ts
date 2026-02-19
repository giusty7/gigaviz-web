import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { requireStudioAccess } from "@/lib/studio/require-access";

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  category: z.enum(["document", "spreadsheet", "presentation", "form", "workflow"]),
  template_json: z.unknown().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  is_public: z.boolean().optional(),
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireStudioAccess("office");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const category = url.searchParams.get("category") || "";
  const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 20), 1), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = db
    .from("office_templates")
    .select("id, title, slug, description, category, tags, is_public, usage_count, preview_url, updated_at", { count: "exact" })
    .or(`workspace_id.eq.${ctx.currentWorkspace!.id},is_public.eq.true`)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (q) query = query.ilike("title", `%${q}%`);
  if (category) query = query.eq("category", category);

  const { data, error, count } = await query;

  if (error) {
    logger.error("Failed to fetch templates", { error, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ data, total: count ?? 0, page, limit });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireStudioAccess("office");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const body = await req.json();
  const validated = createSchema.parse(body);

  const { data, error } = await db
    .from("office_templates")
    .insert({
      workspace_id: ctx.currentWorkspace!.id,
      title: validated.title,
      slug: slugify(validated.title),
      description: validated.description ?? null,
      category: validated.category,
      template_json: validated.template_json ?? {},
      tags: validated.tags ?? [],
      is_public: validated.is_public ?? false,
      created_by: ctx.user!.id,
    })
    .select("id, title, slug, category, created_at")
    .single();

  if (error) {
    logger.error("Failed to create template", { error, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  logger.info("Template created", { templateId: data.id, workspace: ctx.currentWorkspace!.id });
  return NextResponse.json({ data }, { status: 201 });
});
