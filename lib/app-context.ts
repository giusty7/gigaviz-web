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
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

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

// Impersonated context: uses service role to resolve target user's workspace
export async function getAppContextImpersonated(
  impersonationId: string,
  workspaceSlug?: string | null
) {
  const db = supabaseAdmin();
  const { data: imp, error } = await db
    .from("ops_impersonations")
    .select(
      "id, target_user_id, target_email, workspace_id, workspace_slug, reason, expires_at, ended_at"
    )
    .eq("id", impersonationId)
    .is("ended_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !imp) {
    return { user: null };
  }

  const targetUserRes = await db.auth.admin.getUserById(imp.target_user_id);
  const targetUser = targetUserRes.data.user as User | null;

  if (!targetUser) {
    return { user: null };
  }

  const profile = await ensureProfile(targetUser);
  const workspaces = await getUserWorkspaces(targetUser.id);

  const currentWorkspace = resolveCurrentWorkspace(
    workspaces,
    imp.workspace_id,
    workspaceSlug ?? imp.workspace_slug
  );

  const currentRole = currentWorkspace
    ? workspaces.find((ws) => ws.id === currentWorkspace.id)?.role ?? null
    : null;

  const effectiveEntitlements = currentWorkspace
    ? await getWorkspaceEffectiveEntitlements(currentWorkspace.id)
    : [];

  return {
    user: targetUser,
    profile,
    workspaces,
    currentWorkspace,
    currentRole,
    effectiveEntitlements,
    impersonationId,
  };
}
