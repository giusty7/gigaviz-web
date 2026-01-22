import "server-only";

import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/supabase/safe-user";
import { ensureProfile } from "@/lib/profiles";
import { getWorkspaceEffectiveEntitlements } from "@/lib/entitlements/effective";
import {
  getUserWorkspaces,
  resolveCurrentWorkspace,
  WORKSPACE_COOKIE,
} from "@/lib/workspaces";

export async function getAppContext(workspaceSlug?: string | null) {
  const supabase = await supabaseServer();
  const { user } = await getSafeUser(supabase);
  if (!user) {
    return { user: null };
  }
  const profile = await ensureProfile(user);
  const workspaces = await getUserWorkspaces(user.id);
  const cookieStore = await cookies();
  const cookieId = cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
  const currentWorkspace = resolveCurrentWorkspace(
    workspaces,
    cookieId,
    workspaceSlug ?? null
  );
  const currentRole = currentWorkspace
    ? workspaces.find((ws) => ws.id === currentWorkspace.id)?.role ?? null
    : null;
  const effectiveEntitlements = currentWorkspace
    ? await getWorkspaceEffectiveEntitlements(currentWorkspace.id)
    : [];

  return {
    user,
    profile,
    workspaces,
    currentWorkspace,
    currentRole,
    effectiveEntitlements,
  };
}
