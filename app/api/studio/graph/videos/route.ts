import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import { supabaseServer } from "@/lib/supabase/server";
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

async function requireGraphAccess() {
  const ctx = await getAppContext();
  if (!ctx.user || !ctx.currentWorkspace) return null;

  const db = await supabaseServer();
  const { data: sub } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .maybeSingle();

  const plan = getPlanMeta(sub?.plan_id || "free_locked");
  const ents = ctx.effectiveEntitlements ?? [];
  const hasAccess = canAccess(
    { plan_id: plan.plan_id, is_admin: Boolean(ctx.profile?.is_admin), effectiveEntitlements: ents },
    "graph"
  );

  return hasAccess ? { ctx, db } : null;
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireGraphAccess();
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
    logger.error("Failed to fetch videos", { error, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ data, total: count ?? 0, page, limit });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireGraphAccess();
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
    logger.error("Failed to create video", { error, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  logger.info("Video created", { videoId: data.id, workspace: ctx.currentWorkspace!.id });
  return NextResponse.json({ data }, { status: 201 });
});
