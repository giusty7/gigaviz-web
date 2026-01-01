import { NextRequest, NextResponse } from "next/server";
import { requireAdminWorkspace } from "@/lib/supabase/route";

type Ctx = { params: Promise<{ id: string }> };

type NoteRow = {
  id: string;
  conversation_id: string;
  text: string;
  ts: string;
  author: string;
};

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id: conversationId } = await ctx.params;

  const { data, error } = await db
    .from("notes")
    .select("id, conversation_id, text, ts, author")
    .eq("workspace_id", workspaceId)
    .eq("conversation_id", conversationId)
    .order("ts", { ascending: false });

  if (error) {
    return withCookies(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }

  const notes = (data ?? []).map((n: NoteRow) => ({
    id: n.id,
    conversationId: n.conversation_id,
    text: n.text,
    ts: n.ts,
    author: n.author,
  }));

  return withCookies(NextResponse.json({ notes }));
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id: conversationId } = await ctx.params;

  const body = (await req.json().catch(() => null)) as {
    text?: unknown;
    author?: unknown;
  } | null;
  const rawText = body && "text" in body ? body.text : "";
  const rawAuthor = body && "author" in body ? body.author : "Giusty";
  const text = String(rawText ?? "").trim();
  const author = String(rawAuthor ?? "Giusty").trim() || "Giusty";

  if (!text) {
    return withCookies(
      NextResponse.json({ error: "text_required" }, { status: 400 })
    );
  }

  const { data: inserted, error } = await db
    .from("notes")
    .insert({
      workspace_id: workspaceId,
      conversation_id: conversationId,
      text,
      author,
    })
    .select("id, conversation_id, text, ts, author")
    .single();

  if (error) {
    return withCookies(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }

  const note = {
    id: inserted.id,
    conversationId: inserted.conversation_id,
    text: inserted.text,
    ts: inserted.ts,
    author: inserted.author,
  };

  return withCookies(NextResponse.json({ note }));
}
