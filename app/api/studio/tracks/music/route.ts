import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudioAccess } from "@/lib/studio/require-access";
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

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireStudioAccess("tracks");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ctx, db } = auth;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 20), 1), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = db
    .from("tracks_music")
    .select("id, title, genre, status, duration_seconds, bpm, tags, updated_at", { count: "exact" })
    .eq("workspace_id", ctx.currentWorkspace!.id)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error, count } = await query;

  if (error) {
    logger.error("Failed to fetch music", { error, workspace: ctx.currentWorkspace!.id });
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
