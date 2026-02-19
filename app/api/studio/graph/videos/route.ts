import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudioAccess } from "@/lib/studio/require-access";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  style: z.enum([
    "marketing", "explainer", "product-demo", "social-reel",
    "animation", "cinematic", "tutorial", "testimonial",
  ]),
  prompt: z.string().max(4000).optional(),
  duration_seconds: z.number().int().min(5).max(300).optional(),
  resolution: z.enum(["720p", "1080p", "4k"]).optional(),
  format: z.enum(["mp4", "webm", "mov"]).optional(),
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
    .from("graph_videos")
    .select("id, title, style, status, duration_seconds, tags, thumbnail_url, updated_at", { count: "exact" })
    .eq("workspace_id", ctx.currentWorkspace!.id)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error, count } = await query;

  if (error) {
    const isTableMissing = error.code === "42P01" || error.message?.includes("does not exist");
    logger.error("Failed to fetch videos", { error, workspace: ctx.currentWorkspace!.id });
    if (isTableMissing) {
      return NextResponse.json({ data: [], total: 0, page, limit, warning: "Studio media tables are being set up. Please run the database migration." });
    }
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
    .from("graph_videos")
    .insert({
      workspace_id: ctx.currentWorkspace!.id,
      title: validated.title,
      description: validated.description ?? "",
      style: validated.style,
      prompt: validated.prompt ?? "",
      duration_seconds: validated.duration_seconds ?? 30,
      resolution: validated.resolution ?? "1080p",
      format: validated.format ?? "mp4",
      tags: validated.tags ?? [],
      created_by: ctx.user!.id,
    })
    .select("id, title, style, created_at")
    .single();

  if (error) {
    const isTableMissing = error.code === "42P01" || error.message?.includes("does not exist");
    logger.error("Failed to create video", { error, workspace: ctx.currentWorkspace!.id });
    if (isTableMissing) {
      return NextResponse.json({ error: "Studio media tables need to be created. Please contact your administrator to apply the database migration (20260216200000_studio_media.sql)." }, { status: 503 });
    }
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  logger.info("Video created", { videoId: data.id, workspace: ctx.currentWorkspace!.id });
  return NextResponse.json({ data }, { status: 201 });
});
