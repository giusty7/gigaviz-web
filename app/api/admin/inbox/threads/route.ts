import { NextRequest, NextResponse } from "next/server";
import { requireAdminWorkspace } from "@/lib/supabase/route";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;

  const { data, error } = await db
    .from("conversations")
    .select(
      `
      id,
      contact_id,
      assigned_to,
      ticket_status,
      priority,
      unread_count,
      last_message_at,
      contact:contacts (
        id, name, phone, tags, last_seen_at
      )
    `
    )
    .eq("workspace_id", workspaceId)
    .order("last_message_at", { ascending: false });

  if (error) {
    return withCookies(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }

  // debug kecil (aman, tapi kalo dak mau hapus bae)
  if ((data ?? []).length === 0 && process.env.NODE_ENV !== "production") {
    const { count: total } = await db
      .from("conversations")
      .select("id", { count: "exact", head: true });

    const { count: wsCount } = await db
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    return withCookies(
      NextResponse.json({
        items: [],
        _debug: { workspaceId, totalConversations: total ?? 0, wsConversations: wsCount ?? 0 },
      })
    );
  }

  return withCookies(NextResponse.json({ items: data ?? [] }));
}
