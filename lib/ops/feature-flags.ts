import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type FeatureFlag = {
  id: string;
  flagKey: string;
  flagName: string;
  description: string | null;
  defaultEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceFeatureFlag = {
  id: string;
  workspaceId: string;
  flagKey: string;
  enabled: boolean;
  reason: string | null;
  setBy: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Get all feature flags
 */
export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const { data, error } = await supabaseAdmin()
    .from("ops_feature_flags")
    .select("*")
    .order("flag_key");

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    flagKey: row.flag_key,
    flagName: row.flag_name,
    description: row.description,
    defaultEnabled: row.default_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Create or update feature flag
 */
export async function upsertFeatureFlag(params: {
  flagKey: string;
  flagName: string;
  description?: string;
  defaultEnabled: boolean;
}): Promise<FeatureFlag> {
  const { data, error } = await supabaseAdmin()
    .from("ops_feature_flags")
    .upsert(
      {
        flag_key: params.flagKey,
        flag_name: params.flagName,
        description: params.description || null,
        default_enabled: params.defaultEnabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "flag_key" }
    )
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    flagKey: data.flag_key,
    flagName: data.flag_name,
    description: data.description,
    defaultEnabled: data.default_enabled,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Get workspace feature flag overrides
 */
export async function getWorkspaceFeatureFlags(
  workspaceId: string
): Promise<WorkspaceFeatureFlag[]> {
  const { data, error } = await supabaseAdmin()
    .from("ops_workspace_feature_flags")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("flag_key");

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    flagKey: row.flag_key,
    enabled: row.enabled,
    reason: row.reason,
    setBy: row.set_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Set workspace feature flag override
 */
export async function setWorkspaceFeatureFlag(params: {
  workspaceId: string;
  flagKey: string;
  enabled: boolean;
  reason?: string;
  setBy: string;
}): Promise<WorkspaceFeatureFlag> {
  const { data, error } = await supabaseAdmin()
    .from("ops_workspace_feature_flags")
    .upsert(
      {
        workspace_id: params.workspaceId,
        flag_key: params.flagKey,
        enabled: params.enabled,
        reason: params.reason || null,
        set_by: params.setBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,flag_key" }
    )
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    flagKey: data.flag_key,
    enabled: data.enabled,
    reason: data.reason,
    setBy: data.set_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Evaluate feature flag for workspace
 */
export async function evaluateFeatureFlag(
  workspaceId: string,
  flagKey: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin().rpc("ops_evaluate_feature_flag", {
    p_workspace_id: workspaceId,
    p_flag_key: flagKey,
  });

  if (error) throw error;
  return Boolean(data);
}

/**
 * Delete workspace feature flag override
 */
export async function deleteWorkspaceFeatureFlag(
  workspaceId: string,
  flagKey: string
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("ops_workspace_feature_flags")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("flag_key", flagKey);

  if (error) throw error;
}
