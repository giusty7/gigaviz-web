/**
 * Usage Tracker for WhatsApp Inbox Analytics
 * 
 * Tracks granular events for reporting, analytics, and token billing
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';

/**
 * Event types that can be tracked
 */
export type UsageEventType = 
  | 'message_sent'           // Outbound message sent
  | 'template_sent'          // Template message sent
  | 'automation_triggered'   // Automation rule executed
  | 'tag_added'             // Tag added to thread
  | 'note_created'          // Internal note created
  | 'status_changed';       // Thread status updated

/**
 * Token costs per event type
 */
export const TOKEN_COSTS: Record<UsageEventType, number> = {
  message_sent: 10,
  template_sent: 5,
  automation_triggered: 2,
  tag_added: 1,
  note_created: 1,
  status_changed: 1,
};

/**
 * Track a usage event
 * 
 * @param params - Event details
 * @returns Success status
 */
export async function trackUsageEvent(params: {
  workspaceId: string;
  eventType: UsageEventType;
  metadata?: Record<string, unknown>;
  threadId?: string;
  messageId?: string;
  automationRuleId?: string;
  userId?: string;
  tokenCost?: number; // Optional override
}): Promise<{ ok: boolean; eventId?: string; error?: string }> {
  try {
    const {
      workspaceId,
      eventType,
      metadata = {},
      threadId,
      messageId,
      automationRuleId,
      userId,
      tokenCost = TOKEN_COSTS[eventType],
    } = params;

    const db = supabaseAdmin();

    // Insert event
    const { data: event, error: insertError } = await db
      .from('usage_events')
      .insert({
        workspace_id: workspaceId,
        event_type: eventType,
        event_metadata: metadata,
        thread_id: threadId ?? null,
        message_id: messageId ?? null,
        automation_rule_id: automationRuleId ?? null,
        user_id: userId ?? null,
        token_cost: tokenCost,
      })
      .select('id')
      .single();

    if (insertError) {
      logger.error('[UsageTracker] Failed to insert event', {
        workspaceId,
        eventType,
        error: insertError.message,
      });
      return { ok: false, error: insertError.message };
    }

    // Deduct tokens from workspace (if token_cost > 0)
    if (tokenCost > 0) {
      const { error: deductError } = await db.rpc('apply_workspace_token_delta', {
        p_workspace_id: workspaceId,
        p_delta: -tokenCost,
        p_reason: `${eventType} event`,
        p_reference_id: event?.id ?? null,
      });

      if (deductError) {
        logger.warn('[UsageTracker] Failed to deduct tokens', {
          workspaceId,
          tokenCost,
          error: deductError.message,
        });
        // Don't fail the whole operation if token deduction fails
      }
    }

    return { ok: true, eventId: event?.id };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('[UsageTracker] Unexpected error', { error: errorMsg });
    return { ok: false, error: errorMsg };
  }
}

/**
 * Batch track multiple events (for performance)
 * 
 * @param events - Array of events to track
 * @returns Success count and errors
 */
export async function trackUsageEventsBatch(
  events: Array<Parameters<typeof trackUsageEvent>[0]>
): Promise<{ inserted: number; failed: number; errors: string[] }> {
  const result = { inserted: 0, failed: 0, errors: [] as string[] };

  try {
    const db = supabaseAdmin();

    // Prepare batch insert
    const rows = events.map((event) => ({
      workspace_id: event.workspaceId,
      event_type: event.eventType,
      event_metadata: event.metadata ?? {},
      thread_id: event.threadId ?? null,
      message_id: event.messageId ?? null,
      automation_rule_id: event.automationRuleId ?? null,
      user_id: event.userId ?? null,
      token_cost: event.tokenCost ?? TOKEN_COSTS[event.eventType],
    }));

    const { data: insertedEvents, error: insertError } = await db
      .from('usage_events')
      .insert(rows)
      .select('id, workspace_id, token_cost');

    if (insertError) {
      result.failed = events.length;
      result.errors.push(`Batch insert failed: ${insertError.message}`);
      return result;
    }

    result.inserted = insertedEvents?.length ?? 0;

    // Deduct tokens per workspace (aggregate by workspace_id)
    const tokensByWorkspace = new Map<string, number>();
    for (const event of insertedEvents ?? []) {
      const current = tokensByWorkspace.get(event.workspace_id) ?? 0;
      tokensByWorkspace.set(event.workspace_id, current + (event.token_cost ?? 0));
    }

    // Apply token deltas
    for (const [workspaceId, totalTokens] of tokensByWorkspace.entries()) {
      if (totalTokens > 0) {
        const { error: deductError } = await db.rpc('apply_workspace_token_delta', {
          p_workspace_id: workspaceId,
          p_delta: -totalTokens,
          p_reason: 'Batch usage events',
          p_reference_id: null,
        });

        if (deductError) {
          logger.warn('[UsageTracker] Batch token deduction failed', {
            workspaceId,
            totalTokens,
            error: deductError.message,
          });
        }
      }
    }

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.failed = events.length;
    result.errors.push(errorMsg);
    return result;
  }
}

