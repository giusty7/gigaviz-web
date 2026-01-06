import "server-only";

import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profiles";
import { getUserWorkspaces, resolveCurrentWorkspace, WORKSPACE_COOKIE } from "@/lib/workspaces";

export async function getAppContext() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { user: null };
  }

  const user = data.user;
  const profile = await ensureProfile(user);
  const workspaces = await getUserWorkspaces(user.id);
  const cookieStore = await cookies();
  const cookieId = cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
  const currentWorkspace = resolveCurrentWorkspace(workspaces, cookieId);
  const currentRole = currentWorkspace
    ? workspaces.find((ws) => ws.id === currentWorkspace.id)?.role ?? null
    : null;

  return {
    user,
    profile,
    workspaces,
    currentWorkspace,
    currentRole,
  };
}
