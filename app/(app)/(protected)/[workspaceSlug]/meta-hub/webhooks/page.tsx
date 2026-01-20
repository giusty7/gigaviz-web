import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { getMetaHubTestEnvStatus } from "@/lib/meta-hub/test-env";
import { ensureWorkspaceCookie } from "@/lib/workspaces";
import { ImperiumWebhooksClient } from "@/components/meta-hub/ImperiumWebhooksClient";
import type { WebhookEvent, WebhookStats } from "@/components/meta-hub/ImperiumWebhooksComponents";
import { getWebhookEventsSummary } from "@/lib/meta-hub/webhook-events";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function MetaHubWebhooksPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");
  await ensureWorkspaceCookie(ctx.currentWorkspace.id);

  const devEmails = (process.env.DEV_FULL_ACCESS_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const isDevOverride = devEmails.includes((ctx.user.email || "").toLowerCase());
  const isAdminOverride = Boolean(ctx.profile?.is_admin) || isDevOverride;
  const canTest = ["owner", "admin"].includes(ctx.currentRole ?? "") || isAdminOverride;
  const envStatus = getMetaHubTestEnvStatus();

  const workspaceId = ctx.currentWorkspace.id;

  const eventsSummary = await getWebhookEventsSummary({
    workspaceId,
    limit: 100,
    includeLegacy: true,
    fallbackChannel: "unknown",
  });

  // Check for token/connection from canonical tables
  const db = supabaseAdmin();
  const { data: tokenRow } = await db
    .from("meta_tokens")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("provider", "meta_whatsapp")
    .maybeSingle();

  const { data: phoneRow } = await db
    .from("wa_phone_numbers")
    .select("phone_number_id, display_name")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hasToken = Boolean(tokenRow);
  const phoneNumberId = phoneRow?.phone_number_id ?? null;
  const displayName = phoneRow?.display_name ?? null;

  // Construct webhook URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gigaviz.id";
  const webhookUrl = `${baseUrl}/api/webhooks/meta/whatsapp`;

  // Map events to WebhookEvent type
  const mappedEvents: WebhookEvent[] = (eventsSummary.events ?? []).map((e) => ({
    id: e.id,
    channel: e.channel,
    event_type: e.event_type,
    external_event_id: null, // Not queried, optional for display
    received_at: e.received_at,
    processed_at: e.processed_at,
    error_text: e.error_text,
    payload_json: e.payload_json as Record<string, unknown>,
  }));

  const stats: WebhookStats = {
    total24h: eventsSummary.total24h ?? 0,
    errors24h: eventsSummary.errors24h ?? 0,
    lastEventAt: eventsSummary.lastEventAt,
  };

  return (
    <ImperiumWebhooksClient
      workspaceId={workspaceId}
      workspaceSlug={workspaceSlug}
      hasToken={hasToken}
      phoneNumberId={phoneNumberId}
      displayName={displayName}
      initialEvents={mappedEvents}
      initialStats={stats}
      webhookUrl={webhookUrl}
      canTest={canTest}
      webhookTestEnvMissing={envStatus.webhookPingMissing}
    />
  );
}
