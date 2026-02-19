"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Activity,
  Database,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  Briefcase,
  HardDrive,
} from "lucide-react";
import type { HealthStatus, LatestHealthStatus, SystemOverview, StaleWorker } from "@/lib/ops/health-types";

type HealthSummary = {
  overallStatus: HealthStatus;
  checks: LatestHealthStatus[];
  systemOverview: SystemOverview;
  staleWorkers: StaleWorker[];
  summary: {
    totalChecks: number;
    healthyChecks: number;
    degradedChecks: number;
    unhealthyChecks: number;
  };
};

export default function HealthDashboardClient() {
  const t = useTranslations("opsUI");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HealthSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/ops/health", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error(t("health.checkFailed"));
        if (res.status === 403) throw new Error(t("health.checkFailed"));
        throw new Error(t("health.checkFailed"));
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Error loading health data: {error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const statusColor = {
    healthy: "text-green-400",
    degraded: "text-yellow-400",
    unhealthy: "text-red-400",
    unknown: "text-slate-400",
  };

  const statusBg = {
    healthy: "bg-green-950/30 border-green-900/50",
    degraded: "bg-yellow-950/30 border-yellow-900/50",
    unhealthy: "bg-red-950/30 border-red-900/50",
    unknown: "bg-slate-950/30 border-slate-900/50",
  };

  const StatusIcon = ({ status }: { status: HealthStatus }) => {
    if (status === "healthy") return <CheckCircle2 className="w-5 h-5" />;
    if (status === "unhealthy") return <AlertCircle className="w-5 h-5" />;
    return <Clock className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`rounded-lg border p-6 ${statusBg[data.overallStatus]}`}>
        <div className="flex items-center gap-4">
          <div className={statusColor[data.overallStatus]}>
            <StatusIcon status={data.overallStatus} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{t("health.title")}</h2>
            <p className={`text-sm ${statusColor[data.overallStatus]}`}>
              {data.overallStatus.toUpperCase()} - {data.summary.healthyChecks}/{data.summary.totalChecks} checks passing
            </p>
          </div>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-white">{data.systemOverview.workspaces.total}</div>
              <div className="text-sm text-slate-400">Total Workspaces</div>
              <div className="text-xs text-slate-500">{data.systemOverview.workspaces.active_24h} active (24h)</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-400" />
            <div>
              <div className="text-2xl font-bold text-white">{data.systemOverview.users.total}</div>
              <div className="text-sm text-slate-400">Total Users</div>
              <div className="text-xs text-slate-500">{data.systemOverview.users.active_24h} active (24h)</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-purple-400" />
            <div>
              <div className="text-2xl font-bold text-white">{data.systemOverview.tickets.open}</div>
              <div className="text-sm text-slate-400">Open Tickets</div>
              <div className="text-xs text-slate-500">{data.systemOverview.tickets.total} total</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center gap-3">
            <HardDrive className="w-8 h-8 text-orange-400" />
            <div>
              <div className="text-2xl font-bold text-white">{data.systemOverview.database.size_mb} MB</div>
              <div className="text-sm text-slate-400">Database Size</div>
              <div className="text-xs text-slate-500">PostgreSQL</div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Checks */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">{t("health.title")}</h3>
        </div>

        {data.checks.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No health checks recorded yet</div>
        ) : (
          <div className="space-y-2">
            {data.checks.map((check, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded border border-slate-800 bg-slate-900/50"
              >
                <div className="flex items-center gap-3">
                  <div className={statusColor[check.status]}>
                    <StatusIcon status={check.status} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{check.checkName}</div>
                    <div className="text-xs text-slate-400">{check.checkType}</div>
                  </div>
                </div>
                <div className="text-right">
                  {check.responseTimeMs && (
                    <div className="text-sm text-slate-300">{check.responseTimeMs}ms</div>
                  )}
                  <div className="text-xs text-slate-500">
                    {new Date(check.checkedAt).toLocaleTimeString()}
                  </div>
                  {check.errorMessage && (
                    <div className="text-xs text-red-400 max-w-xs truncate">{check.errorMessage}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stale Workers */}
      {data.staleWorkers.length > 0 && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Stale Workers</h3>
            <span className="text-xs text-red-400">({data.staleWorkers.length})</span>
          </div>

          <div className="space-y-2">
            {data.staleWorkers.map((worker, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded border border-red-900/50 bg-red-950/30">
                <div>
                  <div className="text-sm font-medium text-white">{worker.workerName}</div>
                  <div className="text-xs text-slate-400">{worker.workerType}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-red-400">
                    {Math.round(worker.minutesSinceHeartbeat)} minutes ago
                  </div>
                  <div className="text-xs text-slate-500">{worker.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center text-xs text-slate-500">
        {t("health.lastChecked", { time: new Date().toLocaleString() })}
      </div>
    </div>
  );
}
