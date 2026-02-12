import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminWorkspace } from "@/lib/supabase/route";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const mergeSchema = z.object({
  primary_contact_id: z.string().uuid(),
  duplicate_contact_ids: z.array(z.string().uuid()).min(1),
}).refine(
  (data) => !data.duplicate_contact_ids.includes(data.primary_contact_id),
  { message: "primary_in_duplicates", path: ["duplicate_contact_ids"] }
);

type ContactRow = {
  id: string;
  workspace_id: string;
  merged_into_contact_id: string | null;
};

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const enabled = process.env.MERGE_ENABLED === "true";
  if (!enabled) {
    return withCookies(NextResponse.json({ error: "merge_disabled" }, { status: 403 }));
  }

  const body = await req.json().catch(() => null);
  const parsed = mergeSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "invalid_payload";
    return withCookies(NextResponse.json({ error: msg }, { status: 400 }));
  }
  const primaryId = parsed.data.primary_contact_id;
  const duplicateIds = Array.from(new Set(parsed.data.duplicate_contact_ids));

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
});
