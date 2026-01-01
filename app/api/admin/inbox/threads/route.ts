import { NextRequest, NextResponse } from "next/server";
import { requireAdminWorkspace } from "@/lib/supabase/route";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { searchParams } = req.nextUrl;

  const q = searchParams.get("q")?.trim() || "";
  const status = searchParams.get("status") || "all";
  const agent = searchParams.get("agent") || "all";
  const tag = searchParams.get("tag")?.trim() || "";
  const priority = searchParams.get("priority") || "all";
  const archivedParam = searchParams.get("archived");
  const pinnedParam = searchParams.get("pinned");

  let contactIds: string[] | null = null;
  if (q || tag) {
    let contactQuery = db
      .from("contacts")
      .select("id")
      .eq("workspace_id", workspaceId);

    if (q) {
      contactQuery = contactQuery.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);
    }
    if (tag) {
      contactQuery = contactQuery.contains("tags", [tag]);
    }

    const { data: contacts, error: cErr } = await contactQuery;
    if (cErr) {
      return withCookies(
        NextResponse.json({ error: cErr.message }, { status: 500 })
      );
    }

    contactIds = (contacts ?? []).map((c: any) => c.id);
    if (contactIds.length === 0) {
      return withCookies(NextResponse.json({ items: [] }));
    }
  }

  let query = db
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
      is_archived,
      pinned,
      snoozed_until,
      last_read_at,
      contact:contacts (
        id, name, phone, tags, last_seen_at
      )
    `
    )
    .eq("workspace_id", workspaceId);

  if (contactIds) query = query.in("contact_id", contactIds);
  if (status !== "all") query = query.eq("ticket_status", status);
  if (priority !== "all") query = query.eq("priority", priority);

  if (agent !== "all") {
    if (agent === "unassigned") query = query.is("assigned_to", null);
    else query = query.eq("assigned_to", agent);
  }

  if (archivedParam === "true") query = query.eq("is_archived", true);
  if (archivedParam === "false") query = query.eq("is_archived", false);
  if (pinnedParam === "true") query = query.eq("pinned", true);
  if (pinnedParam === "false") query = query.eq("pinned", false);

  const { data, error } = await query
    .order("pinned", { ascending: false })
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
