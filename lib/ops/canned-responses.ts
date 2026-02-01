import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  CannedResponse,
  CreateCannedResponseInput,
  UpdateCannedResponseInput,
} from "./types";

// Re-export types for convenience
export type {
  CannedResponse,
  CreateCannedResponseInput,
  UpdateCannedResponseInput,
};

/**
 * List canned responses (global + workspace-specific)
 */
export async function listCannedResponses(workspaceId?: string): Promise<CannedResponse[]> {
  const db = supabaseAdmin();

  let query = db
    .from("ops_canned_responses")
    .select("*")
    .order("category", { ascending: true })
    .order("title", { ascending: true });

  // Get global responses + workspace-specific if provided
  if (workspaceId) {
    query = query.or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`);
  } else {
    query = query.is("workspace_id", null);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map(mapCannedResponse);
}

/**
 * Get canned response by ID
 */
export async function getCannedResponse(id: string): Promise<CannedResponse | null> {
  const db = supabaseAdmin();

  const { data, error } = await db
    .from("ops_canned_responses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapCannedResponse(data) : null;
}

/**
 * Create canned response
 */
export async function createCannedResponse(
  input: CreateCannedResponseInput,
  createdBy: string
): Promise<CannedResponse> {
  const db = supabaseAdmin();

  const { data, error } = await db
    .from("ops_canned_responses")
    .insert({
      workspace_id: input.workspaceId ?? null,
      title: input.title,
      content: input.content,
      shortcut: input.shortcut ?? null,
      category: input.category ?? "general",
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return mapCannedResponse(data);
}

/**
 * Update canned response
 */
export async function updateCannedResponse(
  id: string,
  input: UpdateCannedResponseInput
): Promise<CannedResponse> {
  const db = supabaseAdmin();

  const updates: Record<string, unknown> = {};

  if (input.title !== undefined) updates.title = input.title;
  if (input.content !== undefined) updates.content = input.content;
  if (input.shortcut !== undefined) updates.shortcut = input.shortcut;
  if (input.category !== undefined) updates.category = input.category;

  const { data, error } = await db
    .from("ops_canned_responses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapCannedResponse(data);
}

/**
 * Delete canned response
 */
export async function deleteCannedResponse(id: string): Promise<void> {
  const db = supabaseAdmin();

  const { error } = await db.from("ops_canned_responses").delete().eq("id", id);

  if (error) throw error;
}

/**
 * Search canned responses by query
 */
export async function searchCannedResponses(
  query: string,
  workspaceId?: string
): Promise<CannedResponse[]> {
  const db = supabaseAdmin();

  let dbQuery = db
    .from("ops_canned_responses")
    .select("*")
    .or(`title.ilike.%${query}%,shortcut.ilike.%${query}%,content.ilike.%${query}%`)
    .order("title", { ascending: true })
    .limit(20);

  if (workspaceId) {
    dbQuery = dbQuery.or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`);
  } else {
    dbQuery = dbQuery.is("workspace_id", null);
  }

  const { data, error } = await dbQuery;

  if (error) throw error;
  return (data || []).map(mapCannedResponse);
}

// Helper mapper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCannedResponse(row: any): CannedResponse {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    content: row.content,
    shortcut: row.shortcut,
    category: row.category,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
