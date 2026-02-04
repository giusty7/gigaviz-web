/**
 * Meta Hub Usage Analytics
 * Tracks usage events across the Meta Hub module
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";

export type UsageEventType =
  // WhatsApp events
  | "whatsapp_message_sent"
  | "whatsapp_message_received"
  | "whatsapp_template_sent"
  | "whatsapp_template_created"
  | "whatsapp_connection_tested"
  // Instagram events
  | "instagram_message_sent"
  | "instagram_message_received"
  | "instagram_connection_created"
  // Messenger events
  | "messenger_message_sent"
  | "messenger_message_received"
  | "messenger_connection_created"
  // Ads events
  | "meta_ads_synced"
  | "meta_ads_campaign_viewed"
  // Automation events
  | "automation_rule_created"
  | "automation_rule_executed"
  | "automation_action_scheduled"
  | "automation_action_executed"
  // General events
  | "meta_hub_page_viewed"
  | "connection_health_check";

export type UsagePlatform = "whatsapp" | "instagram" | "messenger" | "ads" | "automation" | "general";

interface TrackUsageOptions {
  workspaceId: string;
  userId?: string;
  eventType: UsageEventType;
  platform: UsagePlatform;
  metadata?: Record<string, unknown>;
}

/**
 * Track a usage event in the Meta Hub
 */
export async function trackMetaHubUsage({
  workspaceId,
  userId,
  eventType,
  platform,
  metadata = {},
}: TrackUsageOptions): Promise<boolean> {
  try {
    const db = supabaseAdmin();

    const { error } = await db.from("usage_events").insert({
      workspace_id: workspaceId,
      user_id: userId ?? null,
      event_type: eventType,
      platform,
      metadata,
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.warn("[Usage Analytics] Failed to track event:", { error, eventType });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("[Usage Analytics] Error tracking event:", { error, eventType });
    return false;
  }
}

/**
 * Get usage stats for a workspace within a date range
 */
export async function getMetaHubUsageStats(
  workspaceId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    platform?: UsagePlatform;
    groupBy?: "day" | "week" | "month";
  } = {}
): Promise<{
  totalEvents: number;
  byPlatform: Record<string, number>;
  byEventType: Record<string, number>;
  dailyCounts: Array<{ date: string; count: number }>;
}> {
  const db = supabaseAdmin();
  const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = options.endDate || new Date();

  try {
    let query = db
      .from("usage_events")
      .select("*")
      .eq("workspace_id", workspaceId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (options.platform) {
      query = query.eq("platform", options.platform);
    }

    const { data: events, error } = await query;

    if (error) throw error;

    // Aggregate stats
    const byPlatform: Record<string, number> = {};
    const byEventType: Record<string, number> = {};
    const dailyMap: Record<string, number> = {};

    events?.forEach((event) => {
      // By platform
      byPlatform[event.platform] = (byPlatform[event.platform] || 0) + 1;

      // By event type
      byEventType[event.event_type] = (byEventType[event.event_type] || 0) + 1;

      // Daily counts
      const date = event.created_at.split("T")[0];
      dailyMap[date] = (dailyMap[date] || 0) + 1;
    });

    const dailyCounts = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalEvents: events?.length || 0,
      byPlatform,
      byEventType,
      dailyCounts,
    };
  } catch (error) {
    logger.error("[Usage Analytics] Error fetching stats:", { error });
    return {
      totalEvents: 0,
      byPlatform: {},
      byEventType: {},
      dailyCounts: [],
    };
  }
}

/**
 * Get usage summary for the Meta Hub insights dashboard
 */
export async function getMetaHubInsightsSummary(
  workspaceId: string,
  days: number = 30
): Promise<{
  messagesSent: number;
  messagesReceived: number;
  automationExecutions: number;
  connectionTests: number;
  topPlatform: string | null;
  trendsUp: boolean;
}> {
  const endDate = new Date();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const prevStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

  try {
    const current = await getMetaHubUsageStats(workspaceId, { startDate, endDate });
    const previous = await getMetaHubUsageStats(workspaceId, {
      startDate: prevStartDate,
      endDate: startDate,
    });

    const messagesSent =
      (current.byEventType["whatsapp_message_sent"] || 0) +
      (current.byEventType["instagram_message_sent"] || 0) +
      (current.byEventType["messenger_message_sent"] || 0);

    const messagesReceived =
      (current.byEventType["whatsapp_message_received"] || 0) +
      (current.byEventType["instagram_message_received"] || 0) +
      (current.byEventType["messenger_message_received"] || 0);

    const automationExecutions =
      (current.byEventType["automation_rule_executed"] || 0) +
      (current.byEventType["automation_action_executed"] || 0);

    const connectionTests = current.byEventType["whatsapp_connection_tested"] || 0;

    // Find top platform
    const platforms = Object.entries(current.byPlatform).sort((a, b) => b[1] - a[1]);
    const topPlatform = platforms.length > 0 ? platforms[0][0] : null;

    // Determine trend
    const trendsUp = current.totalEvents > previous.totalEvents;

    return {
      messagesSent,
      messagesReceived,
      automationExecutions,
      connectionTests,
      topPlatform,
      trendsUp,
    };
  } catch (error) {
    logger.error("[Usage Analytics] Error generating insights summary:", { error });
    return {
      messagesSent: 0,
      messagesReceived: 0,
      automationExecutions: 0,
      connectionTests: 0,
      topPlatform: null,
      trendsUp: false,
    };
  }
}
