import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";

const createConversationSchema = z.object({
  title: z.string().max(200).optional(),
});

export async function GET(req: NextRequest) {
  try {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  const url = new URL(req.url);
  const query = url.searchParams.get("q")?.trim();

  const db = supabaseAdmin();
  let builder = db
    .from("helper_conversations")
    .select("id, title, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (query) {
    builder = builder.ilike("title", `%${query}%`);
  }

  const { data, error } = await builder;
  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, conversations: data ?? [] }));
  } catch (err) {
    logger.error("helper/conversations GET error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, user, withCookies } = guard;

  const body = await req.json().catch(() => ({}));
  const parsed = createConversationSchema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ ok: false, error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 })
    );
  }
  const title = parsed.data.title?.trim() || "New chat";

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("helper_conversations")
    .insert({
      workspace_id: workspaceId,
      created_by: user.id,
      title,
      updated_at: new Date().toISOString(),
    })
    .select("id, title, created_at, updated_at")
    .maybeSingle();

  if (error || !data) {
    return withCookies(
      NextResponse.json({ ok: false, error: error?.message ?? "Failed to create" }, { status: 500 })
    );
  }

  return withCookies(NextResponse.json({ ok: true, conversation: data }));
  } catch (err) {
    logger.error("helper/conversations POST error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
