import { NextRequest, NextResponse } from "next/server";
import { requireAdminWorkspace } from "@/lib/supabase/route";

type MergePayload = {
  primary_contact_id?: unknown;
  duplicate_contact_ids?: unknown;
};

type ContactRow = {
  id: string;
  workspace_id: string;
  merged_into_contact_id: string | null;
};

function normalizeIds(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  const ids = value.filter((id) => typeof id === "string") as string[];
  return Array.from(new Set(ids));
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const enabled = process.env.MERGE_ENABLED === "true";
  if (!enabled) {
    return withCookies(NextResponse.json({ error: "merge_disabled" }, { status: 403 }));
  }

  const body = (await req.json().catch(() => null)) as MergePayload | null;
  const primaryId = typeof body?.primary_contact_id === "string" ? body?.primary_contact_id : "";
  const duplicateIds = normalizeIds(body?.duplicate_contact_ids);

  if (!primaryId || duplicateIds.length === 0) {
    return withCookies(NextResponse.json({ error: "invalid_payload" }, { status: 400 }));
  }
  if (duplicateIds.includes(primaryId)) {
    return withCookies(NextResponse.json({ error: "primary_in_duplicates" }, { status: 400 }));
  }

  const allIds = Array.from(new Set([primaryId, ...duplicateIds]));
  const { data: contacts, error: contactsErr } = await db
    .from("contacts")
    .select("id, workspace_id, merged_into_contact_id")
    .in("id", allIds);

  if (contactsErr) {
    return withCookies(NextResponse.json({ error: contactsErr.message }, { status: 500 }));
  }

  if ((contacts ?? []).length !== allIds.length) {
    return withCookies(NextResponse.json({ error: "contact_not_found" }, { status: 404 }));
  }

  const rows = (contacts ?? []) as ContactRow[];
  const mismatch = rows.find((c) => c.workspace_id !== workspaceId);
  if (mismatch) {
    return withCookies(NextResponse.json({ error: "workspace_mismatch" }, { status: 403 }));
  }

  const primaryRow = rows.find((c) => c.id === primaryId);
  if (!primaryRow) {
    return withCookies(NextResponse.json({ error: "primary_not_found" }, { status: 404 }));
  }

  const { data: rpcData, error: rpcErr } = await db.rpc("merge_contacts", {
    p_workspace_id: workspaceId,
    p_primary_contact_id: primaryId,
    p_duplicate_contact_ids: duplicateIds,
    p_actor: user?.id ?? "system",
  });

  if (rpcErr) {
    return withCookies(NextResponse.json({ error: rpcErr.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, result: rpcData }));
}
