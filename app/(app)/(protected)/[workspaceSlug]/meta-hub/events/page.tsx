import { redirect } from "next/navigation";
import { MetaEventsClient } from "@/components/meta-hub/MetaEventsClient";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function MetaHubEventsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspaceId = ctx.currentWorkspace.id;
  const canEdit = ["owner", "admin"].includes(ctx.currentRole ?? "");

  const db = supabaseAdmin();

  const { data: connectionRow } = await db
    .from("meta_whatsapp_connections")
    .select("waba_id, phone_number_id, display_phone_number, verified_name, dataset_id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  const { data: phoneRow } = await db
    .from("wa_phone_numbers")
    .select("waba_id, phone_number_id, display_name")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  const connection = {
    wabaId: connectionRow?.waba_id ?? phoneRow?.waba_id ?? null,
    phoneNumberId: connectionRow?.phone_number_id ?? phoneRow?.phone_number_id ?? null,
    displayPhoneNumber: connectionRow?.display_phone_number ?? null,
    verifiedName: connectionRow?.verified_name ?? phoneRow?.display_name ?? null,
    datasetId: connectionRow?.dataset_id ?? null,
  };

  const { data: logs } = await db
    .from("meta_capi_event_logs")
    .select("id, waba_id, dataset_id, event_name, event_time, status, error_message, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: tokenRow } = await db
    .from("meta_tokens")
    .select("provider, expires_at, scopes_json, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  const { data: recentEvents } = await db
    .from("meta_events_log")
    .select("id, event_type, source, referral_hash, received_at")
    .eq("workspace_id", workspaceId)
    .order("received_at", { ascending: false })
    .limit(20);

  const tokenStatus = {
    provider: tokenRow?.provider ?? (process.env.META_SYSTEM_USER_TOKEN ? "env_system_user" : null),
    expiresAt: tokenRow?.expires_at ?? null,
    scopes: (tokenRow?.scopes_json as Record<string, unknown> | null) ?? null,
  };

  return (
    <MetaEventsClient
      workspaceId={workspaceId}
      canEdit={canEdit}
      connection={connection}
      logs={logs ?? []}
      tokenStatus={tokenStatus}
      recentEvents={recentEvents ?? []}
    />
  );
}
