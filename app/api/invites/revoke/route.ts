import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { getUserWorkspaces } from "@/lib/workspaces";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) return withCookies(NextResponse.json({ error: "unauthorized" }, { status: 401 }));

  const body = await req.json().catch(() => null);
  const inviteId = typeof body?.inviteId === "string" ? body.inviteId : null;
  if (!inviteId) return withCookies(NextResponse.json({ error: "invite_id_required" }, { status: 400 }));

  // Validate workspace ownership/admin via membership
  const workspaces = await getUserWorkspaces(user.id);

  // Fetch invite to know workspace
  const { data: inviteRes, error: fetchErr } = await supabase
    .from("workspace_invites")
    .select("id, workspace_id")
    .eq("id", inviteId)
    .maybeSingle();
  if (fetchErr || !inviteRes) return withCookies(NextResponse.json({ error: "invite_not_found" }, { status: 404 }));

  const membership = workspaces.find((w) => w.id === inviteRes.workspace_id);
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return withCookies(NextResponse.json({ error: "forbidden" }, { status: 403 }));
  }

  const { error } = await supabase
    .from("workspace_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId);

  if (error) return withCookies(NextResponse.json({ error: error.message || "db_error" }, { status: 500 }));

  return withCookies(NextResponse.json({ revoked: true }));
});
