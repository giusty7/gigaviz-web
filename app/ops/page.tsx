import { redirect } from "next/navigation";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { supabaseServer } from "@/lib/supabase/server";
import { OpsShell } from "@/components/platform/OpsShell";
import Link from "next/link";
import {
  LayoutPanelLeft,
  Building2,
  Users,
  Ticket,
  HeartPulse,
  ScrollText,
  BarChart3,
  Zap,
  Code,
  ArrowRight,
  Clock,
  Copy,
  Filter,
  Webhook,
  Flag,
  Database,
  Play,
  Download,
  Key,
  BookOpen,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Menu structure organized by category
const menuCategories = [
  {
    id: "core",
    title: "Core Operations",
    description: "Manage workspaces and customers",
    color: "from-amber-500 to-yellow-600",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-950/20",
    items: [
      { label: "Sovereign Command", href: "/ops/god-console", icon: LayoutPanelLeft, description: "Full control center with manual overrides" },
      { label: "Workspaces", href: "/ops/workspaces", icon: Building2, description: "Browse and manage all workspaces" },
      { label: "Customers", href: "/ops/customers", icon: Users, description: "Lookup by email, phone, or ID" },
      { label: "Platform Knowledge", href: "/ops/platform-kb", icon: BookOpen, description: "Manage Gigaviz docs for AI assistant" },
    ],
  },
  {
    id: "support",
    title: "Support",
    description: "Customer support and tickets",
    color: "from-blue-500 to-cyan-600",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-950/20",
    items: [
      { label: "Support Tickets", href: "/ops/tickets", icon: Ticket, description: "Manage tickets with SLA tracking" },
    ],
  },
  {
    id: "entitlements",
    title: "Entitlements",
    description: "Product access control",
    color: "from-[#d4af37] to-[#f9d976]",
    borderColor: "border-[#d4af37]/30",
    bgColor: "bg-[#d4af37]/10",
    items: [
      { label: "Entitlements", href: "/ops/entitlements", icon: Key, description: "Grant or revoke product access for workspaces" },
    ],
  },
  {
    id: "monitoring",
    title: "Monitoring",
    description: "System health and logs",
    color: "from-green-500 to-emerald-600",
    borderColor: "border-green-500/30",
    bgColor: "bg-green-950/20",
    items: [
      { label: "System Health", href: "/ops/health", icon: HeartPulse, description: "Real-time health dashboard" },
      { label: "System Logs", href: "/ops/audit", icon: ScrollText, description: "Audit trail and activity logs" },
    ],
  },
  {
    id: "business",
    title: "Business",
    description: "Analytics and operations",
    color: "from-purple-500 to-violet-600",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-950/20",
    items: [
      { label: "Analytics Dashboard", href: "/ops/analytics", icon: BarChart3, description: "Revenue, growth, and usage metrics" },
      { label: "Data Exports", href: "/ops/analytics/exports", icon: Download, description: "Export data to CSV/JSON" },
      { label: "Advanced Operations", href: "/ops/operations", icon: Zap, description: "Bulk ops, scheduling, templates" },
      { label: "Bulk Operations", href: "/ops/operations/bulk", icon: Zap, description: "Multi-workspace actions" },
      { label: "Scheduled Actions", href: "/ops/operations/scheduled", icon: Clock, description: "Future actions and automations" },
      { label: "Workspace Templates", href: "/ops/operations/templates", icon: Copy, description: "Reusable workspace configs" },
      { label: "Saved Filters", href: "/ops/operations/filters", icon: Filter, description: "Saved search presets" },
    ],
  },
  {
    id: "developer",
    title: "Developer",
    description: "Development and debugging tools",
    color: "from-orange-500 to-red-600",
    borderColor: "border-orange-500/30",
    bgColor: "bg-orange-950/20",
    items: [
      { label: "Dev Tools Hub", href: "/ops/dev-tools", icon: Code, description: "All developer utilities" },
      { label: "Webhook Debugger", href: "/ops/dev-tools/webhooks", icon: Webhook, description: "View webhook payloads" },
      { label: "Feature Flags", href: "/ops/dev-tools/feature-flags", icon: Flag, description: "Toggle features per workspace" },
      { label: "SQL Runner", href: "/ops/dev-tools/sql-runner", icon: Database, description: "Execute read-only queries" },
      { label: "API Playground", href: "/ops/dev-tools/api-playground", icon: Play, description: "Test internal endpoints" },
    ],
  },
];

export default async function OpsDashboardPage() {
  assertOpsEnabled();

  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/login?next=/ops");
  }

  const admin = await requirePlatformAdmin();
  
  // Not admin - redirect to claim page
  if (!admin.ok) {
    redirect("/ops/claim");
  }

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <div className="space-y-8">
        {/* Dashboard Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Ops Dashboard</h1>
          <p className="text-slate-400">
            Welcome back, <span className="text-amber-400">{admin.actorEmail}</span>
          </p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickStatCard
            label="Workspaces"
            href="/ops/workspaces"
            icon={Building2}
            color="text-amber-400"
          />
          <QuickStatCard
            label="Customers"
            href="/ops/customers"
            icon={Users}
            color="text-blue-400"
          />
          <QuickStatCard
            label="Health"
            href="/ops/health"
            icon={HeartPulse}
            color="text-green-400"
          />
          <QuickStatCard
            label="Analytics"
            href="/ops/analytics"
            icon={BarChart3}
            color="text-purple-400"
          />
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {menuCategories.map((category) => (
            <div
              key={category.id}
              className={`rounded-xl border ${category.borderColor} ${category.bgColor} overflow-hidden`}
            >
              {/* Category Header */}
              <div className={`bg-gradient-to-r ${category.color} px-6 py-4`}>
                <h2 className="text-xl font-bold text-white">{category.title}</h2>
                <p className="text-white/80 text-sm">{category.description}</p>
              </div>

              {/* Menu Items */}
              <div className="p-4 space-y-2">
                {category.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <item.icon className="h-5 w-5 text-slate-400 group-hover:text-white" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{item.label}</p>
                      <p className="text-slate-500 text-xs truncate">{item.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </OpsShell>
  );
}

function QuickStatCard({
  label,
  href,
  icon: Icon,
  color,
}: {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
    >
      <Icon className={`h-6 w-6 ${color}`} />
      <span className="text-white font-medium">{label}</span>
    </Link>
  );
}
