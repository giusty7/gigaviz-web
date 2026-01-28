import "dotenv/config";
import { supabaseAdmin } from "@/lib/supabase/admin.node";
import * as shared from "./token.shared";

export type ResolvedMetaToken = shared.ResolvedMetaToken;

export async function resolveWorkspaceMetaToken(workspaceId: string): Promise<shared.ResolvedMetaToken> {
  const db = supabaseAdmin();
  return shared.resolveWorkspaceMetaToken(db, workspaceId);
}

export async function getWorkspaceMetaAccessToken(workspaceId: string) {
  const db = supabaseAdmin();
  return shared.getWorkspaceMetaAccessToken(db, workspaceId);
}
