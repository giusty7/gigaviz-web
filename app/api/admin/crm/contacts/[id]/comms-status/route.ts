import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSupervisorWorkspace } from "@/lib/supabase/route";

type Ctx = { params: Promise<{ id: string }> };

type ContactRow = {
  id: string;
  workspace_id: string;
  comms_status: string | null;
  comms_status_updated_at: string | null;
};

function parseStatus(value: unknown) {
  if (value === "normal" || value === "blacklisted" || value === "whitelisted") {
    return value;
  }
  return null;
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id } = await params;

  const body = (await req.json().catch(() => null)) as { comms_status?: unknown } | null;
  const status = parseStatus(body?.comms_status);
  if (!status) {
    return withCookies(NextResponse.json({ error: "invalid_status" }, { status: 400 }));
  }

  const { data: contact, error: contactErr } = await db
    .from("contacts")
    .select("id, workspace_id, comms_status, comms_status_updated_at")
    .eq("id", id)
    .single();

  if (contactErr || !contact) {
    return withCookies(
      NextResponse.json({ error: contactErr?.message ?? "contact_not_found" }, { status: 404 })
    );
  }

  if ((contact as ContactRow).workspace_id !== workspaceId) {
    return withCookies(
      NextResponse.json({ error: "workspace_mismatch" }, { status: 403 })
    );
  }

  const { data: updated, error: updateErr } = await db
    .from("contacts")
    .update({
      comms_status: status,
      comms_status_updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .select("id, comms_status, comms_status_updated_at")
    .single();

  if (updateErr) {
    return withCookies(NextResponse.json({ error: updateErr.message }, { status: 500 }));
  }

  return withCookies(
    NextResponse.json({
      contact: {
        id: updated.id,
        comms_status: updated.comms_status,
        comms_status_updated_at: updated.comms_status_updated_at,
      },
    })
  );
}
