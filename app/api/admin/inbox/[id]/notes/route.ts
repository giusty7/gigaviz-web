import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSupervisorWorkspace } from "@/lib/supabase/route";

type Ctx = { params: Promise<{ id: string }> };

type NoteRow = {
  id: string;
  conversation_id: string;
  body: string;
  created_at: string;
  author_user_id: string;
};

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id: conversationId } = await ctx.params;

  const { data, error } = await db
    .from("conversation_notes")
    .select("id, conversation_id, body, created_at, author_user_id")
    .eq("workspace_id", workspaceId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });

  if (error) {
    return withCookies(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }

  const notes = (data ?? []).map((n: NoteRow) => ({
    id: n.id,
    conversationId: n.conversation_id,
    text: n.body,
    ts: n.created_at,
    author: n.author_user_id,
  }));

  return withCookies(NextResponse.json({ notes }));
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id: conversationId } = await ctx.params;

  const body = (await req.json().catch(() => null)) as { text?: unknown } | null;
  const rawText = body && "text" in body ? body.text : "";
  const text = String(rawText ?? "").trim();

  if (!text) {
    return withCookies(
      NextResponse.json({ error: "text_required" }, { status: 400 })
    );
  }

  const { data: inserted, error } = await db
    .from("conversation_notes")
    .insert({
      workspace_id: workspaceId,
      conversation_id: conversationId,
      body: text,
      author_user_id: auth.user?.id ?? "00000000-0000-0000-0000-000000000000",
    })
    .select("id, conversation_id, body, created_at, author_user_id")
    .single();

  if (error) {
    return withCookies(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }

  const note = {
    id: inserted.id,
    conversationId: inserted.conversation_id,
    text: inserted.body,
    ts: inserted.created_at,
    author: inserted.author_user_id,
  };

  return withCookies(NextResponse.json({ note }));
}
