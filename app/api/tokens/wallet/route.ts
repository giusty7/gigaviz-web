import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { ensureProfile } from "@/lib/profiles";
import { getUserWorkspaces, resolveCurrentWorkspace, WORKSPACE_COOKIE } from "@/lib/workspaces";
import { getWallet } from "@/lib/tokens";

export async function GET(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userErr || !user) {
    return withCookies(
      NextResponse.json({ error: "unauthorized" }, { status: 401 })
    );
  }

  await ensureProfile(user);

  const workspaceIdParam = req.nextUrl.searchParams.get("workspace_id");
  const workspaces = await getUserWorkspaces(user.id);
  const cookieId = req.cookies.get(WORKSPACE_COOKIE)?.value ?? null;
  const currentWorkspace = resolveCurrentWorkspace(workspaces, cookieId);
  const workspaceId = workspaceIdParam || currentWorkspace?.id;

  if (!workspaceId) {
    return withCookies(
      NextResponse.json({ error: "no_workspace" }, { status: 404 })
    );
  }

  const allowed = workspaces.some((ws) => ws.id === workspaceId);
  if (!allowed) {
    return withCookies(
      NextResponse.json({ error: "forbidden" }, { status: 403 })
    );
  }

  const wallet = await getWallet(workspaceId);
  return withCookies(NextResponse.json({ wallet }));
}
