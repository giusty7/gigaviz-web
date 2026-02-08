import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { OpsShell } from "@/components/platform/OpsShell";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  Clock,
  Eye,
  Shield,
  Users,
  Zap,
  Key,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Ops Activity | Ops Console",
  description: "Real-time overview of ops team activity",
};

export const dynamic = "force-dynamic";

type AuditRow = {
  id: string;
  action: string;
  actor_email?: string | null;
  actor_role?: string | null;
  workspace_id?: string | null;
  target_table?: string | null;
  target_id?: string | null;
  created_at?: string | null;
  meta?: Record<string, unknown> | null;
};

type ImpersonationRow = {
  id: string;
  actor_user_id: string;
  target_user_id: string;
  workspace_id: string;
  status: string;
  started_at?: string | null;
  expires_at?: string | null;
};

const ACTION_CATEGORIES: Record<string, { label: string; color: string; icon: string }> = {
  suspend: { label: "Suspension", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: "🔴" },
  unsuspend: { label: "Unsuspend", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: "🟢" },
  entitlement: { label: "Entitlement", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: "🔑" },
  token: { label: "Tokens", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: "🪙" },
  flag: { label: "Feature Flag", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: "🏁" },
  note: { label: "Note", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: "📝" },
  impersonation: { label: "Impersonation", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: "👁️" },
};

