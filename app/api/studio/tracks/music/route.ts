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
  genre: z.enum([
    "pop", "rock", "electronic", "ambient", "jazz", "classical",
    "hip-hop", "lo-fi", "cinematic", "jingle", "podcast-intro", "sound-effect",
  ]),
  prompt: z.string().max(4000).optional(),
  duration_seconds: z.number().int().min(5).max(600).optional(),
  bpm: z.number().int().min(40).max(300).optional(),
  key_signature: z.enum(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]).optional(),
  format: z.enum(["mp3", "wav", "ogg", "flac"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

async function requireTracksAccess() {
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
    "tracks"
  );

  return hasAccess ? { ctx, db } : null;
}

export const GET = withErrorHandler(async () => {
  const auth = await requireTracksAccess();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const { data, error } = await db
    .from("tracks_music")
    .select("id, title, genre, status, duration_seconds, bpm, tags, updated_at")
    .eq("workspace_id", ctx.currentWorkspace!.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    logger.error("Failed to fetch music", { error, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ data });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireTracksAccess();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const body = await req.json();
  const validated = createSchema.parse(body);

  const { data, error } = await db
    .from("tracks_music")
    .insert({
      workspace_id: ctx.currentWorkspace!.id,
      title: validated.title,
      description: validated.description ?? "",
      genre: validated.genre,
      prompt: validated.prompt ?? "",
      duration_seconds: validated.duration_seconds ?? 30,
      bpm: validated.bpm ?? 120,
      key_signature: validated.key_signature ?? "C",
      format: validated.format ?? "mp3",
      tags: validated.tags ?? [],
      created_by: ctx.user!.id,
    })
    .select("id, title, genre, created_at")
    .single();

  if (error) {
    logger.error("Failed to create music", { error, workspace: ctx.currentWorkspace!.id });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  logger.info("Music created", { musicId: data.id, workspace: ctx.currentWorkspace!.id });
  return NextResponse.json({ data }, { status: 201 });
});
