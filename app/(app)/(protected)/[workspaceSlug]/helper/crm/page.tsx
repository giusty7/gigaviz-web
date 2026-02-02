import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { requireEntitlement } from "@/lib/entitlements/server";
import { HelperSubPageShell } from "@/components/helper/HelperSubPageShell";
import { supabaseServer } from "@/lib/supabase/server";
import { 
  UsersIcon, 
  UserPlusIcon, 
  MessageSquareIcon,
  PhoneIcon,
  ArrowRightIcon,
  ClockIcon,
} from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "CRM | Gigaviz Helper",
  description: "AI-powered customer relationship management",
};

export default async function HelperCRMPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspaceId = ctx.currentWorkspace.id;
  
  // Check entitlement
  const entitlement = await requireEntitlement(workspaceId, "helper");
  if (!entitlement.allowed) {
    return (
      <HelperSubPageShell workspaceSlug={workspaceSlug} activeTab="crm">
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <p className="text-lg text-[#f5f5dc]/60">
            Helper is not enabled for this workspace
          </p>
        </div>
      </HelperSubPageShell>
    );
  }

  const supabase = await supabaseServer();

  // Fetch contact stats
  const { count: totalContacts } = await supabase
    .from("wa_contacts")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  const { count: optedInContacts } = await supabase
    .from("wa_contacts")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("opt_in_status", "opted_in");

  // Fetch thread count
  const { count: threadCount } = await supabase
    .from("threads")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  // Fetch open threads
  const { count: openThreads } = await supabase
    .from("threads")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("status", "open");

  // Fetch recent contacts
  const { data: recentContacts } = await supabase
    .from("wa_contacts")
    .select("id, name, phone, opt_in_status, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(10);

  const stats = [
    {
      label: "Total Contacts",
      value: totalContacts ?? 0,
      icon: UsersIcon,
      gradient: "from-[#d4af37] to-[#f9d976]",
    },
    {
      label: "Opted In",
      value: optedInContacts ?? 0,
      icon: UserPlusIcon,
      gradient: "from-[#10b981] to-[#34d399]",
    },
    {
      label: "Total Threads",
      value: threadCount ?? 0,
      icon: MessageSquareIcon,
      gradient: "from-[#3b82f6] to-[#60a5fa]",
    },
    {
      label: "Open Threads",
      value: openThreads ?? 0,
      icon: ClockIcon,
      gradient: "from-[#f59e0b] to-[#fbbf24]",
    },
  ];

  const quickActions = [
    {
      title: "View Contacts",
      description: "Browse and manage all contacts",
      icon: UsersIcon,
      href: `/${workspaceSlug}/meta-hub/contacts`,
    },
    {
      title: "Inbox",
      description: "Respond to customer messages",
      icon: MessageSquareIcon,
      href: `/${workspaceSlug}/meta-hub/inbox`,
    },
    {
      title: "WhatsApp Templates",
      description: "Manage message templates",
      icon: PhoneIcon,
      href: `/${workspaceSlug}/meta-hub/templates`,
    },
  ];

  return (
    <HelperSubPageShell workspaceSlug={workspaceSlug} activeTab="crm">
      <div className="p-6 space-y-8 overflow-y-auto h-full bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#050a18]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
              CRM Dashboard
            </h1>
            <p className="text-[#f5f5dc]/60 mt-1">
              AI-powered customer relationship management
            </p>
          </div>
          <Link
            href={`/${workspaceSlug}/meta-hub/contacts`}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#f9d976] px-4 text-sm font-medium text-[#050a18] hover:opacity-90 transition-opacity"
          >
            <UserPlusIcon className="h-4 w-4" />
            Manage Contacts
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-4"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <stat.icon className="h-5 w-5 text-[#050a18]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#f5f5dc]">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-[#f5f5dc]/60">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-[#d4af37] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-6 hover:border-[#d4af37]/40 hover:bg-[#0a1229] transition-all cursor-pointer group h-full">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20 mb-4">
                      <action.icon className="h-6 w-6 text-[#d4af37]" />
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-[#f5f5dc]/40 group-hover:text-[#d4af37] group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="font-semibold text-[#f5f5dc] mb-1">{action.title}</h3>
                  <p className="text-sm text-[#f5f5dc]/60">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Contacts */}
        <div>
          <h2 className="text-lg font-semibold text-[#d4af37] mb-4">Recent Contacts</h2>
          {recentContacts && recentContacts.length > 0 ? (
            <div className="space-y-2">
              {recentContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center">
                      <UsersIcon className="h-5 w-5 text-[#d4af37]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#f5f5dc]">{contact.name || "No Name"}</p>
                      <p className="text-sm text-[#f5f5dc]/60">{contact.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        contact.opt_in_status === "opted_in"
                          ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30"
                          : "bg-[#f5f5dc]/10 text-[#f5f5dc]/60 border border-[#f5f5dc]/20"
                      }`}
                    >
                      {contact.opt_in_status === "opted_in" ? "Opted In" : contact.opt_in_status}
                    </span>
                    <span className="text-sm text-[#f5f5dc]/40">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-12 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center">
                <UsersIcon className="h-8 w-8 text-[#d4af37]/40" />
              </div>
              <p className="text-[#f5f5dc]/60">
                No contacts yet. Import contacts from Meta Hub to get started.
              </p>
              <Link
                href={`/${workspaceSlug}/meta-hub/contacts`}
                className="inline-flex items-center gap-2 mt-4 text-[#d4af37] hover:underline"
              >
                Go to Meta Hub Contacts
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </HelperSubPageShell>
  );
}
