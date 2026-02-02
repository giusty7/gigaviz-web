import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  BulkJob,
  ScheduledAction,
  WorkspaceTemplate,
  SavedFilter,
  BulkOperationPreview,
} from "./bulk-types";

// ============================================================================
// BULK JOBS
// ============================================================================

export async function getBulkJobs(options: {
  status?: BulkJob["status"];
  limit?: number;
}): Promise<BulkJob[]> {
  const db = supabaseAdmin();
  let query = db
    .from("ops_bulk_jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (options.status) {
    query = query.eq("status", options.status);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getBulkJob(id: string): Promise<BulkJob | null> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("ops_bulk_jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createBulkJob(
  job: Pick<
    BulkJob,
    | "operation_type"
    | "target_type"
    | "target_filter"
    | "payload"
    | "created_by"
    | "scheduled_for"
  >
): Promise<BulkJob> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("ops_bulk_jobs")
    .insert({
      ...job,
      status: job.scheduled_for ? "pending" : "draft",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBulkJob(
  id: string,
  updates: Partial<BulkJob>
): Promise<BulkJob> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("ops_bulk_jobs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cancelBulkJob(
  id: string,
  cancelledBy: string
): Promise<BulkJob> {
  return updateBulkJob(id, {
    status: "cancelled",
    cancelled_by: cancelledBy,
  });
}

export async function previewBulkOperation(
  operationType: string,
  targetType: string,
  targetFilter: Record<string, unknown>
): Promise<BulkOperationPreview> {
  const db = supabaseAdmin();
  // Get target count and sample
  let query = db.from(targetType).select("id, name", { count: "exact" });

  // Apply filters
  if (targetFilter.created_after) {
    query = query.gte("created_at", targetFilter.created_after);
  }

  const { data, count, error } = await query.limit(10);
  if (error) throw error;

  const requiresApproval = ["plan_change", "suspension"].includes(operationType);
  const estimatedDuration =
    count && count > 100 ? `~${Math.ceil(count / 100)} minutes` : "< 1 minute";

  return {
    operation_type: operationType,
    target_count: count || 0,
    targets: (data || []).map((t: { id: string; name: string }) => ({
      id: t.id,
      name: t.name,
    })),
    estimated_duration: estimatedDuration,
    requires_approval: requiresApproval,
  };
}

// ============================================================================
// SCHEDULED ACTIONS
// ============================================================================

export async function getScheduledActions(options: {
  status?: ScheduledAction["status"];
  targetId?: string;
  limit?: number;
}): Promise<ScheduledAction[]> {
  const db = supabaseAdmin();
  let query = db
    .from("ops_scheduled_actions")
    .select("*")
    .order("scheduled_for", { ascending: true });

  if (options.status) {
    query = query.eq("status", options.status);
  }
  if (options.targetId) {
    query = query.eq("target_id", options.targetId);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createScheduledAction(
  action: Pick<
    ScheduledAction,
    | "action_type"
    | "target_type"
    | "target_id"
    | "payload"
    | "reason"
    | "scheduled_for"
    | "created_by"
  >
): Promise<ScheduledAction> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("ops_scheduled_actions")
    .insert(action)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cancelScheduledAction(
  id: string,
  cancelledBy: string
): Promise<ScheduledAction> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("ops_scheduled_actions")
    .update({
      status: "cancelled",
      cancelled_by: cancelledBy,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// WORKSPACE TEMPLATES
// ============================================================================

export async function getWorkspaceTemplates(): Promise<WorkspaceTemplate[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("ops_workspace_templates")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data || [];
}

export async function getWorkspaceTemplate(
  id: string
): Promise<WorkspaceTemplate | null> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("ops_workspace_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createWorkspaceTemplate(
  template: Pick<
    WorkspaceTemplate,
    | "name"
    | "description"
    | "default_plan"
    | "default_entitlements"
    | "default_settings"
    | "default_modules"
    | "created_by"
  >
): Promise<WorkspaceTemplate> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("ops_workspace_templates")
    .insert(template)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkspaceTemplate(
  id: string,
  updates: Partial<WorkspaceTemplate>
): Promise<WorkspaceTemplate> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("ops_workspace_templates")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// SAVED FILTERS
// ============================================================================

export async function getSavedFilters(options: {
  page: string;
  userId?: string;
}): Promise<SavedFilter[]> {
  const db = supabaseAdmin();
  let query = db
    .from("ops_saved_filters")
    .select("*")
    .eq("page", options.page)
    .order("name");

  if (options.userId) {
    query = query.or(`created_by.eq.${options.userId},is_shared.eq.true`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createSavedFilter(
  filter: Pick<
    SavedFilter,
    | "name"
    | "description"
    | "page"
    | "filters"
    | "columns"
    | "sort_config"
    | "is_shared"
    | "created_by"
  >
): Promise<SavedFilter> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("ops_saved_filters")
    .insert(filter)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSavedFilter(id: string): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("ops_saved_filters").delete().eq("id", id);

  if (error) throw error;
}

export async function setDefaultFilter(
  id: string,
  page: string,
  userId: string
): Promise<void> {
  const db = supabaseAdmin();
  // Clear existing defaults for this page/user
  await db
    .from("ops_saved_filters")
    .update({ is_default: false })
    .eq("page", page)
    .eq("created_by", userId);

  // Set new default
  await db.from("ops_saved_filters").update({ is_default: true }).eq("id", id);
}
