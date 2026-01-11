import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { maskId } from "@/lib/time";

type HealthStatus = "ok" | "stale" | "none";

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

  let wabaIdMasked = "Belum diatur";
  let phoneIdMasked = "Belum diatur";
  let whatsappConnected = false;

  try {
    const { data: settings } = await db
      .from("wa_settings")
      .select("waba_id, phone_number_id")
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (settings) {
      if (settings.waba_id) wabaIdMasked = maskId(settings.waba_id);
      if (settings.phone_number_id) phoneIdMasked = maskId(settings.phone_number_id);
      whatsappConnected = Boolean(settings.phone_number_id || settings.waba_id);
    }
  } catch {
    // table might not exist; ignore
  }

  if (!whatsappConnected) {
    try {
      const { data: phone } = await db
        .from("wa_phone_numbers")
        .select("waba_id, phone_number_id")
        .eq("workspace_id", workspaceId)
        .limit(1)
        .maybeSingle();
      if (phone) {
        if (phone.waba_id) wabaIdMasked = maskId(phone.waba_id);
        if (phone.phone_number_id) phoneIdMasked = maskId(phone.phone_number_id);
        whatsappConnected = Boolean(phone.phone_number_id);
      }
    } catch {
      // ignore
    }
  }

  const tokenConfigured = Boolean(
    process.env.META_WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN
  );

  let webhookStatus: HealthStatus = "none";
  let lastEventAt: string | null = null;
  let events24h: number | null = null;

  try {
    const { data: lastEvent } = await db
      .from("meta_webhook_events")
      .select("received_at")
      .eq("workspace_id", workspaceId)
      .order("received_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastEvent?.received_at) {
      lastEventAt = lastEvent.received_at;
      const lastDate = new Date(lastEvent.received_at);
      const diff = now.getTime() - lastDate.getTime();
      webhookStatus = diff <= DAY_MS ? "ok" : "stale";
    }
    const { count: events24hCount } = await db
      .from("meta_webhook_events")
      .select("id", { head: true, count: "exact" })
      .eq("workspace_id", workspaceId)
      .gte("received_at", dayAgo.toISOString());
    events24h = events24hCount ?? 0;
    if (!lastEventAt && (events24h ?? 0) === 0) webhookStatus = "none";
  } catch {
    webhookStatus = "none";
  }

  let inboundCount24h: number | null = null;
  let outboundCount24h: number | null = null;
  try {
    const { count: inbound } = await db
      .from("wa_messages")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .in("direction", ["in", "inbound"])
      .gte("created_at", dayAgo.toISOString());
    inboundCount24h = inbound ?? 0;

    const { count: outbound } = await db
      .from("wa_messages")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .in("direction", ["out", "outbound"])
      .gte("created_at", dayAgo.toISOString());
    outboundCount24h = outbound ?? 0;
  } catch {
    inboundCount24h = null;
    outboundCount24h = null;
  }

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

  let recentEvents: MetaHubOverview["recentEvents"] = [];
  try {
    const { data } = await db
      .from("meta_webhook_events")
      .select("id, event_type, received_at")
      .eq("workspace_id", workspaceId)
      .order("received_at", { ascending: false })
      .limit(8);
    recentEvents =
      data?.map((row) => ({
        id: row.id,
        type: row.event_type ?? "event",
        receivedAt: row.received_at ?? null,
      })) ?? [];
  } catch {
    recentEvents = [];
  }

  let recentConversations: MetaHubOverview["recentConversations"] = [];
  try {
    const { data } = await db
      .from("wa_threads")
      .select("id, contact_wa_id, last_message_preview, last_message_at, phone_number_id")
      .eq("workspace_id", workspaceId)
      .order("last_message_at", { ascending: false })
      .limit(6);
    recentConversations =
      data?.map((row) => ({
        id: row.id,
        contact: maskContact(row.contact_wa_id),
        preview: row.last_message_preview || "Belum ada pesan",
        time: row.last_message_at ?? null,
      })) ?? [];
  } catch {
    recentConversations = [];
  }

  const alerts: MetaHubOverview["alerts"] = [];
  if (!whatsappConnected) {
    alerts.push({
      title: "Connection belum diatur",
      description: "Isi WABA ID dan Phone Number ID untuk mulai.",
      actionLabel: "Atur sekarang",
      actionHref: "connections",
    });
  }
  if (!tokenConfigured) {
    alerts.push({
      title: "Token server belum dikonfigurasi",
      description: "Set akses token Meta WhatsApp di server.",
    });
  }
  if (webhookStatus === "stale") {
    alerts.push({
      title: "Tidak ada event masuk > 24 jam",
      description: "Periksa webhook verify token atau event subscription.",
      actionLabel: "Lihat Webhook",
      actionHref: "webhooks",
    });
  }
  if ((templatesApproved ?? 0) + (templatesPending ?? 0) + (templatesRejected ?? 0) === 0) {
    alerts.push({
      title: "Belum ada template",
      description: "Klik Sync untuk menarik template dari Meta.",
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
        approved: templatesApproved,
        pending: templatesPending,
        rejected: templatesRejected,
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
