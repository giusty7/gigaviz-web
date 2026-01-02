import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSupervisorWorkspace } from "@/lib/supabase/route";
import { buildMessageSearchQuery, mergeConversationIds } from "@/lib/inbox/search";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdminOrSupervisorWorkspace(req);
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

    type ContactIdRow = { id: string };
    contactIds = (contacts ?? []).map((c: ContactIdRow) => c.id);
  }

  let contactConversationIds: string[] | null = null;
  if (contactIds && contactIds.length > 0) {
    const { data: convs, error: convErr } = await db
      .from("conversations")
      .select("id")
      .eq("workspace_id", workspaceId)
      .in("contact_id", contactIds);

    if (convErr) {
      return withCookies(
        NextResponse.json({ error: convErr.message }, { status: 500 })
      );
    }

    contactConversationIds = (convs ?? []).map((c: { id: string }) => c.id);
  }

  let messageConversationIds: string[] | null = null;
  const searchQuery = buildMessageSearchQuery(q);
  if (searchQuery) {
    const { data: msgs, error: msgErr } = await db
      .from("messages")
      .select("conversation_id")
      .eq("workspace_id", workspaceId)
      .textSearch("search_tsv", searchQuery, { type: "plain", config: "simple" });

    if (msgErr) {
      const { data: fallbackMsgs, error: fallbackErr } = await db
        .from("messages")
        .select("conversation_id")
        .eq("workspace_id", workspaceId)
        .ilike("text", `%${q}%`);

      if (fallbackErr) {
        return withCookies(
          NextResponse.json({ error: fallbackErr.message }, { status: 500 })
        );
      }

      messageConversationIds = (fallbackMsgs ?? [])
        .map((m: { conversation_id: string | null }) => m.conversation_id)
        .filter((id): id is string => Boolean(id));
    } else {
      messageConversationIds = (msgs ?? [])
        .map((m: { conversation_id: string | null }) => m.conversation_id)
        .filter((id): id is string => Boolean(id));
    }
  }

  const conversationIds = mergeConversationIds(
    contactConversationIds,
    messageConversationIds
  );
  if ((q || tag) && conversationIds.length === 0) {
    return withCookies(NextResponse.json({ items: [] }));
  }

  let query = db
    .from("conversations")
    .select(
      `
      id,
      contact_id,
      assigned_to,
      assigned_member_id,
      ticket_status,
      priority,
      unread_count,
      last_message_at,
      next_response_due_at,
      resolution_due_at,
      sla_status,
      last_customer_message_at,
      team_id,
      category_id,
      is_archived,
      pinned,
      snoozed_until,
      last_read_at,
      contact:contacts (
        id, name, phone, tags, last_seen_at, comms_status
      )
    `
    )
    .eq("workspace_id", workspaceId);

  if (conversationIds.length > 0) query = query.in("id", conversationIds);
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
