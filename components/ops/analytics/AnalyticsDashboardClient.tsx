"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  DollarSign,
  RefreshCw,
  Download,
} from "lucide-react";
import Link from "next/link";

interface AnalyticsSummary {
  current: {
    total_workspaces: number;
    active_workspaces: number;
    total_users: number;
    total_mrr: number;
  };
  growth: {
    workspaces_change: number;
    workspaces_percent: number;
    users_change: number;
    users_percent: number;
    mrr_change: number;
    mrr_percent: number;
  };
  plan_distribution: Record<string, number>;
  recent_snapshots: Array<{
    snapshot_date: string;
    total_workspaces: number;
    total_users: number;
    new_workspaces: number;
    new_users: number;
  }>;
}

export default function AnalyticsDashboardClient() {
  const t = useTranslations("opsUI");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ops/analytics?action=summary", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t("analytics.title")}</h1>
            <p className="text-zinc-400">{t("analytics.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t("analytics.title")}</h1>
            <p className="text-zinc-400">{t("analytics.subtitle")}</p>
          </div>
        </div>
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("analytics.title")}</h1>
          <p className="text-zinc-400">{t("analytics.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/ops/analytics/exports"
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white hover:bg-zinc-700"
          >
            <Download className="h-4 w-4" />
            Export Data
          </Link>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={t("analytics.totalWorkspaces")}
          value={summary?.current.total_workspaces || 0}
          change={summary?.growth.workspaces_change || 0}
          changePercent={summary?.growth.workspaces_percent || 0}
          icon={Building2}
          color="blue"
        />
        <MetricCard
          title={t("analytics.totalWorkspaces")}
          value={summary?.current.active_workspaces || 0}
          subtitle="Last 30 days"
          icon={Building2}
          color="green"
        />
        <MetricCard
          title={t("analytics.activeUsers")}
          value={summary?.current.total_users || 0}
          change={summary?.growth.users_change || 0}
          changePercent={summary?.growth.users_percent || 0}
          icon={Users}
          color="purple"
        />
        <MetricCard
          title={t("analytics.revenue")}
          value={summary?.current.total_mrr || 0}
          prefix="$"
          change={summary?.growth.mrr_change || 0}
          changePercent={summary?.growth.mrr_percent || 0}
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Plan Distribution */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <BarChart3 className="h-5 w-5 text-blue-400" />
          {t("analytics.planDistribution")}
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Object.entries(summary?.plan_distribution || {}).map(
            ([plan, count]) => (
              <div
                key={plan}
                className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4"
              >
                <p className="text-sm capitalize text-zinc-400">{plan}</p>
                <p className="text-2xl font-bold text-white">{count}</p>
              </div>
            )
          )}
          {Object.keys(summary?.plan_distribution || {}).length === 0 && (
            <p className="col-span-4 text-center text-zinc-500">
              {t("analytics.noData")}
            </p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          {t("analytics.activityOverview")}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-400">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Total Workspaces</th>
                <th className="pb-3 font-medium">New Workspaces</th>
                <th className="pb-3 font-medium">Total Users</th>
                <th className="pb-3 font-medium">New Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(summary?.recent_snapshots || []).map((snapshot) => (
                <tr key={snapshot.snapshot_date} className="text-white">
                  <td className="py-3">{snapshot.snapshot_date}</td>
                  <td className="py-3">{snapshot.total_workspaces}</td>
                  <td className="py-3 text-green-400">
                    +{snapshot.new_workspaces}
                  </td>
                  <td className="py-3">{snapshot.total_users}</td>
                  <td className="py-3 text-green-400">+{snapshot.new_users}</td>
                </tr>
              ))}
              {(summary?.recent_snapshots || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    No snapshot data yet. Run daily snapshot job to populate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  prefix = "",
  subtitle,
  change,
  changePercent,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  prefix?: string;
  subtitle?: string;
  change?: number;
  changePercent?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "green" | "purple" | "amber";
}) {
  const t = useTranslations("opsUI");
  const colors = {
    blue: "text-blue-400 bg-blue-500/10",
    green: "text-green-400 bg-green-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    amber: "text-amber-400 bg-amber-500/10",
  };

  const isPositive = (change || 0) >= 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{title}</p>
        <div className={`rounded-lg p-2 ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-2 text-3xl font-bold text-white">
        {prefix}
        {value.toLocaleString()}
      </p>
      {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
      {change !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-400" />
          )}
          <span
            className={`text-sm ${isPositive ? "text-green-400" : "text-red-400"}`}
          >
            {isPositive ? "+" : ""}
            {change} ({changePercent?.toFixed(1)}%)
          </span>
          <span className="text-xs text-zinc-500">{t("analytics.vs30dAgo")}</span>
        </div>
      )}
    </div>
  );
}
