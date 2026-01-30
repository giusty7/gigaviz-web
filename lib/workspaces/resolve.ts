/**
 * Workspace Utilities for API Routes
 * Helpers for resolving workspace ID from slug/UUID
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolve workspace slug or UUID to UUID
 * Supports both formats:
 * - UUID: Returns as-is
 * - Slug: Looks up workspace and returns UUID
 * 
 * @param supabase Supabase client with RLS context
 * @param workspaceIdOrSlug UUID or slug
 * @returns Workspace UUID or null if not found
 */
export async function resolveWorkspaceId(
  supabase: SupabaseClient,
  workspaceIdOrSlug: string
): Promise<string | null> {
  // Check if already UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(workspaceIdOrSlug)) {
    return workspaceIdOrSlug;
  }

  // Assume slug, resolve to UUID
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceIdOrSlug)
    .single();

  return workspace?.id || null;
}
