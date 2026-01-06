import "server-only";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const WORKSPACE_COOKIE = "gv_workspace_id";

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  owner_id: string | null;
  created_at: string;
  role: string;
};

type WorkspaceRow = Omit<WorkspaceSummary, "role">;

function isWorkspaceRow(value: unknown): value is WorkspaceRow {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.slug === "string" &&
    typeof record.created_at === "string" &&
    ("owner_id" in record)
  );
}

function normalizeWorkspace(value: unknown): WorkspaceRow | null {
  if (Array.isArray(value)) {
    const match = value.find(isWorkspaceRow);
    return match ?? null;
  }
  return isWorkspaceRow(value) ? value : null;
}

export async function getWorkspaceCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
}

export function resolveCurrentWorkspace(
  workspaces: WorkspaceSummary[],
  cookieId?: string | null
) {
  if (!workspaces.length) return null;
  if (cookieId) {
    const match = workspaces.find((ws) => ws.id === cookieId);
    if (match) return match;
  }
  return workspaces[0];
}

export async function getUserWorkspaces(userId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("workspace_memberships")
    .select(
      "workspace_id, role, workspaces(id, name, slug, owner_id, created_at)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (
    data?.flatMap((row) => {
      const ws = normalizeWorkspace(row.workspaces);
      if (!ws) return [];
      return [
        {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          owner_id: ws.owner_id,
          created_at: ws.created_at,
          role: row.role,
        },
      ];
    }) ?? []
  );
}

export async function getWorkspaceMembership(
  userId: string,
  workspaceId: string
) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("workspace_memberships")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
