import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSupervisorWorkspace } from "@/lib/supabase/route";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const { id: contactId } = await ctx.params;

  const body = (await req.json().catch(() => ({}))) as { source?: unknown };
  const source = asString(body.source) || "manual";
  const nowIso = new Date().toISOString();

  const { data, error } = await db
    .from("contacts")
    .update({
      opted_in: true,
      opted_in_at: nowIso,
      opt_in_source: source,
      opted_out: false,
      opted_out_at: null,
      opt_out_reason: null,
      comms_status: "normal",
    })
    .eq("workspace_id", workspaceId)
    .eq("id", contactId)
    .select("id, opted_in, opted_in_at, opt_in_source, opted_out, opted_out_at, opt_out_reason")
    .single();

  if (error || !data) {
    return withCookies(
      NextResponse.json({ error: error?.message || "update_failed" }, { status: 500 })
    );
  }

  return withCookies(NextResponse.json({ ok: true, contact: data, updated_by: user?.id ?? null }));
}
