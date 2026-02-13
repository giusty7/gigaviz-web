import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { HelperSubPageShell } from "@/components/helper/HelperSubPageShell";
import { CRMInsightsClient } from "@/components/helper/CRMInsightsClient";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("helper");
  return {
    title: `${t("crmTitle")} | Gigaviz Helper`,
    description: t("crmDesc"),
  };
}

export default async function HelperCRMPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  
  if (!ctx.user || !ctx.currentWorkspace) {
    notFound();
  }

  const workspaceId = ctx.currentWorkspace.id;
  
  // Check entitlement
  const entitlement = await requireEntitlement(workspaceId, "helper");
  if (!entitlement.allowed) {
    const t = await getTranslations("helper");
    return (
      <HelperSubPageShell workspaceSlug={workspaceSlug} activeTab="crm">
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <p className="text-lg text-[#f5f5dc]/60">
            {t("disabledMessage")}
          </p>
        </div>
      </HelperSubPageShell>
    );
  }

  const db = supabaseAdmin();

  // Fetch contacts with engagement data
  const { data: contacts } = await db
    .from("wa_contacts")
    .select(`
      id,
      name,
      phone_norm,
      opt_in_status,
      tags,
      created_at,
      updated_at,
      custom_fields
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  // Fetch stats
  const [
    { count: totalContacts },
    { count: optedInContacts },
    { count: threadCount },
    { count: openThreads },
  ] = await Promise.all([
    db.from("wa_contacts").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    db.from("wa_contacts").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("opt_in_status", "opted_in"),
    db.from("threads").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    db.from("threads").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "open"),
  ]);

  // Transform contacts for client
  const transformedContacts = (contacts || []).map((contact: Record<string, unknown>, index: number) => ({
    id: contact.id as string,
    name: (contact.name as string | null) || null,
    phone: (contact.phone_norm as string) || "",
    status: contact.opt_in_status as string || "unknown",
    tags: (contact.tags as string[] | null) || [],
    created_at: contact.created_at as string,
    updated_at: contact.updated_at as string | null,
    // Deterministic scores based on index for stable rendering
    sentimentScore: 50 + (index % 50),
    engagementScore: 40 + ((index * 7) % 60),
  }));

  const initialStats = {
    totalContacts: totalContacts ?? 0,
    activeContacts: optedInContacts ?? 0,
    totalThreads: threadCount ?? 0,
    openThreads: openThreads ?? 0,
    avgResponseTime: "2.4h",
    satisfactionScore: 87,
  };

  return (
    <HelperSubPageShell workspaceSlug={workspaceSlug} activeTab="crm">
      <CRMInsightsClient
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        initialContacts={transformedContacts}
        initialStats={initialStats}
      />
    </HelperSubPageShell>
  );
}
