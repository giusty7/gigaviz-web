import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { ensureProfile } from "@/lib/profiles";
import {
  getUserWorkspaces,
  resolveCurrentWorkspace,
  WORKSPACE_COOKIE,
} from "@/lib/workspaces";

function setWorkspaceCookie(res: NextResponse, workspaceId: string) {
  res.cookies.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

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
  const workspaces = await getUserWorkspaces(user.id);
  const cookieId = req.cookies.get(WORKSPACE_COOKIE)?.value ?? null;
  const currentWorkspace = resolveCurrentWorkspace(workspaces, cookieId);

  const res = NextResponse.json({
    currentWorkspace,
    workspaces,
    needs_onboarding: !currentWorkspace,
  });

  if (currentWorkspace && currentWorkspace.id !== cookieId) {
    setWorkspaceCookie(res, currentWorkspace.id);
  }

  return withCookies(res);
}

export async function POST(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userErr || !user) {
    return withCookies(
      NextResponse.json({ error: "unauthorized" }, { status: 401 })
    );
  }

  const body = await req.json().catch(() => null);
  const workspaceId =
    typeof body?.workspace_id === "string" ? body.workspace_id : null;

  if (!workspaceId) {
    return withCookies(
      NextResponse.json({ error: "workspace_id_required" }, { status: 400 })
    );
  }

  const workspaces = await getUserWorkspaces(user.id);
  const target = workspaces.find((ws) => ws.id === workspaceId);

  if (!target) {
    return withCookies(
      NextResponse.json({ error: "forbidden" }, { status: 403 })
    );
  }

  const res = NextResponse.json({ currentWorkspace: target });
  setWorkspaceCookie(res, workspaceId);
  return withCookies(res);
}
