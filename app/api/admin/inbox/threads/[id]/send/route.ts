import { NextRequest, NextResponse } from "next/server";
import { requireAdminWorkspace } from "@/lib/supabase/route";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const text = String(body?.text ?? "").trim();
  if (!text) {
    return withCookies(NextResponse.json({ error: "text_required" }, { status: 400 }));
  }

  const { data: inserted, error: insErr } = await db
    .from("messages")
    .insert({
      workspace_id: workspaceId,
      conversation_id: id,
      direction: "out",
      text,
      status: "queued",
    })
    .select("id, conversation_id, direction, text, ts, status")
    .single();

  if (insErr) {
    return withCookies(NextResponse.json({ error: insErr.message }, { status: 500 }));
  }

  // update last_message_at
  await db
    .from("conversations")
    .update({ last_message_at: inserted.ts })
    .eq("workspace_id", workspaceId)
    .eq("id", id);

  const message = {
    id: inserted.id,
    conversationId: inserted.conversation_id,
    direction: inserted.direction,
    text: inserted.text,
    ts: inserted.ts,
    status: inserted.status ?? undefined,
  };

  return withCookies(NextResponse.json({ message }));
}
