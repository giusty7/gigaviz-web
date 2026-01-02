import { NextRequest, NextResponse } from "next/server";
import { requireAdminWorkspace } from "@/lib/supabase/route";

type ContactRow = {
  id: string;
  name: string | null;
  phone: string | null;
  phone_norm: string | null;
};

export async function GET(req: NextRequest) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const enabled = process.env.MERGE_ENABLED === "true";
  if (!enabled) {
    return withCookies(NextResponse.json({ error: "merge_disabled" }, { status: 403 }));
  }

  const workspaceParam = req.nextUrl.searchParams.get("workspace_id");
  if (workspaceParam && workspaceParam !== workspaceId) {
    return withCookies(
      NextResponse.json({ error: "workspace_mismatch" }, { status: 403 })
    );
  }

  const { data, error } = await db
    .from("contacts")
    .select("id, name, phone, phone_norm, merged_into_contact_id, deleted_at")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .is("merged_into_contact_id", null)
    .not("phone_norm", "is", null)
    .order("created_at", { ascending: true });

  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  const groups = new Map<string, ContactRow[]>();
  (data ?? []).forEach((row) => {
    const key = (row as ContactRow).phone_norm || "";
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)?.push(row as ContactRow);
  });

  const payload = Array.from(groups.entries())
    .filter(([, contacts]) => contacts.length > 1)
    .map(([phone_norm, contacts]) => ({
      phone_norm,
      contacts: contacts.map((c) => ({
        id: c.id,
        name: c.name ?? "Unknown",
        phone: c.phone ?? "",
        phone_norm: c.phone_norm,
      })),
    }));

  return withCookies(NextResponse.json({ groups: payload }));
}
