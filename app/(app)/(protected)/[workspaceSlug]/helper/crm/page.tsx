import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { Users, UserPlus, Database, TrendingUp } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function HelperCRMPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const supabase = await supabaseServer();

  // Fetch contact stats
  const { count: totalContacts } = await supabase
    .from("wa_contacts")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", ctx.currentWorkspace.id);

  const { count: optedInContacts } = await supabase
    .from("wa_contacts")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", ctx.currentWorkspace.id)
    .eq("opt_in_status", "opted_in");

  // Fetch recent contacts
  const { data: recentContacts } = await supabase
    .from("wa_contacts")
    .select("id, name, phone, opt_in_status, created_at")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM & Contacts</h1>
          <p className="mt-2 text-muted-foreground">
            Manage customer relationships and contact database
          </p>
        </div>
        <Link
          href={`/${workspaceSlug}/helper/crm/import`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" />
          Import Contacts
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{totalContacts ?? 0}</p>
              <p className="text-sm text-muted-foreground">Total Contacts</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <UserPlus className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{optedInContacts ?? 0}</p>
              <p className="text-sm text-muted-foreground">Opted In</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Database className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">
                {totalContacts ? Math.round((optedInContacts! / totalContacts) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Opt-in Rate</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">Active</p>
              <p className="text-sm text-muted-foreground">Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Link
          href={`/${workspaceSlug}/helper/crm/contacts`}
          className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
        >
          <Users className="mb-3 h-8 w-8 text-blue-500" />
          <h3 className="mb-2 font-semibold">Browse Contacts</h3>
          <p className="text-sm text-muted-foreground">
            View and manage all contacts in your database
          </p>
        </Link>
        <Link
          href={`/${workspaceSlug}/helper/crm/fields`}
          className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
        >
          <Database className="mb-3 h-8 w-8 text-purple-500" />
          <h3 className="mb-2 font-semibold">Custom Fields</h3>
          <p className="text-sm text-muted-foreground">
            Manage custom fields and contact properties
          </p>
        </Link>
        <Link
          href={`/${workspaceSlug}/helper/crm/duplicates`}
          className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
        >
          <TrendingUp className="mb-3 h-8 w-8 text-orange-500" />
          <h3 className="mb-2 font-semibold">Find Duplicates</h3>
          <p className="text-sm text-muted-foreground">
            Detect and merge duplicate contact records
          </p>
        </Link>
      </div>

      {/* Recent Contacts */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Recent Contacts</h2>
        {recentContacts && recentContacts.length > 0 ? (
          <div className="space-y-2">
            {recentContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{contact.name || "No Name"}</p>
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      contact.opt_in_status === "opted_in"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {contact.opt_in_status}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No contacts yet. Start by importing your contact list.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
