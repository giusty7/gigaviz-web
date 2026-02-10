"use client";
import { logger } from "@/lib/logging";

import { useState, useEffect } from "react";
import {
  Zap,
  Play,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
} from "lucide-react";

interface BulkJob {
  id: string;
  operation_type: string;
  target_type: string;
  target_count: number | null;
  status: string;
  progress_current: number;
  progress_total: number;
  error_count: number;
  scheduled_for: string | null;
  created_at: string;
}

interface Preview {
  operation_type: string;
  target_count: number;
  targets: Array<{ id: string; name: string }>;
  estimated_duration: string;
  requires_approval: boolean;
}

const OPERATION_TYPES = [
  { value: "email", label: "Send Email", description: "Send bulk email to targets" },
  { value: "notification", label: "Notification", description: "Send in-app notification" },
  { value: "plan_change", label: "Plan Change", description: "Change subscription plan" },
  { value: "feature_toggle", label: "Feature Toggle", description: "Enable/disable features" },
];

const TARGET_TYPES = [
  { value: "workspaces", label: "Workspaces" },
  { value: "users", label: "Users" },
];

export default function BulkOperationsClient() {
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewing, setPreviewing] = useState(false);

  // Form state
  const [operationType, setOperationType] = useState("notification");
  const [targetType, setTargetType] = useState("workspaces");

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ops/bulk-jobs", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      logger.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handlePreview = async () => {
    setPreviewing(true);
    setPreview(null);
    try {
      const res = await fetch("/api/ops/bulk-jobs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preview",
          operation_type: operationType,
          target_type: targetType,
          target_filter: {},
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreview(data);
      }
    } catch (err) {
      logger.error("Preview failed:", err);
    } finally {
      setPreviewing(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/ops/bulk-jobs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          operation_type: operationType,
          target_type: targetType,
          target_filter: {},
          payload: { message: "Bulk operation" },
        }),
      });
      if (res.ok) {
        setPreview(null);
        fetchJobs();
      }
    } catch (err) {
      logger.error("Create failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bulk Operations</h1>
          <p className="text-zinc-400">Execute operations on multiple targets</p>
        </div>
        <button
          onClick={fetchJobs}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white hover:bg-zinc-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* New Operation */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Zap className="h-5 w-5 text-orange-400" />
          Create Bulk Operation
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-zinc-400">Operation Type</label>
            <select
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
            >
              {OPERATION_TYPES.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-zinc-400">Target Type</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
            >
              {TARGET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handlePreview}
              disabled={previewing}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500 bg-amber-500/10 px-4 py-2 text-amber-400 hover:bg-amber-500/20"
            >
              <Eye className="h-4 w-4" />
              {previewing ? "Loading..." : "Preview"}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Result */}
      {preview && (
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Operation Preview</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-zinc-400">Targets</p>
              <p className="text-2xl font-bold text-white">{preview.target_count}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Estimated Duration</p>
              <p className="text-lg font-medium text-white">{preview.estimated_duration}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Approval Required</p>
              <p className={`text-lg font-medium ${preview.requires_approval ? "text-red-400" : "text-green-400"}`}>
                {preview.requires_approval ? "Yes" : "No"}
              </p>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreate}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
              >
                <Play className="h-4 w-4" />
                Create Job
              </button>
            </div>
          </div>
          {preview.targets.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-zinc-400">Sample Targets:</p>
              <div className="flex flex-wrap gap-2">
                {preview.targets.slice(0, 5).map((t) => (
                  <span key={t.id} className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-white">
                    {t.name || t.id.slice(0, 8)}
                  </span>
                ))}
                {preview.targets.length > 5 && (
                  <span className="rounded-full bg-zinc-700 px-3 py-1 text-sm text-zinc-400">
                    +{preview.targets.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Jobs List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Recent Jobs</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : jobs.length === 0 ? (
          <p className="py-8 text-center text-zinc-500">No bulk jobs yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 text-zinc-400">
                  <th className="pb-3 font-medium">Operation</th>
                  <th className="pb-3 font-medium">Targets</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Progress</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="py-3">
                      <span className="capitalize text-white">{job.operation_type.replace("_", " ")}</span>
                      <span className="ml-2 text-zinc-500">â†’ {job.target_type}</span>
                    </td>
                    <td className="py-3 text-white">{job.target_count ?? "-"}</td>
                    <td className="py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="py-3">
                      {job.progress_total > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-700">
                            <div
                              className="h-full bg-amber-500"
                              style={{
                                width: `${(job.progress_current / job.progress_total) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-zinc-400">
                            {job.progress_current}/{job.progress_total}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="py-3 text-zinc-400">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
    draft: { icon: Clock, color: "text-zinc-400 bg-zinc-500/10" },
    pending: { icon: Clock, color: "text-yellow-400 bg-yellow-500/10" },
    processing: { icon: Zap, color: "text-blue-400 bg-blue-500/10" },
    completed: { icon: CheckCircle, color: "text-green-400 bg-green-500/10" },
    failed: { icon: XCircle, color: "text-red-400 bg-red-500/10" },
    cancelled: { icon: Pause, color: "text-zinc-400 bg-zinc-500/10" },
  };

  const { icon: Icon, color } = config[status] || config.draft;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${color}`}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}
