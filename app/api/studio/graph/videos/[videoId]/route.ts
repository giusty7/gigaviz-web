import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  style: z.enum([
    "marketing", "explainer", "product-demo", "social-reel",
    "animation", "cinematic", "tutorial", "testimonial",
  ]).optional(),
  prompt: z.string().max(4000).optional(),
  duration_seconds: z.number().int().min(5).max(300).optional(),
  resolution: z.enum(["720p", "1080p", "4k"]).optional(),
  format: z.enum(["mp4", "webm", "mov"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

type RouteContext = { params: Promise<{ videoId: string }> };

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

export const GET = withErrorHandler(
  async (_req: NextRequest, routeCtx: RouteContext) => {
    const { videoId } = await routeCtx.params;
    const auth = await requireGraphAccess();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ctx, db } = auth;
    const { data, error } = await db
      .from("graph_videos")
      .select("*")
      .eq("id", videoId)
      .eq("workspace_id", ctx.currentWorkspace!.id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  }
);

export const PATCH = withErrorHandler(
  async (req: NextRequest, routeCtx: RouteContext) => {
    const { videoId } = await routeCtx.params;
    const auth = await requireGraphAccess();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ctx, db } = auth;
    const body = await req.json();
    const validated = updateSchema.parse(body);

    const { data, error } = await db
      .from("graph_videos")
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq("id", videoId)
      .eq("workspace_id", ctx.currentWorkspace!.id)
      .select("id, title, style, updated_at")
      .single();

    if (error || !data) return NextResponse.json({ error: "Update failed" }, { status: 404 });

    logger.info("Video updated", { videoId: data.id, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ data });
  }
);

export const DELETE = withErrorHandler(
  async (_req: NextRequest, routeCtx: RouteContext) => {
    const { videoId } = await routeCtx.params;
    const auth = await requireGraphAccess();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ctx, db } = auth;
    const { error } = await db
      .from("graph_videos")
      .delete()
      .eq("id", videoId)
      .eq("workspace_id", ctx.currentWorkspace!.id);

    if (error) {
      logger.error("Failed to delete video", { error, videoId });
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    logger.info("Video deleted", { videoId, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ success: true });
  }
);
