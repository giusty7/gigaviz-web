import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrSupervisorWorkspace } from "@/lib/supabase/route";
import { buildMessageSearchQuery, mergeConversationIds } from "@/lib/inbox/search";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

/** Sanitize user input for use in PostgREST ilike/or filters (escape %, _, \) */
function sanitizeIlike(input: string): string {
  return input.replace(/[%_\\]/g, (ch) => `\\${ch}`);
}

const threadQuerySchema = z.object({
  q: z.string().max(200).optional().default(""),
  status: z.enum(["all", "open", "pending", "resolved", "closed", "snoozed"]).optional().default("all"),
  agent: z.string().max(100).optional().default("all"),
  tag: z.string().max(100).optional().default(""),
  priority: z.enum(["all", "low", "normal", "high", "urgent"]).optional().default("all"),
  archived: z.enum(["true", "false"]).optional(),
  pinned: z.enum(["true", "false"]).optional(),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  try {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { searchParams } = req.nextUrl;

  const parsed = threadQuerySchema.safeParse({
    q: searchParams.get("q")?.trim() || "",
    status: searchParams.get("status") || "all",
    agent: searchParams.get("agent") || "all",
    tag: searchParams.get("tag")?.trim() || "",
    priority: searchParams.get("priority") || "all",
    archived: searchParams.get("archived") ?? undefined,
    pinned: searchParams.get("pinned") ?? undefined,
  });

  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ error: "invalid_params", issues: parsed.error.flatten() }, { status: 400 })
    );
  }

  const { q, status, agent, tag, priority, archived: archivedParam, pinned: pinnedParam } = parsed.data;

  let contactIds: string[] | null = null;
  if (q || tag) {
    let contactQuery = db
      .from("contacts")
      .select("id")
      .eq("workspace_id", workspaceId);

    if (q) {
      const safeQ = sanitizeIlike(q);
      contactQuery = contactQuery.or(`name.ilike.%${safeQ}%,phone.ilike.%${safeQ}%`);
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
        .ilike("text", `%${sanitizeIlike(q)}%`);

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
        id, name, phone, tags, last_seen_at, comms_status, opted_in, opted_in_at, opt_in_source, opted_out, opted_out_at, opt_out_reason
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
  } catch (err) {
    logger.error("admin/inbox/threads GET error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
