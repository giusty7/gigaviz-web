import { redirect } from "next/navigation";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { supabaseServer } from "@/lib/supabase/server";
import { OpsShell } from "@/components/platform/OpsShell";
import { getOpsDashboardStats } from "@/lib/ops/stats";
import Link from "next/link";
import {
  Building2,
  Users,
  HeartPulse,
  BarChart3,
  ArrowRight,
  ArrowUpRight,
  Ticket,
  Mail,
  MessageCircle,
  Target,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  Store,
  Zap,
  Code,
  BookOpen,
  Key,
  ScrollText,
  LayoutPanelLeft,
  Activity,
  Copy,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OpsDashboardPage() {
  assertOpsEnabled();

  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/login?next=/ops");
  }

  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    redirect("/ops/claim");
  }

  const stats = await getOpsDashboardStats();

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <div className="space-y-8">
        {/* Dashboard Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Ops Dashboard</h1>
          <p className="mt-1 text-slate-400">
            Welcome back, <span className="text-amber-400">{admin.actorEmail}</span> — Real-time platform overview
          </p>
        </div>

        {/* Alerts Banner */}
        {(stats.leads.pending > 0 || stats.tickets.open > 0 || stats.health.pendingMarketplaceItems > 0) && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h2 className="font-semibold text-amber-400">Action Required</h2>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {stats.leads.pending > 0 && (
                <Link href="/ops/leads" className="flex items-center gap-1 text-amber-300 hover:text-white transition-colors">
                  <Target className="h-4 w-4" />
                  {stats.leads.pending} pending leads
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
              {stats.tickets.open > 0 && (
                <Link href="/ops/tickets" className="flex items-center gap-1 text-amber-300 hover:text-white transition-colors">
                  <Ticket className="h-4 w-4" />
                  {stats.tickets.open} open tickets
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
              {stats.health.pendingMarketplaceItems > 0 && (
                <Link href="/ops/marketplace" className="flex items-center gap-1 text-amber-300 hover:text-white transition-colors">
                  <Store className="h-4 w-4" />
                  {stats.health.pendingMarketplaceItems} marketplace items pending review
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Workspaces"
            value={stats.workspaces.total}
            sub={`+${stats.workspaces.createdLast7d} this week`}
            icon={Building2}
            color="text-blue-400"
            href="/ops/workspaces"
          />
          <StatCard
            label="Users"
            value={stats.users.total}
            sub={`+${stats.users.registeredLast7d} this week`}
            icon={Users}
            color="text-green-400"
            href="/ops/customers"
          />
          <StatCard
            label="Leads"
            value={stats.leads.total}
            sub={`+${stats.leads.newLast7d} this week · ${stats.leads.pending} pending`}
            icon={Target}
            color="text-amber-400"
            href="/ops/leads"
            highlight={stats.leads.pending > 0}
          />
          <StatCard
            label="Newsletter"
            value={stats.newsletter.total}
            sub={`+${stats.newsletter.subscribedLast7d} this week`}
            icon={Mail}
            color="text-purple-400"
            href="/ops/newsletter"
          />
        </div>

        {/* Second Row: Revenue + Support */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Revenue"
            value={`$${(stats.revenue.marketplacePlatformFeeCents / 100).toFixed(2)}`}
            sub={`${stats.revenue.totalPurchases} marketplace purchases`}
            icon={DollarSign}
            color="text-emerald-400"
            href="/ops/analytics"
          />
          <StatCard
            label="Open Tickets"
            value={stats.tickets.open}
            sub={`${stats.tickets.total} total tickets`}
            icon={Ticket}
            color="text-orange-400"
            href="/ops/tickets"
            highlight={stats.tickets.open > 0}
          />
          <StatCard
            label="Active Workspaces"
            value={stats.workspaces.active}
            sub={`${stats.workspaces.suspended} suspended`}
            icon={TrendingUp}
            color="text-cyan-400"
            href="/ops/workspaces"
          />
          <StatCard
            label="System Health"
            value={`${stats.health.apiRoutes}`}
            sub="API routes monitored"
            icon={HeartPulse}
            color="text-green-400"
            href="/ops/health"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leads & Growth */}
          <QuickActionCard
            title="Leads & Growth"
            description="Marketing leads, contact form submissions, and newsletter"
            color="from-amber-500 to-yellow-600"
            borderColor="border-amber-500/30"
            items={[
              { label: "All Leads", href: "/ops/leads", icon: Target, description: "Marketing leads + contact form submissions" },
              { label: "Newsletter", href: "/ops/newsletter", icon: Mail, description: `${stats.newsletter.total} subscribers` },
              { label: "Internal WA", href: "/ops/leads?action=wa", icon: MessageCircle, description: "WhatsApp follow-up to leads" },
            ]}
          />

          {/* Core Operations */}
          <QuickActionCard
            title="Core Operations"
            description="Workspace management, customers, and entitlements"
            color="from-blue-500 to-cyan-600"
            borderColor="border-blue-500/30"
            items={[
              { label: "Sovereign Command", href: "/ops/god-console", icon: LayoutPanelLeft, description: "Full control center" },
              { label: "Workspaces", href: "/ops/workspaces", icon: Building2, description: `${stats.workspaces.total} total` },
              { label: "Customers", href: "/ops/customers", icon: Users, description: `${stats.users.total} users` },
              { label: "Entitlements", href: "/ops/entitlements", icon: Key, description: "Grant product access" },
              { label: "Knowledge", href: "/ops/platform-kb", icon: BookOpen, description: "Platform AI knowledge base" },
            ]}
          />

          {/* Support */}
          <QuickActionCard
            title="Support & Tickets"
            description="Customer support, SLA tracking, and canned responses"
            color="from-orange-500 to-red-500"
            borderColor="border-orange-500/30"
            items={[
              { label: "Support Tickets", href: "/ops/tickets", icon: Ticket, description: `${stats.tickets.open} open` },
              { label: "Canned Responses", href: "/ops/canned-responses", icon: Copy, description: "Response templates" },
            ]}
          />

          {/* Monitoring */}
          <QuickActionCard
            title="Monitoring"
            description="System health, logs, and team activity"
            color="from-green-500 to-emerald-600"
            borderColor="border-green-500/30"
            items={[
              { label: "System Health", href: "/ops/health", icon: HeartPulse, description: "Real-time monitoring" },
              { label: "Audit Logs", href: "/ops/audit", icon: ScrollText, description: "Action history" },
              { label: "Team Activity", href: "/ops/activity", icon: Activity, description: "Ops team actions" },
            ]}
          />

          {/* Business */}
          <QuickActionCard
            title="Business & Revenue"
            description="Analytics, marketplace moderation, and operations"
            color="from-purple-500 to-violet-600"
            borderColor="border-purple-500/30"
            items={[
              { label: "Analytics", href: "/ops/analytics", icon: BarChart3, description: "Revenue and growth" },
              { label: "Marketplace", href: "/ops/marketplace", icon: Store, description: `${stats.health.pendingMarketplaceItems} pending review` },
              { label: "Operations", href: "/ops/operations", icon: Zap, description: "Bulk ops and scheduling" },
            ]}
          />

          {/* Developer */}
          <QuickActionCard
            title="Developer Tools"
            description="Debugging, feature flags, and API testing"
            color="from-slate-500 to-zinc-600"
            borderColor="border-slate-500/30"
            items={[
              { label: "Dev Tools Hub", href: "/ops/dev-tools", icon: Code, description: "All dev utilities" },
            ]}
          />
        </div>

        {/* Quick Links Footer */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-400" />
              Quick Links
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Link href="/ops/leads" className="rounded-lg border border-slate-700 p-3 hover:bg-slate-700/50 transition-colors">
              <p className="font-medium text-white">View Leads</p>
              <p className="text-xs text-slate-400">Marketing + contact form</p>
            </Link>
            <Link href="/ops/newsletter" className="rounded-lg border border-slate-700 p-3 hover:bg-slate-700/50 transition-colors">
              <p className="font-medium text-white">Newsletter</p>
              <p className="text-xs text-slate-400">{stats.newsletter.total} subscribers</p>
            </Link>
            <Link href="/ops/tickets" className="rounded-lg border border-slate-700 p-3 hover:bg-slate-700/50 transition-colors">
              <p className="font-medium text-white">Tickets</p>
              <p className="text-xs text-slate-400">{stats.tickets.open} open</p>
            </Link>
            <Link href="/ops/activity" className="rounded-lg border border-slate-700 p-3 hover:bg-slate-700/50 transition-colors">
              <p className="font-medium text-white">Activity</p>
              <p className="text-xs text-slate-400">Team actions log</p>
            </Link>
          </div>
        </div>
      </div>
    </OpsShell>
  );
}

/* ───────── Sub-components ───────── */

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  href,
  highlight,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative group rounded-xl border p-4 transition-colors ${
        highlight
          ? "border-amber-500/40 bg-amber-950/20 hover:bg-amber-900/30"
          : "border-slate-700 bg-slate-800/50 hover:bg-slate-700/50"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </Link>
  );
}

function QuickActionCard({
  title,
  description,
  color,
  borderColor,
  items,
}: {
  title: string;
  description: string;
  color: string;
  borderColor: string;
  items: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }>;
}) {
  return (
    <div className={`rounded-xl border ${borderColor} bg-slate-800/30 overflow-hidden`}>
      <div className={`bg-gradient-to-r ${color} px-5 py-3`}>
        <h2 className="font-bold text-white">{title}</h2>
        <p className="text-white/70 text-xs">{description}</p>
      </div>
      <div className="p-3 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
          >
            <item.icon className="h-4 w-4 text-slate-400 group-hover:text-white" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{item.label}</p>
              <p className="text-slate-500 text-xs truncate">{item.description}</p>
            </div>
            <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-amber-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