function categorizeAction(action: string): { label: string; color: string; icon: string } {
  const lower = action.toLowerCase();
  if (lower.includes("suspend") && !lower.includes("unsuspend")) return ACTION_CATEGORIES.suspend;
  if (lower.includes("unsuspend")) return ACTION_CATEGORIES.unsuspend;
  if (lower.includes("entitlement")) return ACTION_CATEGORIES.entitlement;
  if (lower.includes("token") || lower.includes("deduct") || lower.includes("grant")) return ACTION_CATEGORIES.token;
  if (lower.includes("flag")) return ACTION_CATEGORIES.flag;
  if (lower.includes("note")) return ACTION_CATEGORIES.note;
  if (lower.includes("impersonat")) return ACTION_CATEGORIES.impersonation;
  return { label: action, color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: "📋" };
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default async function OpsActivityPage() {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  const db = supabaseAdmin();

  // Fetch recent activity, active impersonations, and actor stats in parallel
  const [recentRes, impersonationsRes, , todayStatsRes] = await Promise.all([
    // Last 100 audit actions
    db
      .from("owner_audit_log")
      .select("id, action, actor_email, actor_role, workspace_id, target_table, target_id, created_at, meta")
      .order("created_at", { ascending: false })
      .limit(100),

    // Active impersonation sessions
    db
      .from("ops_impersonations")
      .select("id, actor_user_id, target_user_id, workspace_id, status, started_at, expires_at")
      .eq("status", "active")
      .order("started_at", { ascending: false }),

    // Top actors (last 7 days) — RPC may not exist yet, gracefully fallback
    Promise.resolve(db.rpc("ops_actor_stats_7d")).catch(() => ({ data: null, error: null })),

    // Today's action count
    db
      .from("owner_audit_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ]);

  const recentActions = (recentRes.data ?? []) as AuditRow[];
  const activeImpersonations = (impersonationsRes.data ?? []) as ImpersonationRow[];
  const todayCount = todayStatsRes.count ?? 0;

  // Compute actor stats from recent actions (fallback if RPC not available)
  const actorMap = new Map<string, number>();
  for (const row of recentActions) {
    const email = row.actor_email ?? "unknown";
    actorMap.set(email, (actorMap.get(email) ?? 0) + 1);
  }
  const topActors = Array.from(actorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Action type distribution
  const actionTypeMap = new Map<string, number>();
  for (const row of recentActions) {
    const cat = categorizeAction(row.action);
    actionTypeMap.set(cat.label, (actionTypeMap.get(cat.label) ?? 0) + 1);
  }
  const actionDistribution = Array.from(actionTypeMap.entries())
    .sort((a, b) => b[1] - a[1]);

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-amber-400" />
            Ops Activity
          </h1>
          <p className="text-slate-400">
            Real-time overview of who&apos;s doing what across the ops team
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Zap className="h-5 w-5 text-amber-400" />}
            label="Today"
            value={todayCount.toString()}
            sub="actions"
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-blue-400" />}
            label="Active Actors"
            value={topActors.length.toString()}
            sub="last 100 actions"
          />
          <StatCard
            icon={<Eye className="h-5 w-5 text-yellow-400" />}
            label="Impersonations"
            value={activeImpersonations.length.toString()}
            sub="active now"
          />
          <StatCard
            icon={<Shield className="h-5 w-5 text-green-400" />}
            label="Categories"
            value={actionDistribution.length.toString()}
            sub="action types"
          />
        </div>

        {/* Active Impersonation Alert */}
        {activeImpersonations.length > 0 && (
          <Card className="border-yellow-500/30 bg-yellow-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-yellow-400 flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4" />
                Active Impersonation Sessions ({activeImpersonations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeImpersonations.map((imp) => (
                  <div
                    key={imp.id}
                    className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-yellow-400" />
                      <span className="text-slate-300">
                        Actor: <span className="text-white font-mono text-xs">{imp.actor_user_id.slice(0, 8)}…</span>
                        {" → "}
                        Target: <span className="text-white font-mono text-xs">{imp.target_user_id.slice(0, 8)}…</span>
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Expires {imp.expires_at ? timeAgo(imp.expires_at) : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Actors */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                Top Actors (Last 100)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topActors.map(([email, count], i) => (
                  <div
                    key={email}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-500 w-5 text-right font-mono text-xs">
                        {i + 1}.
                      </span>
                      <span className="text-slate-300 truncate">{email}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                ))}
                {topActors.length === 0 && (
                  <p className="text-sm text-slate-500">No activity recorded</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Distribution */}
          <Card className="border-slate-800 bg-slate-900/50 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Key className="h-4 w-4 text-purple-400" />
                Action Distribution (Last 100)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {actionDistribution.map(([label, count]) => {
                  const cat = Object.values(ACTION_CATEGORIES).find((c) => c.label === label);
                  return (
                    <div
                      key={label}
                      className={`rounded-lg border px-3 py-2 text-sm ${cat?.color ?? "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}
                    >
                      <div className="font-medium">
                        {cat?.icon ?? "📋"} {label}
                      </div>
                      <div className="text-lg font-bold">{count}</div>
                    </div>
                  );
                })}
                {actionDistribution.length === 0 && (
                  <p className="text-sm text-slate-500 col-span-full">No actions recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Timeline */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400 w-[140px]">Time</TableHead>
                    <TableHead className="text-slate-400">Actor</TableHead>
                    <TableHead className="text-slate-400">Action</TableHead>
                    <TableHead className="text-slate-400">Target</TableHead>
                    <TableHead className="text-slate-400">Workspace</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActions.slice(0, 50).map((row) => {
                    const cat = categorizeAction(row.action);
                    return (
                      <TableRow key={row.id} className="border-slate-800/50">
                        <TableCell className="text-xs text-slate-500 font-mono">
                          {timeAgo(row.created_at)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-300 max-w-[180px] truncate">
                          {row.actor_email ?? "system"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${cat.color}`}
                          >
                            {cat.icon} {row.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-400 font-mono">
                          {row.target_table ? `${row.target_table}` : "—"}
                          {row.target_id ? ` #${row.target_id.slice(0, 8)}` : ""}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 font-mono">
                          {row.workspace_id ? row.workspace_id.slice(0, 8) + "…" : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {recentActions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                        No activity recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {recentActions.length > 50 && (
              <p className="mt-3 text-xs text-slate-500 text-center">
                Showing 50 of {recentActions.length} recent actions.{" "}
                <Link href="/ops/audit" className="text-amber-400 hover:underline">
                  View full audit log →
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </OpsShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}
