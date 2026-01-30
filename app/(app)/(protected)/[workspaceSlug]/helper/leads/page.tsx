import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { Target, TrendingUp, Filter, Download } from "lucide-react";
import Link from "next/link";

type Lead = {
  id: string;
  name: string;
  phone: string;
  source: string | null;
  status: string | null;
  created_at: string;
};

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function HelperLeadsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const supabase = await supabaseServer();

  // Fetch leads (using wa_contacts with lead indicators)
  const { data: leads } = await supabase
    .from("wa_contacts")
    .select("id, name, phone, tags, created_at")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Stats
  const totalLeads = leads?.length ?? 0;
  const recentLeads = leads?.filter((l) => {
    const created = new Date(l.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created > weekAgo;
  }).length ?? 0;

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads Management</h1>
          <p className="mt-2 text-muted-foreground">
            Track and qualify leads from multiple sources
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex h-10 items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium hover:bg-accent">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <Link
            href={`/${workspaceSlug}/helper/leads/export`}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Export
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Target className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{totalLeads}</p>
              <p className="text-sm text-muted-foreground">Total Leads</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{recentLeads}</p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Filter className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">Qualified</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Download className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">Active</p>
              <p className="text-sm text-muted-foreground">Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Sources */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Lead Sources</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {["WhatsApp", "Website", "Referral", "Direct"].map((source) => (
            <div
              key={source}
              className="rounded-lg border bg-card p-4 text-center"
            >
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">{source}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Recent Leads</h2>
        {leads && leads.length > 0 ? (
          <div className="space-y-2">
            {(leads as unknown as Lead[]).map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{lead.name || "No Name"}</p>
                    <p className="text-sm text-muted-foreground">{lead.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">
                    New
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-12 text-center">
            <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No leads yet. Connect your lead sources to start tracking.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
