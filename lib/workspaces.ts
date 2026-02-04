import "server-only";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const WORKSPACE_COOKIE = "gv_workspace_id";

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  owner_id: string | null;
  workspace_type: string;
  description: string | null;
  created_at: string;
  role: string;
};

// Note: description column may not exist in all environments
// Query fetches it optionally, defaults to null if missing

export async function getWorkspaceCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function ensureWorkspaceCookie(_workspaceId: string) {
  // DEPRECATED: Cookie is now set in proxy.ts
  // This function is a no-op and kept for backward compatibility.
  // Do not attempt to set cookies from server components.
  return;
}

export function resolveCurrentWorkspace(
  workspaces: WorkspaceSummary[],
  cookieId?: string | null,
  slug?: string | null
) {
  if (!workspaces.length) return null;
  if (slug) {
    const match = workspaces.find((ws) => ws.slug === slug);
    if (match) return match;
  }
  if (cookieId) {
    const match = workspaces.find((ws) => ws.id === cookieId);
    if (match) return match;
  }
  return workspaces[0];
}

export async function getUserWorkspaces(userId: string) {
  const db = supabaseAdmin();
  const { data: memberships, error } = await db
    .from("workspace_members")
    .select("workspace_id, role, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!memberships?.length) return [];

  const workspaceIds = memberships.map((membership) => membership.workspace_id);
  const { data: workspaces, error: workspaceError } = await db
    .from("workspaces")
    .select("id, name, slug, owner_id, workspace_type, description, created_at")
    .in("id", workspaceIds);

  if (workspaceError) throw workspaceError;

  const workspaceMap = new Map(
    (workspaces ?? []).map((workspace) => [workspace.id, workspace])
  );

  return memberships.flatMap((membership) => {
    const workspace = workspaceMap.get(membership.workspace_id);
    if (!workspace) return [];
    return [
      {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        owner_id: workspace.owner_id,
        workspace_type: workspace.workspace_type,
        description: workspace.description ?? null,
        created_at: workspace.created_at,
        role: membership.role,
      },
    ];
  });
}

export async function getWorkspaceMembership(
  userId: string,
  workspaceId: string
) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
