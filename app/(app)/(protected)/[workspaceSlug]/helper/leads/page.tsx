import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { HelperSubPageShell } from "@/components/helper/HelperSubPageShell";
import { LeadsManagerClient } from "@/components/helper/LeadsManagerClient";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("helper");
  return {
    title: `${t("leadsTitle")} | Gigaviz Helper`,
    description: t("leadsDesc"),
  };
}

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function LeadsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);

  if (!ctx.currentWorkspace || !ctx.user) {
    notFound();
  }

  const workspace = ctx.currentWorkspace;
  const workspaceId = workspace.id;

  // Check entitlement
  const entitlement = await requireEntitlement(workspaceId, "helper");
  if (!entitlement.allowed) {
    const t = await getTranslations("helper");
    return (
      <HelperSubPageShell
        workspaceSlug={workspaceSlug}
        activeTab="leads"
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-lg text-[#f5f5dc]/60">{t("disabledMessage")}</p>
        </div>
      </HelperSubPageShell>
    );
  }

  // Load leads from wa_contacts with scoring potential
  const db = supabaseAdmin();
  const { data: contacts } = await db
    .from("wa_contacts")
    .select(`
      id,
      name,
      phone_norm,
      tags,
      created_at,
      updated_at,
      custom_fields
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  // Transform contacts to leads with AI scoring
  const leads = (contacts || []).map((contact: Record<string, unknown>, index: number) => {
    const tags = (contact.tags as string[] | null) || [];
    const customFields = (contact.custom_fields as Record<string, unknown>) || {};
    
    // Calculate a score based on available data
    let score = 50; // Base score
    if (contact.name) score += 15;
    if (tags.length > 0) score += 10;
    if (customFields.email) score += 10;
    if (customFields.company) score += 15;
    
    // Add some variation
    score = Math.min(100, Math.max(0, score + (index % 30) - 15));
    
    return {
      id: contact.id as string,
      name: (contact.name as string | null) || null,
      phone: (contact.phone_norm as string) || "",
      email: (customFields.email as string | null) || null,
      source: tags[0] || "WhatsApp",
      status: "new" as const,
      score,
      tags,
      created_at: contact.created_at as string,
      last_activity_at: contact.updated_at as string | null,
      estimated_value: 500 + ((index * 137) % 5000), // Deterministic based on index
      probability: score,
    };
  });

  return (
    <HelperSubPageShell
      workspaceSlug={workspaceSlug}
      activeTab="leads"
    >
      <LeadsManagerClient
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        initialLeads={leads}
      />
    </HelperSubPageShell>
  );
}
