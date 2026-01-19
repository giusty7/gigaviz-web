import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import LockedScreen from "@/components/app/LockedScreen";
import { ImperiumMetaHubLayout } from "@/components/meta-hub/ImperiumMetaHubLayout";
import { getAppContext } from "@/lib/app-context";
import { getMetaHubAccess, type MetaHubSetup } from "@/lib/meta-hub/access";
import { getMetaHubFlags } from "@/lib/meta-hub/config";
import { getPlanFeatures } from "@/lib/entitlements";
import { getWorkspacePlan } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

// Meta Hub map (menu -> route -> component -> data -> lock)
// Overview -> /[workspaceSlug]/meta-hub -> app/(app)/(protected)/[workspaceSlug]/meta-hub/page.tsx
//   -> getMetaHubOverview (wa_settings, wa_phone_numbers, meta_webhook_events, wa_messages, wa_templates, wa_threads)
//   -> lock: meta_hub
// Connections -> /[workspaceSlug]/meta-hub/connections -> ImperiumConnectionsClient
//   -> wa_phone_numbers, meta_tokens, wa_webhook_events -> lock: meta_hub
// Webhooks -> /[workspaceSlug]/meta-hub/webhooks -> ImperiumWebhooksClient
//   -> meta_webhook_events, whatsapp_tokens -> lock: meta_webhooks
// Messaging - WhatsApp -> /[workspaceSlug]/meta-hub/messaging/whatsapp -> ImperiumTemplateForgeClient
//   -> wa_phone_numbers, wa_templates -> lock: meta_templates
// Messaging - WhatsApp Inbox -> /[workspaceSlug]/meta-hub/messaging/whatsapp/inbox -> ImperiumInboxClient
//   -> wa_threads, wa_messages, wa_thread_tags, wa_thread_notes -> lock: meta_send
// Messaging - WhatsApp Webhooks -> /[workspaceSlug]/meta-hub/messaging/whatsapp/webhooks -> WhatsappWebhookMonitorClient
//   -> meta_webhook_events, wa_phone_numbers, meta_tokens -> lock: meta_webhooks
// Messaging - Instagram/Messenger, Ads, Insights -> DisabledModuleState -> no data -> coming soon

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ workspaceSlug: string }>;
};

export default async function MetaHubLayout({ children, params }: LayoutProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/meta-hub`);
  }

  await ensureWorkspaceCookie(workspace.id);

  const planInfo = await getWorkspacePlan(workspace.id);
  const isAdmin = Boolean(ctx.profile?.is_admin) || Boolean(planInfo.devOverride);
  const access = getMetaHubAccess({
    planId: planInfo.planId,
    isAdmin,
    effectiveEntitlements: ctx.effectiveEntitlements,
  });
  const planHasMetaHub = getPlanFeatures(planInfo.planId).includes("meta_hub");
  const ownerGrantActive =
    !isAdmin &&
    Boolean(ctx.effectiveEntitlements?.includes("meta_hub")) &&
    !planHasMetaHub;

  const db = supabaseAdmin();
  const { data: phone } = await db
    .from("wa_phone_numbers")
    .select("phone_number_id")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .maybeSingle();

  const { data: metaToken } = await db
    .from("meta_tokens")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("provider", "meta_whatsapp")
    .maybeSingle();

  const { data: waToken } = await db
    .from("whatsapp_tokens")
    .select("id")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  const hasToken = Boolean(metaToken?.id || waToken?.id);
  const whatsappConfigured = Boolean(phone?.phone_number_id) && hasToken;

  const { count: templatesCount } = await db
    .from("wa_templates")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  const dayAgoDate = new Date();
  dayAgoDate.setUTCDate(dayAgoDate.getUTCDate() - 1);
  const dayAgo = dayAgoDate.toISOString();
  const { count: webhookCount } = await db
    .from("meta_webhook_events")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id)
    .gte("received_at", dayAgo);

  const setup: MetaHubSetup = {
    whatsappConfigured,
    templatesSynced: (templatesCount ?? 0) > 0,
    webhooksConfigured: (webhookCount ?? 0) > 0,
  };

  const flags = getMetaHubFlags();
  const basePath = `/${workspace.slug}/meta-hub`;
  const content = access.metaHub ? (
    children
  ) : (
    <LockedScreen
      title="Meta Hub is locked"
      description="Upgrade your plan to unlock Meta Hub for this workspace."
      workspaceSlug={workspace.slug}
    />
  );

  return (
    <ImperiumMetaHubLayout
      basePath={basePath}
      flags={flags}
      access={access}
      setup={setup}
      ownerGrantActive={ownerGrantActive}
    >
      {content}
    </ImperiumMetaHubLayout>
  );
}
