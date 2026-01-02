import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSupervisorWorkspace } from "@/lib/supabase/route";

export const runtime = "nodejs";

type SignBody = {
  attachmentIds?: unknown;
};

type AttachmentRow = {
  id: string;
  url: string | null;
  storage_path: string | null;
  thumb_path: string | null;
};

export async function POST(req: NextRequest) {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const body = (await req.json().catch(() => null)) as SignBody | null;

  const rawIds = Array.isArray(body?.attachmentIds) ? body?.attachmentIds : [];
  const attachmentIds = rawIds.map((id) => String(id)).filter(Boolean);
  if (attachmentIds.length === 0) {
    return withCookies(
      NextResponse.json({ error: "attachment_ids_required" }, { status: 400 })
    );
  }

  const bucket = process.env.ATTACHMENTS_BUCKET || "inbox-attachments";
  const ttl = Number(process.env.ATTACHMENTS_SIGNED_URL_TTL || 600);
  const signedTtl = Number.isFinite(ttl) && ttl > 0 ? ttl : 600;

  const { data, error } = await db
    .from("message_attachments")
    .select("id, url, storage_path, thumb_path, messages!inner(workspace_id)")
    .in("id", attachmentIds)
    .eq("messages.workspace_id", workspaceId);

  if (error) {
    return withCookies(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  }

  const rows = (data ?? []) as AttachmentRow[];
  const items = await Promise.all(
    rows.map(async (row) => {
      if (row.url) {
        return { id: row.id, url: row.url };
      }

      if (!row.storage_path) {
        return { id: row.id, error: "missing_storage_path" };
      }

      const signed = await db.storage
        .from(bucket)
        .createSignedUrl(row.storage_path, signedTtl);

      if (signed.error || !signed.data?.signedUrl) {
        return { id: row.id, error: signed.error?.message || "sign_failed" };
      }

      let thumbUrl: string | undefined;
      if (row.thumb_path) {
        const thumbSigned = await db.storage
          .from(bucket)
          .createSignedUrl(row.thumb_path, signedTtl);
        if (!thumbSigned.error && thumbSigned.data?.signedUrl) {
          thumbUrl = thumbSigned.data.signedUrl;
        }
      }

      return { id: row.id, url: signed.data.signedUrl, thumbUrl };
    })
  );

  return withCookies(NextResponse.json({ items }));
}
