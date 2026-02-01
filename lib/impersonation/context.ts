import "server-only";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ImpersonationContext = {
  isImpersonating: boolean;
  impersonationId?: string;
  actorEmail?: string;
  targetUserId?: string;
  targetEmail?: string;
  workspaceSlug?: string;
  workspaceId?: string;
  expiresAt?: string;
  reason?: string;
};

/**
 * Get impersonation context from cookie (server-only)
 */
export async function getImpersonationContext(): Promise<ImpersonationContext> {
  const cookieStore = await cookies();
  const impersonationId = cookieStore.get("ops_impersonation_id")?.value;

  if (!impersonationId) {
    return { isImpersonating: false };
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("ops_impersonations")
    .select(
      "id, actor_email, target_user_id, target_email, workspace_id, workspace_slug, reason, expires_at, ended_at"
    )
    .eq("id", impersonationId)
    .is("ended_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) {
    return { isImpersonating: false };
  }

  return {
    isImpersonating: true,
    impersonationId: data.id,
    actorEmail: data.actor_email,
    targetUserId: data.target_user_id,
    targetEmail: data.target_email,
    workspaceSlug: data.workspace_slug,
    workspaceId: data.workspace_id,
    expiresAt: data.expires_at,
    reason: data.reason,
  };
}

/**
 * Set impersonation cookie (called after starting impersonation)
 */
export async function setImpersonationCookie(impersonationId: string) {
  const cookieStore = await cookies();
  cookieStore.set("ops_impersonation_id", impersonationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours max
  });
}

/**
 * Clear impersonation cookie (called after ending impersonation)
 */
export async function clearImpersonationCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("ops_impersonation_id");
}
