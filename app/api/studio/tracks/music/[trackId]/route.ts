import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudioAccess } from "@/lib/studio/require-access";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  genre: z.enum([
    "pop", "rock", "electronic", "ambient", "jazz", "classical",
    "hip-hop", "lo-fi", "cinematic", "jingle", "podcast-intro", "sound-effect",
  ]).optional(),
  prompt: z.string().max(4000).optional(),
  duration_seconds: z.number().int().min(5).max(600).optional(),
  bpm: z.number().int().min(40).max(300).optional(),
  key_signature: z.enum(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]).optional(),
  format: z.enum(["mp3", "wav", "ogg", "flac"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

type RouteContext = { params: Promise<{ trackId: string }> };

export const GET = withErrorHandler(
  async (_req: NextRequest, routeCtx: RouteContext) => {
    const { trackId } = await routeCtx.params;
    const auth = await requireStudioAccess("tracks");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ctx, db } = auth;
    const { data, error } = await db
      .from("tracks_music")
      .select("*")
      .eq("id", trackId)
      .eq("workspace_id", ctx.currentWorkspace!.id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  }
);

export const PATCH = withErrorHandler(
  async (req: NextRequest, routeCtx: RouteContext) => {
    const { trackId } = await routeCtx.params;
    const auth = await requireStudioAccess("tracks");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ctx, db } = auth;
    const body = await req.json();
    const validated = updateSchema.parse(body);

    const { data, error } = await db
      .from("tracks_music")
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq("id", trackId)
      .eq("workspace_id", ctx.currentWorkspace!.id)
      .select("id, title, genre, updated_at")
      .single();

    if (error || !data) return NextResponse.json({ error: "Update failed" }, { status: 404 });

    logger.info("Music updated", { trackId: data.id, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ data });
  }
);

export const DELETE = withErrorHandler(
  async (_req: NextRequest, routeCtx: RouteContext) => {
    const { trackId } = await routeCtx.params;
    const auth = await requireStudioAccess("tracks");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ctx, db } = auth;
    const { error } = await db
      .from("tracks_music")
      .delete()
      .eq("id", trackId)
      .eq("workspace_id", ctx.currentWorkspace!.id);

    if (error) {
      logger.error("Failed to delete music", { error, trackId });
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    logger.info("Music deleted", { trackId, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ success: true });
  }
);
