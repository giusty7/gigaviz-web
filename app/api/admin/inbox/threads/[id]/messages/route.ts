import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSupervisorWorkspace } from "@/lib/supabase/route";

type Ctx = { params: Promise<{ id: string }> };

type MessageRow = {
  id: string;
  conversation_id: string;
  direction: "in" | "out";
  text: string;
  ts: string;
  status: string | null;
  wa_message_id: string | null;
  error_reason: string | null;
  media_url: string | null;
  media_mime: string | null;
  media_sha256: string | null;
};

type AttachmentRow = {
  id: string;
  message_id: string;
  kind: string;
  mime_type: string | null;
  file_name: string | null;
  size_bytes: number | null;
  url: string | null;
  storage_path: string | null;
  thumb_path: string | null;
};

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id: conversationId } = await ctx.params;

  const { data, error } = await db
    .from("messages")
    .select("id, conversation_id, direction, text, ts, status, wa_message_id, error_reason, media_url, media_mime, media_sha256")
    .eq("workspace_id", workspaceId)
    .eq("conversation_id", conversationId)
    .order("ts", { ascending: true });

  if (error) {
    return withCookies(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }

  const messageIds = (data ?? []).map((m: MessageRow) => m.id);
  const attachmentsByMessage: Record<string, AttachmentRow[]> = {};
  if (messageIds.length > 0) {
    const { data: attachments, error: aErr } = await db
      .from("message_attachments")
      .select("id, message_id, kind, mime_type, file_name, size_bytes, url, storage_path, thumb_path")
      .in("message_id", messageIds);

    if (!aErr && attachments) {
      (attachments as AttachmentRow[]).forEach((a) => {
        if (!attachmentsByMessage[a.message_id]) attachmentsByMessage[a.message_id] = [];
        attachmentsByMessage[a.message_id].push(a);
      });
    } else if (aErr) {
      console.log("ATTACHMENTS_SELECT_ERROR", aErr.message);
    }
  }

  const messages = (data ?? []).map((m: MessageRow) => ({
    id: m.id,
    conversationId: m.conversation_id,
    direction: m.direction,
    text: m.text,
    ts: m.ts,
    status: m.status ?? undefined,
    waMessageId: m.wa_message_id ?? undefined,
    errorReason: m.error_reason ?? undefined,
    mediaUrl: m.media_url ?? undefined,
    mediaMime: m.media_mime ?? undefined,
    mediaSha256: m.media_sha256 ?? undefined,
    attachments: (attachmentsByMessage[m.id] ?? []).map((a) => ({
      id: a.id,
      kind: a.kind,
      mimeType: a.mime_type ?? undefined,
      fileName: a.file_name ?? undefined,
      sizeBytes: a.size_bytes ?? undefined,
      url: a.url ?? undefined,
      requiresSign: Boolean(a.storage_path),
      hasThumb: Boolean(a.thumb_path),
    })),
  }));

  return withCookies(NextResponse.json({ messages }));
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

  const { data: inserted, error: insErr } = await db
    .from("messages")
    .insert({
      workspace_id: workspaceId,
      conversation_id: conversationId,
      direction: "out",
      text,
      status: "queued",
    })
    .select("id, conversation_id, direction, text, ts, status, wa_message_id, error_reason, media_url, media_mime, media_sha256")
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
    waMessageId: inserted.wa_message_id ?? undefined,
    errorReason: inserted.error_reason ?? undefined,
    mediaUrl: inserted.media_url ?? undefined,
    mediaMime: inserted.media_mime ?? undefined,
    mediaSha256: inserted.media_sha256 ?? undefined,
  };

  return withCookies(NextResponse.json({ message: msg }));
}