/**
 * Get usage stats for a workspace
 * 
 * @param workspaceId - Workspace UUID
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Aggregated usage stats
 */
export async function getUsageStats(params: {
  workspaceId: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}): Promise<{
  ok: boolean;
  stats?: Array<{
    event_date: string;
    event_type: UsageEventType;
    event_count: number;
    total_tokens: number;
    unique_threads: number;
    unique_users: number;
  }>;
  error?: string;
}> {
  try {
    const { workspaceId, startDate, endDate } = params;
    const db = supabaseAdmin();

    let query = db
      .from('usage_stats_daily')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('event_date', { ascending: false });

    if (startDate) {
      query = query.gte('event_date', startDate);
    }

    if (endDate) {
      query = query.lte('event_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[UsageTracker] Failed to fetch stats', {
        workspaceId,
        error: error.message,
      });
      return { ok: false, error: error.message };
    }

    return { ok: true, stats: data ?? [] };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: errorMsg };
  }
}

/**
 * Get real-time usage summary (bypasses materialized view for current day)
 * 
 * @param workspaceId - Workspace UUID
 * @returns Current usage summary
 */
export async function getUsageSummary(workspaceId: string): Promise<{
  ok: boolean;
  summary?: {
    today: { events: number; tokens: number };
    last7days: { events: number; tokens: number };
    last30days: { events: number; tokens: number };
    byType: Array<{ event_type: UsageEventType; count: number; tokens: number }>;
  };
  error?: string;
}> {
  try {
    const db = supabaseAdmin();
    const today = new Date().toISOString().split('T')[0];
    const last7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const last30days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Today's stats (real-time)
    const { data: todayData } = await db
      .from('usage_events')
      .select('token_cost')
      .eq('workspace_id', workspaceId)
      .eq('event_date', today);

    const todayEvents = todayData?.length ?? 0;
    const todayTokens = todayData?.reduce((sum, e) => sum + (e.token_cost ?? 0), 0) ?? 0;

    // Last 7 days (from materialized view + today)
    const { data: last7daysData } = await db
      .from('usage_stats_daily')
      .select('event_count, total_tokens')
      .eq('workspace_id', workspaceId)
      .gte('event_date', last7days);

    const last7daysEvents = (last7daysData?.reduce((sum, e) => sum + (e.event_count ?? 0), 0) ?? 0) + todayEvents;
    const last7daysTokens = (last7daysData?.reduce((sum, e) => sum + (e.total_tokens ?? 0), 0) ?? 0) + todayTokens;

    // Last 30 days
    const { data: last30daysData } = await db
      .from('usage_stats_daily')
      .select('event_count, total_tokens')
      .eq('workspace_id', workspaceId)
      .gte('event_date', last30days);

    const last30daysEvents = (last30daysData?.reduce((sum, e) => sum + (e.event_count ?? 0), 0) ?? 0) + todayEvents;
    const last30daysTokens = (last30daysData?.reduce((sum, e) => sum + (e.total_tokens ?? 0), 0) ?? 0) + todayTokens;

    // By event type (last 30 days)
    const { data: byTypeData } = await db
      .from('usage_stats_daily')
      .select('event_type, event_count, total_tokens')
      .eq('workspace_id', workspaceId)
      .gte('event_date', last30days);

    const byTypeMap = new Map<string, { count: number; tokens: number }>();
    for (const row of byTypeData ?? []) {
      const existing = byTypeMap.get(row.event_type) ?? { count: 0, tokens: 0 };
      byTypeMap.set(row.event_type, {
        count: existing.count + (row.event_count ?? 0),
        tokens: existing.tokens + (row.total_tokens ?? 0),
      });
    }

    const byType = Array.from(byTypeMap.entries()).map(([event_type, data]) => ({
      event_type: event_type as UsageEventType,
      count: data.count,
      tokens: data.tokens,
    }));

    return {
      ok: true,
      summary: {
        today: { events: todayEvents, tokens: todayTokens },
        last7days: { events: last7daysEvents, tokens: last7daysTokens },
        last30days: { events: last30daysEvents, tokens: last30daysTokens },
        byType,
      },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: errorMsg };
  }
}
