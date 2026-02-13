import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAppContext } from "@/lib/app-context";
import { ensureWorkspaceCookie } from "@/lib/workspaces";
import { WhatsappWebhookMonitorClient } from "@/components/meta-hub/WhatsappWebhookMonitorClient";
import { getWebhookEventsSummary } from "@/lib/meta-hub/webhook-events";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metaHub");
  return {
    title: `${t("webhooksTitle")} | WhatsApp`,
    description: t("webhooksDesc"),
  };
}

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

  const eventsSummary = await getWebhookEventsSummary({
    workspaceId: workspace.id,
    channel: "whatsapp",
    limit: 100,
    includeLegacy: true,
    fallbackChannel: "whatsapp",
  });

  // Check if token/connection exists
  const db = supabaseAdmin();

  const { data: waConnection } = await db
    .from("wa_phone_numbers")
    .select("id, phone_number_id, display_name")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let hasToken = false;
  if (waConnection?.phone_number_id) {
    const { data: token } = await db
      .from("meta_tokens")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("provider", "meta_whatsapp")
      .limit(1)
      .maybeSingle();
    hasToken = !!token?.id;
  }

  const initialStats = {
    total24h: eventsSummary.total24h ?? 0,
    errors24h: eventsSummary.errors24h ?? 0,
    lastEventAt: eventsSummary.lastEventAt,
  };

  return (
    <WhatsappWebhookMonitorClient
      workspaceId={workspace.id}
      workspaceSlug={workspace.slug}
      hasToken={hasToken}
      phoneNumberId={waConnection?.phone_number_id ?? null}
      displayName={waConnection?.display_name ?? null}
      initialEvents={eventsSummary.events ?? []}
      initialStats={initialStats}
    />
  );
}
