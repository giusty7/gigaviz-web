import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  forbiddenResponse,
  getWorkspaceId,
  requireWorkspaceMember,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type MessageRow = {
  id: string;
  thread_id: string;
  direction: string | null;
  text_body: string | null;
  payload_json: Record<string, unknown> | null;
  wa_message_id: string | null;
  wa_timestamp: string | null;
  sent_at: string | null;
  created_at: string | null;
  from_wa_id: string | null;
  to_wa_id: string | null;
};

export async function GET(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const url = new URL(req.url);
  const threadId = url.searchParams.get("threadId");
  const workspaceParam = url.searchParams.get("workspaceId") ?? undefined;
  const workspaceId = getWorkspaceId(req, undefined, workspaceParam);
  if (!workspaceId || !threadId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok) {
    return forbiddenResponse(withCookies);
  }

  const db = supabaseAdmin();
  const { data: messages, error: messageError } = await db
    .from("wa_messages")
    .select(
      "id, thread_id, direction, text_body, payload_json, wa_message_id, wa_timestamp, sent_at, created_at, from_wa_id, to_wa_id"
    )
    .eq("workspace_id", workspaceId)
    .eq("thread_id", threadId)
    .limit(200);

  if (messageError) {
    return withCookies(
      NextResponse.json(
        { ok: false, error: "db_error", reason: "message_list_failed" },
        { status: 500 }
      )
    );
  }

  const { data: tags } = await db
    .from("wa_thread_tags")
    .select("tag")
    .eq("workspace_id", workspaceId)
    .eq("thread_id", threadId);

  const { data: notes } = await db
    .from("wa_thread_notes")
    .select("id, author_id, body, created_at")
    .eq("workspace_id", workspaceId)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(50);

  const normalizedMessages =
    messages?.map((m) => normalizeMessage(m as MessageRow)) ?? [];
  normalizedMessages.sort((a, b) => {
    const aKey = toSortKey(a.wa_timestamp ?? a.sent_at ?? a.created_at);
    const bKey = toSortKey(b.wa_timestamp ?? b.sent_at ?? b.created_at);
    return aKey - bKey;
  });

  return withCookies(
    NextResponse.json({
      ok: true,
      count: normalizedMessages.length,
      messages: normalizedMessages,
      tags: tags?.map((t) => t.tag) ?? [],
      notes: notes ?? [],
    })
  );
}

function normalizeMessage(message: MessageRow) {
  const payload = message.payload_json ?? {};
  const textBody =
    message.text_body ??
    extractText(payload) ??
    "[non-text message]";

  return {
    id: message.id,
    thread_id: message.thread_id,
    direction: message.direction ?? "inbound",
    text_body: textBody,
    payload_json: payload,
    content_json: payload,
    wa_message_id: message.wa_message_id,
    wa_timestamp: message.wa_timestamp,
    sent_at: message.sent_at,
    created_at: message.created_at,
    from_wa_id: message.from_wa_id,
    to_wa_id: message.to_wa_id,
  };
}

function extractText(payload: Record<string, unknown>) {
  const p = payload as {
    text?: { body?: string };
    entry?: Array<{
      changes?: Array<{
        value?: { messages?: Array<{ text?: { body?: string } }> };
      }>;
    }>;
  };

  if (p.text?.body) return p.text.body;
  const nested =
    p.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;
  return nested ?? null;
}

function toSortKey(value?: string | null) {
  if (!value) return 0;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
}
