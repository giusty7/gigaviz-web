import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAppContext } from "@/lib/app-context";
import { getMetaHubTestEnvStatus } from "@/lib/meta-hub/test-env";
import { ensureWorkspaceCookie } from "@/lib/workspaces";
import { ImperiumWebhooksClient } from "@/components/meta-hub/ImperiumWebhooksClient";
import type { WebhookEvent, WebhookStats } from "@/components/meta-hub/ImperiumWebhooksComponents";

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

  const db = supabaseAdmin();
  const workspaceId = ctx.currentWorkspace.id;

  // Fetch recent events
  const { data: events } = await db
    .from("meta_webhook_events")
    .select("id, channel, event_type, received_at, processed_at, error_text, payload_json")
    .eq("workspace_id", workspaceId)
    .order("received_at", { ascending: false })
    .limit(100);

  // Fetch 24h stats - compute date at request time (not render)
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: total24h }, { count: errors24h }, { data: lastEventRow }] = await Promise.all([
    db
      .from("meta_webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("received_at", dayAgo),
    db
      .from("meta_webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("received_at", dayAgo)
      .not("error_text", "is", null),
    db
      .from("meta_webhook_events")
      .select("received_at")
      .eq("workspace_id", workspaceId)
      .order("received_at", { ascending: false })
      .limit(1),
  ]);

  // Check for token
  const { data: tokenRow } = await db
    .from("whatsapp_tokens")
    .select("phone_number_id, display_name")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const hasToken = Boolean(tokenRow);
  const phoneNumberId = tokenRow?.phone_number_id ?? null;
  const displayName = tokenRow?.display_name ?? null;

  // Construct webhook URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gigaviz.id";
  const webhookUrl = `${baseUrl}/api/webhooks/meta/whatsapp`;

  // Map events to WebhookEvent type
  const mappedEvents: WebhookEvent[] = (events ?? []).map((e) => ({
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
    total24h: total24h ?? 0,
    errors24h: errors24h ?? 0,
    lastEventAt: lastEventRow?.[0]?.received_at ?? null,
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
