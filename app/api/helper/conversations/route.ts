import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
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
}

export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, user, withCookies } = guard;

  const body = await req.json().catch(() => ({}));
  const title = (body?.title as string | undefined)?.trim() || "New chat";

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
}
