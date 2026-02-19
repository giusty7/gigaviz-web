import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudioAccess } from "@/lib/studio/require-access";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  style: z.enum([
    "photo-realistic", "illustration", "3d-render", "watercolor",
    "pixel-art", "abstract", "flat-design", "anime", "logo", "icon",
  ]),
  prompt: z.string().max(4000).optional(),
  negative_prompt: z.string().max(2000).optional(),
  width: z.number().int().min(256).max(4096).optional(),
  height: z.number().int().min(256).max(4096).optional(),
  format: z.enum(["png", "jpg", "webp", "svg"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireStudioAccess("graph");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 20), 1), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = db
    .from("graph_images")
    .select("id, title, style, status, tags, thumbnail_url, updated_at", { count: "exact" })
    .eq("workspace_id", ctx.currentWorkspace!.id)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error, count } = await query;

  if (error) {
    logger.error("Failed to fetch images", { error, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ data, total: count ?? 0, page, limit });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireStudioAccess("graph");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const body = await req.json();
  const validated = createSchema.parse(body);

  const { data, error } = await db
    .from("graph_images")
    .insert({
      workspace_id: ctx.currentWorkspace!.id,
      title: validated.title,
      description: validated.description ?? "",
      style: validated.style,
      prompt: validated.prompt ?? "",
      negative_prompt: validated.negative_prompt ?? "",
      width: validated.width ?? 1024,
      height: validated.height ?? 1024,
      format: validated.format ?? "png",
      tags: validated.tags ?? [],
      created_by: ctx.user!.id,
    })
    .select("id, title, style, created_at")
    .single();

  if (error) {
    logger.error("Failed to create image", { error, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  logger.info("Image created", { imageId: data.id, workspace: ctx.currentWorkspace!.id });
  return NextResponse.json({ data }, { status: 201 });
});
