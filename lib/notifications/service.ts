import { supabaseAdmin } from "@/lib/supabase/admin";

export type NotificationType =
  | "token_missing"
  | "token_near_cap"
  | "token_hard_cap_reached"
  | "webhook_error_spike"
  | "billing_request_created"
  | "template_sync_failed"
  | "topup_requested"
  | "topup_posted";

export type NotificationSeverity = "info" | "warn" | "critical";

export type CreateNotificationParams = {
  workspaceId: string;
  userId: string;
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  body?: string;
  meta?: Record<string, unknown>;
  dedupeKey?: string;
  dedupeWindowMinutes?: number;
};

/**
 * Create a notification for a user, with optional deduplication.
 * If dedupeKey is provided, prevents duplicate notifications within the dedupe window.
 */
export async function createNotification(params: CreateNotificationParams): Promise<{ ok: boolean; id?: string; skipped?: boolean }> {
  const {
    workspaceId,
    userId,
    type,
    severity = "info",
    title,
    body,
    meta = {},
    dedupeKey,
    dedupeWindowMinutes = 10,
  } = params;

  const db = supabaseAdmin();

  // Dedupe check: if same type + dedupe_key exists within window, skip
  if (dedupeKey) {
    const windowStart = new Date(Date.now() - dedupeWindowMinutes * 60 * 1000).toISOString();
    const { data: existing } = await db
      .from("notifications")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("type", type)
      .gte("created_at", windowStart)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return { ok: true, skipped: true };
    }
  }

  const notifMeta = dedupeKey ? { ...meta, dedupe_key: dedupeKey } : meta;

  const { data, error } = await db
    .from("notifications")
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      type,
      severity,
      title,
      body: body ?? null,
      meta: notifMeta,
    })
    .select("id")
    .single();

  if (error) {
    // Unique constraint violation means dedupe worked
    if (error.code === "23505") {
      return { ok: true, skipped: true };
    }
    console.error("[createNotification] Error:", error.message);
    return { ok: false };
  }

  return { ok: true, id: data.id };
}

/**
 * Notify all members of a workspace (e.g., for workspace-wide alerts)
 */
export async function notifyWorkspaceMembers(params: Omit<CreateNotificationParams, "userId">) {
  const db = supabaseAdmin();

  const { data: members } = await db
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", params.workspaceId);

  if (!members || members.length === 0) return { ok: true, count: 0 };

  const results = await Promise.all(
    members.map((m) => createNotification({ ...params, userId: m.user_id }))
  );

  const successCount = results.filter((r) => r.ok && !r.skipped).length;
  return { ok: true, count: successCount };
}

/**
 * Notify workspace admins/owners only
 */
export async function notifyWorkspaceAdmins(params: Omit<CreateNotificationParams, "userId">) {
  const db = supabaseAdmin();

  const { data: admins } = await db
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", params.workspaceId)
    .in("role", ["owner", "admin"]);

  if (!admins || admins.length === 0) return { ok: true, count: 0 };

  const results = await Promise.all(
    admins.map((a) => createNotification({ ...params, userId: a.user_id }))
  );

  const successCount = results.filter((r) => r.ok && !r.skipped).length;
  return { ok: true, count: successCount };
}

/**
 * Get unread notification count for a user in a workspace
 */
export async function getUnreadCount(workspaceId: string, userId: string): Promise<number> {
  const db = supabaseAdmin();

  const { count } = await db
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .is("read_at", null);

  return count ?? 0;
}

/**
 * List notifications for a user
 */
export async function listNotifications(
  workspaceId: string,
  userId: string,
  options: { unreadOnly?: boolean; limit?: number } = {}
) {
  const { unreadOnly = false, limit = 50 } = options;
  const db = supabaseAdmin();

  let query = db
    .from("notifications")
    .select("id, type, severity, title, body, meta, read_at, created_at")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.is("read_at", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[listNotifications] Error:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Mark notifications as read
 */
export async function markAsRead(workspaceId: string, userId: string, notificationIds: string[]) {
  if (notificationIds.length === 0) return { ok: true };

  const db = supabaseAdmin();

  const { error } = await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .in("id", notificationIds)
    .is("read_at", null);

  if (error) {
    console.error("[markAsRead] Error:", error.message);
    return { ok: false };
  }

  return { ok: true };
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(workspaceId: string, userId: string) {
  const db = supabaseAdmin();

  const { error } = await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    console.error("[markAllAsRead] Error:", error.message);
    return { ok: false };
  }

  return { ok: true };
}
