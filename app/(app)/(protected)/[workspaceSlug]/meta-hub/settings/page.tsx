import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MetaHubSettingsClient } from "@/components/meta-hub/MetaHubSettingsClient";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { workspaceSlug } = await params;
  return {
    title: `Settings | Meta Hub | ${workspaceSlug}`,
  };
}

export default async function MetaHubSettingsPage({ params, searchParams }: Props) {
  const { workspaceSlug } = await params;
  const { tab = "profile" } = await searchParams;

  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspaceId = ctx.currentWorkspace.id;
  const canEdit = ["owner", "admin"].includes(ctx.currentRole ?? "");

  if (!canEdit) {
    redirect(`/${workspaceSlug}/meta-hub`);
  }

  const db = supabaseAdmin();

  // Fetch workspace members for assignment rules
  const { data: rawMembers } = await db
    .from("workspace_members")
    .select(`
      user_id,
      role,
      profiles!inner(
        full_name,
        avatar_url
      )
    `)
    .eq("workspace_id", workspaceId);

  // Transform members to match expected structure (profiles is an object, not array)
  const members = (rawMembers || []).map((m) => ({
    user_id: m.user_id,
    role: m.role,
    profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
  }));

  // Fetch WhatsApp templates for auto-reply rules
  const { data: templates } = await db
    .from("wa_templates")
    .select("id, name, language, status")
    .eq("workspace_id", workspaceId)
    .eq("status", "APPROVED")
    .order("name");

  // Fetch connections with enriched data from cache
  const { data: connections } = await db
    .from("wa_phone_numbers")
    .select(`
      id,
      phone_number_id,
      waba_id,
      display_name,
      notes,
      status,
      created_at,
      last_tested_at,
      last_test_result
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  // Fetch diagnostics from meta_assets_cache
  const phoneNumberIds = connections?.map((c) => c.phone_number_id) ?? [];
  const { data: diagnostics } = await db
    .from("meta_assets_cache")
    .select(
      "phone_number_id, waba_id, display_phone_number, verified_name, quality_rating, last_synced_at, last_error"
    )
    .eq("workspace_id", workspaceId)
    .in("phone_number_id", phoneNumberIds.length > 0 ? phoneNumberIds : ["__none__"]);

  // Build connection map with enriched data
  const diagnosticsMap = new Map(
    diagnostics?.map((d) => [d.phone_number_id, d]) ?? []
  );

  const enrichedConnections = connections?.map((conn) => {
    const diag = diagnosticsMap.get(conn.phone_number_id);
    return {
      ...conn,
      displayPhoneNumber: diag?.display_phone_number ?? null,
      verifiedName: diag?.verified_name ?? null,
      qualityRating: diag?.quality_rating ?? null,
      lastSyncedAt: diag?.last_synced_at ?? null,
      lastError: diag?.last_error ?? null,
    };
  }) ?? [];

  return (
    <MetaHubSettingsClient
      workspaceId={workspaceId}
      workspaceSlug={workspaceSlug}
      workspaceName={ctx.currentWorkspace.name}
      initialTab={tab}
      connections={enrichedConnections}
      members={members || []}
      templates={templates || []}
      currentUserId={ctx.user.id}
    />
  );
}
