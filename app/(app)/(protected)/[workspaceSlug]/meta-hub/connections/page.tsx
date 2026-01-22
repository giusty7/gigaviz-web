import { redirect } from "next/navigation";
import { ImperiumConnectionsClient } from "@/components/meta-hub/ImperiumConnectionsClient";
import { FacebookSdkProvider } from "@/components/meta/FacebookSdkProvider";
import { getAppContext } from "@/lib/app-context";
import { getMetaHubTestEnvStatus } from "@/lib/meta-hub/test-env";
import { getWebhookEventsSummary } from "@/lib/meta-hub/webhook-events";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getWaSettings } from "@/lib/meta/wa-settings";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function MetaHubConnectionsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspaceId = ctx.currentWorkspace.id;
  const canEdit = ["owner", "admin"].includes(ctx.currentRole ?? "");
  const devEmails = (process.env.DEV_FULL_ACCESS_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const isDevOverride = devEmails.includes((ctx.user.email || "").toLowerCase());
  const isAdminOverride = Boolean(ctx.profile?.is_admin) || isDevOverride;
  const canTest = canEdit || isAdminOverride;
  const envStatus = getMetaHubTestEnvStatus();

  const db = supabaseAdmin();
  const { data: phone } = await db
    .from("wa_phone_numbers")
    .select("phone_number_id, waba_id, display_name, status, last_tested_at, last_test_result")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  const { data: tokenRow } = await db
    .from("meta_tokens")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("provider", "meta_whatsapp")
    .maybeSingle();

  const events = await getWebhookEventsSummary({
    workspaceId,
    limit: 10,
    includeLegacy: true,
    fallbackChannel: "unknown",
  });

  // Fetch per-workspace sandbox settings
  const sandboxSettings = await getWaSettings(workspaceId);

  const tokenSet = Boolean(tokenRow);
  const connection = phone
    ? {
        phoneNumberId: phone.phone_number_id,
        wabaId: phone.waba_id,
        displayName: phone.display_name,
        status: phone.status,
        lastTestedAt: phone.last_tested_at,
        lastTestResult: phone.last_test_result,
      }
    : null;

  const recentEvents = (events.events ?? []).map((e) => ({
    type: e.event_type ?? "unknown",
    timestamp: e.received_at ?? new Date().toISOString(),
  }));
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gigaviz.id";
  const webhookUrl = `${baseUrl}/api/webhooks/meta/whatsapp`;

  return (
    <FacebookSdkProvider>
      <ImperiumConnectionsClient
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        canEdit={canEdit}
        canTest={canTest}
        connection={connection}
        tokenSet={tokenSet}
        recentEvents={recentEvents}
        eventsLast24h={events.total24h}
        webhookUrl={webhookUrl}
        connectionTestEnvMissing={envStatus.connectionTestMissing}
        webhookTestEnvMissing={envStatus.webhookPingMissing}
        sandboxEnabled={sandboxSettings.sandboxEnabled}
        sandboxWhitelist={sandboxSettings.whitelist}
      />
    </FacebookSdkProvider>
  );
}
