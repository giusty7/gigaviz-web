import { NextRequest, NextResponse } from "next/server";
import { requireAdminWorkspace } from "@/lib/supabase/route";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id: conversationId } = await ctx.params;

  const { data, error } = await db
    .from("messages")
    .select("id, conversation_id, direction, text, ts, status")
    .eq("workspace_id", workspaceId)
    .eq("conversation_id", conversationId)
    .order("ts", { ascending: true });

  if (error) {
    return withCookies(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }

  const messages = (data ?? []).map((m: any) => ({
    id: m.id,
    conversationId: m.conversation_id,
    direction: m.direction,
    text: m.text,
    ts: m.ts,
    status: m.status ?? undefined,
  }));

  return withCookies(NextResponse.json({ messages }));
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id: conversationId } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const text = String(body?.text ?? "").trim();
  if (!text) {
    return withCookies(
      NextResponse.json({ error: "text_required" }, { status: 400 })
    );
  }

  const { data: inserted, error: insErr } = await db
    .from("messages")
    .insert({
      workspace_id: workspaceId,
      conversation_id: conversationId,
      direction: "out",
      text,
      status: "queued",
    })
    .select("id, conversation_id, direction, text, ts, status")
    .single();

  if (insErr) {
    return withCookies(
      NextResponse.json({ error: insErr.message }, { status: 500 })
    );
  }

  await db
    .from("conversations")
    .update({ last_message_at: inserted.ts })
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId);

  const msg = {
    id: inserted.id,
    conversationId: inserted.conversation_id,
    direction: inserted.direction,
    text: inserted.text,
    ts: inserted.ts,
    status: inserted.status ?? undefined,
  };

  return withCookies(NextResponse.json({ message: msg }));
}
