/**
 * Dashboard preferences management
 * Handles user-level customization of pinned modules in Quick Access section
 */

import { logger } from "@/lib/logging";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ModuleKey = string;

export const DEFAULT_PINNED_MODULES: ModuleKey[] = [
  "platform",
  "meta_hub",
  "helper",
];

export const MAX_PINNED_MODULES = 6;
export const MIN_PINNED_MODULES = 1;

export interface DashboardPreferences {
  userId: string;
  workspaceId: string;
  pinnedModules: ModuleKey[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Get user's dashboard preferences for a workspace
 * Returns default preferences if not found
 */
export async function getDashboardPreferences(
  userId: string,
  workspaceId: string
): Promise<ModuleKey[]> {
  const db = supabaseAdmin();

  const { data, error } = await db
    .from("dashboard_preferences")
    .select("pinned_modules")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    logger.warn("[dashboard] Failed to fetch preferences:", error);
    return DEFAULT_PINNED_MODULES;
  }

  if (!data || !data.pinned_modules) {
    return DEFAULT_PINNED_MODULES;
  }

  // Validate that pinned_modules is an array of strings
  const pinnedModules = Array.isArray(data.pinned_modules)
    ? (data.pinned_modules as ModuleKey[])
    : DEFAULT_PINNED_MODULES;

  return pinnedModules;
}

/**
 * Update user's pinned modules
 * Validates module keys and enforces min/max limits
 */
export async function updatePinnedModules(
  userId: string,
  workspaceId: string,
  moduleKeys: ModuleKey[]
): Promise<{ success: boolean; error?: string }> {
  // Validation: check array
  if (!Array.isArray(moduleKeys)) {
    return { success: false, error: "Module keys must be an array" };
  }

  // Validation: check min/max limits
  if (moduleKeys.length < MIN_PINNED_MODULES) {
    return {
      success: false,
      error: `At least ${MIN_PINNED_MODULES} module must be pinned`,
    };
  }

  if (moduleKeys.length > MAX_PINNED_MODULES) {
    return {
      success: false,
      error: `Maximum ${MAX_PINNED_MODULES} modules can be pinned`,
    };
  }

  // Validation: check for duplicates
  const uniqueKeys = [...new Set(moduleKeys)];
  if (uniqueKeys.length !== moduleKeys.length) {
    return { success: false, error: "Duplicate module keys detected" };
  }

  const db = supabaseAdmin();

  const { error } = await db
    .from("dashboard_preferences")
    .upsert(
      {
        user_id: userId,
        workspace_id: workspaceId,
        pinned_modules: moduleKeys,
      },
      {
        onConflict: "user_id,workspace_id",
      }
    );

  if (error) {
    logger.error("[dashboard] Failed to update preferences:", error);
    return { success: false, error: "Failed to save preferences" };
  }

  return { success: true };
}

/**
 * Reset user's preferences to default
 */
export async function resetPinnedModules(
  userId: string,
  workspaceId: string
): Promise<{ success: boolean; error?: string }> {
  return updatePinnedModules(userId, workspaceId, DEFAULT_PINNED_MODULES);
}
