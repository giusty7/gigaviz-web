import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAppContext } from "@/lib/app-context";
import { ensureWorkspaceCookie } from "@/lib/workspaces";
import { WhatsappWebhookMonitorClient } from "@/components/meta-hub/WhatsappWebhookMonitorClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function WhatsappWebhooksPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/meta-hub/messaging/whatsapp/webhooks`);
  }

  await ensureWorkspaceCookie(workspace.id);

  const db = supabaseAdmin();

  // Compute date range outside render cycle - use a stable reference point
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Fetch initial events
  const { data: events } = await db
    .from("meta_webhook_events")
    .select(
      "id, channel, event_type, external_event_id, received_at, processed_at, error_text, payload_json"
    )
    .eq("workspace_id", workspace.id)
    .eq("channel", "whatsapp")
    .order("received_at", { ascending: false })
    .limit(100);

  // Compute stats
  const { count: total24h } = await db
    .from("meta_webhook_events")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id)
    .eq("channel", "whatsapp")
    .gte("received_at", dayAgo);

  const { count: errors24h } = await db
    .from("meta_webhook_events")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id)
    .eq("channel", "whatsapp")
    .not("error_text", "is", null)
    .gte("received_at", dayAgo);

  const { data: lastRow } = await db
    .from("meta_webhook_events")
    .select("received_at")
    .eq("workspace_id", workspace.id)
    .eq("channel", "whatsapp")
    .order("received_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Check if token exists
  const { data: connection } = await db
    .from("meta_connections")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("channel", "whatsapp")
    .maybeSingle();

  const initialStats = {
    total24h: total24h ?? 0,
    errors24h: errors24h ?? 0,
    lastEventAt: lastRow?.received_at ?? null,
  };

  return (
    <WhatsappWebhookMonitorClient
      workspaceId={workspace.id}
      workspaceSlug={workspace.slug}
      hasToken={!!connection?.id}
      initialEvents={events ?? []}
      initialStats={initialStats}
    />
  );
}
