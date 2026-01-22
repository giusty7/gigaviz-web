import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { maskId } from "@/lib/time";

type HealthStatus = "ok" | "stale" | "none" | "unknown";

export type MetaHubOverview = {
  health: {
    whatsapp: {
      connected: boolean;
      wabaIdMasked: string;
      phoneIdMasked: string;
      tokenConfigured: boolean;
    };
    webhook: {
      status: HealthStatus;
      lastEventAt: string | null;
      events24h: number | null;
    };
  };
  kpis: {
    inboundCount24h: number | null;
    outboundCount24h: number | null;
    totalEvents24h: number | null;
    templates: {
      approved: number | null;
      pending: number | null;
      rejected: number | null;
    };
  };
  alerts: Array<{ title: string; description?: string; actionLabel?: string; actionHref?: string }>;
  recentEvents: Array<{ id: string; type: string; receivedAt: string | null }>;
  recentConversations: Array<{
    id: string;
    contact: string;
    preview: string;
    time: string | null;
  }>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getMetaHubOverview(workspaceId: string): Promise<MetaHubOverview> {
  const db = supabaseAdmin();
  const now = new Date();
  const dayAgo = new Date(now.getTime() - DAY_MS);
  const dayIso = dayAgo.toISOString();

  const [settingsResult, phoneResult, tokenResult] = await Promise.allSettled([
    db
      .from("wa_settings")
      .select("waba_id, phone_number_id")
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
    db
      .from("wa_phone_numbers")
      .select("waba_id, phone_number_id")
      .eq("workspace_id", workspaceId)
      .limit(1)
      .maybeSingle(),
    db
      .from("meta_tokens")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("provider", "meta_whatsapp")
      .maybeSingle(),
  ]);

  let wabaIdMasked = "Not configured yet";
  let phoneIdMasked = "Not configured yet";
  let whatsappConnected = false;

  const settings = settingsResult.status === "fulfilled" ? settingsResult.value.data : null;
  const phone = phoneResult.status === "fulfilled" ? phoneResult.value.data : null;

  if (settings) {
    if (settings.waba_id) wabaIdMasked = maskId(settings.waba_id);
    if (settings.phone_number_id) phoneIdMasked = maskId(settings.phone_number_id);
    whatsappConnected = Boolean(settings.phone_number_id || settings.waba_id);
  }

  if (!whatsappConnected && phone) {
    if (phone.waba_id) wabaIdMasked = maskId(phone.waba_id);
    if (phone.phone_number_id) phoneIdMasked = maskId(phone.phone_number_id);
    whatsappConnected = Boolean(phone.phone_number_id);
  }

  let tokenConfigured = false;
  if (tokenResult.status === "fulfilled") {
    tokenConfigured = Boolean(tokenResult.value.data?.id);
  }
  if (!tokenConfigured) {
    tokenConfigured = Boolean(process.env.META_WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN);
  }

  const fetchWebhook = async () => {
    let webhookStatus: HealthStatus = "none";
    let lastEventAt: string | null = null;
    let events24h: number | null = null;

    try {
      const [eventsLogLatest, webhookLatest] = await Promise.all([
        db
          .from("meta_events_log")
          .select("received_at")
          .eq("workspace_id", workspaceId)
          .order("received_at", { ascending: false })
          .limit(1),
        db
          .from("meta_webhook_events")
          .select("received_at")
          .eq("workspace_id", workspaceId)
          .order("received_at", { ascending: false })
          .limit(1),
      ]);

      const latestCandidates = [
        ...(eventsLogLatest.data ?? []),
        ...(webhookLatest.data ?? []),
      ].filter((row) => row.received_at);

      if (latestCandidates.length > 0) {
        latestCandidates.sort((a, b) =>
          new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
        );
        const newest = latestCandidates[0].received_at;
        lastEventAt = newest;
        const diff = now.getTime() - new Date(newest).getTime();
        webhookStatus = diff <= DAY_MS ? "ok" : "stale";
      }

      const [{ count: log24h }, { count: webhook24h }] = await Promise.all([
        db
          .from("meta_events_log")
          .select("id", { head: true, count: "exact" })
          .eq("workspace_id", workspaceId)
          .gte("received_at", dayIso),
        db
          .from("meta_webhook_events")
          .select("id", { head: true, count: "exact" })
          .eq("workspace_id", workspaceId)
          .gte("received_at", dayIso),
      ]);

      events24h = (log24h ?? 0) + (webhook24h ?? 0);
      if (!lastEventAt && (events24h ?? 0) === 0) webhookStatus = "none";
    } catch {
      webhookStatus = "unknown";
      events24h = null;
    }

    return { webhookStatus, lastEventAt, events24h } as const;
  };

  const fetchMessageCounts = async () => {
    let inboundCount24h: number | null = null;
    let outboundCount24h: number | null = null;
    try {
      const [{ count: inbound }, { count: outbound }] = await Promise.all([
        db
          .from("wa_messages")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .in("direction", ["in", "inbound"])
          .gte("created_at", dayIso),
        db
          .from("wa_messages")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .in("direction", ["out", "outbound"])
          .gte("created_at", dayIso),
      ]);
      inboundCount24h = inbound ?? 0;
      outboundCount24h = outbound ?? 0;
    } catch {
      inboundCount24h = null;
      outboundCount24h = null;
    }
    return { inboundCount24h, outboundCount24h } as const;
  };

  const [webhookResult, messageCountsResult] = await Promise.allSettled([
    fetchWebhook(),
    fetchMessageCounts(),
  ]);

  const { webhookStatus, lastEventAt, events24h } =
    webhookResult.status === "fulfilled"
      ? webhookResult.value
      : { webhookStatus: "unknown" as HealthStatus, lastEventAt: null, events24h: null };

  const { inboundCount24h, outboundCount24h } =
    messageCountsResult.status === "fulfilled"
      ? messageCountsResult.value
      : { inboundCount24h: null, outboundCount24h: null };

  const fetchTemplates = async () => {
    let templatesApproved: number | null = null;
    let templatesPending: number | null = null;
    let templatesRejected: number | null = null;
    try {
      const { data: templates } = await db
        .from("wa_templates")
        .select("status")
        .eq("workspace_id", workspaceId);
      if (templates) {
        const counters = { approved: 0, pending: 0, rejected: 0 };
        templates.forEach((row) => {
          const status = (row.status || "").toString().toLowerCase();
          if (status.includes("approve")) counters.approved += 1;
          else if (status.includes("reject")) counters.rejected += 1;
          else counters.pending += 1;
        });
        templatesApproved = counters.approved;
        templatesPending = counters.pending;
        templatesRejected = counters.rejected;
      }
    } catch {
      // ignore
    }

    return { templatesApproved, templatesPending, templatesRejected } as const;
  };

  const fetchRecentEvents = async () => {
    try {
      const { data } = await db
        .from("meta_webhook_events")
        .select("id, event_type, received_at")
        .eq("workspace_id", workspaceId)
        .order("received_at", { ascending: false })
        .limit(8);
      return (
        data?.map((row) => ({
          id: row.id,
          type: row.event_type ?? "event",
          receivedAt: row.received_at ?? null,
        })) ?? []
      );
    } catch {
      return [] as MetaHubOverview["recentEvents"];
    }
  };

  const fetchRecentConversations = async () => {
    try {
      const { data } = await db
        .from("wa_threads")
        .select("id, contact_wa_id, last_message_preview, last_message_at, phone_number_id")
        .eq("workspace_id", workspaceId)
        .order("last_message_at", { ascending: false })
        .limit(6);
      return (
        data?.map((row) => ({
          id: row.id,
          contact: maskContact(row.contact_wa_id),
          preview: row.last_message_preview || "No messages yet",
          time: row.last_message_at ?? null,
        })) ?? []
      );
    } catch {
      return [] as MetaHubOverview["recentConversations"];
    }
  };

  const [templatesResult, recentEventsResult, recentConversationsResult] = await Promise.allSettled([
    fetchTemplates(),
    fetchRecentEvents(),
    fetchRecentConversations(),
  ]);

  const templates =
    templatesResult.status === "fulfilled"
      ? templatesResult.value
      : { templatesApproved: null, templatesPending: null, templatesRejected: null };

  const recentEvents =
    recentEventsResult.status === "fulfilled" ? recentEventsResult.value : [];

  const recentConversations =
    recentConversationsResult.status === "fulfilled" ? recentConversationsResult.value : [];

  const alerts: MetaHubOverview["alerts"] = [];
  if (!whatsappConnected) {
    alerts.push({
      title: "Connection not configured",
      description: "Fill in WABA ID and Phone Number ID to get started.",
      actionLabel: "Configure now",
      actionHref: "connections",
    });
  }
  if (!tokenConfigured) {
    alerts.push({
      title: "Token server not configured",
      description: "Set the Meta WhatsApp access token on the server.",
    });
  }
  if (webhookStatus === "stale") {
    alerts.push({
      title: "No inbound events for >24h",
      description: "Check the webhook verify token or event subscription.",
      actionLabel: "View webhook",
      actionHref: "webhooks",
    });
  }
  if ((templates.templatesApproved ?? 0) + (templates.templatesPending ?? 0) + (templates.templatesRejected ?? 0) === 0) {
    alerts.push({
      title: "No templates yet",
      description: "Click Sync to pull templates from Meta.",
      actionLabel: "Sync templates",
      actionHref: "templates",
    });
  }

  return {
    health: {
      whatsapp: {
        connected: whatsappConnected,
        wabaIdMasked,
        phoneIdMasked,
        tokenConfigured,
      },
      webhook: {
        status: webhookStatus,
        lastEventAt,
        events24h,
      },
    },
    kpis: {
      inboundCount24h,
      outboundCount24h,
      totalEvents24h: events24h,
      templates: {
        approved: templates.templatesApproved,
        pending: templates.templatesPending,
        rejected: templates.templatesRejected,
      },
    },
    alerts,
    recentEvents,
    recentConversations,
  };
}

function maskContact(value?: string | null) {
  if (!value) return "Unknown";
  const trimmed = value.replace(/\s+/g, "");
  if (trimmed.length <= 4) return trimmed;
  const visible = trimmed.slice(-4);
  return `${"*".repeat(Math.max(0, trimmed.length - 4))}${visible}`;
}
