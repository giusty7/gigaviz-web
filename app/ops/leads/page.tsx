import { redirect } from "next/navigation";
import { OpsShell } from "@/components/platform/OpsShell";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LeadsClient } from "@/components/ops/LeadsClient";

export const dynamic = "force-dynamic";

export default async function OpsLeadsPage() {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  const db = supabaseAdmin();

  // Fetch leads (latest 200) 
  const { data: leads, error } = await db
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  // Fetch stats
  const [
    { count: totalLeads },
    { count: newLeads },
    { count: contactedLeads },
    { count: qualifiedLeads },
    { count: convertedLeads },
  ] = await Promise.all([
    db.from("leads").select("*", { count: "exact", head: true }),
    db.from("leads").select("*", { count: "exact", head: true }).eq("status", "new"),
    db.from("leads").select("*", { count: "exact", head: true }).eq("status", "contacted"),
    db.from("leads").select("*", { count: "exact", head: true }).eq("status", "qualified"),
    db.from("leads").select("*", { count: "exact", head: true }).eq("status", "converted"),
  ]);

  const stats = {
    total: totalLeads ?? 0,
    new: newLeads ?? 0,
    contacted: contactedLeads ?? 0,
    qualified: qualifiedLeads ?? 0,
    converted: convertedLeads ?? 0,
  };

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Leads Management</h1>
          <p className="text-slate-400">
            Marketing leads, contact form submissions, and lead follow-up pipeline.
          </p>
        </div>

        <LeadsClient
          initialLeads={leads ?? []}
          stats={stats}
          error={error?.message}
        />
      </div>
    </OpsShell>
  );
}
