"use client";
import { logger } from "@/lib/logging";

import { useState, useEffect } from "react";
import { Clock, Plus, X, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ScheduledAction {
  id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  payload: Record<string, unknown>;
  reason: string | null;
  scheduled_for: string;
  status: string;
  executed_at: string | null;
  created_at: string;
}

const ACTION_TYPES = [
  { value: "plan_change", label: "Plan Change" },
  { value: "feature_toggle", label: "Feature Toggle" },
  { value: "suspension", label: "Suspension" },
  { value: "notification", label: "Notification" },
];

const TARGET_TYPES = [
  { value: "workspace", label: "Workspace" },
  { value: "user", label: "User" },
];

export default function ScheduledActionsClient() {
  const [actions, setActions] = useState<ScheduledAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [actionType, setActionType] = useState("notification");
  const [targetType, setTargetType] = useState("workspace");
  const [targetId, setTargetId] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [reason, setReason] = useState("");

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ops/scheduled-actions", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setActions(data.actions || []);
      }
    } catch (err) {
      logger.error("Failed to fetch actions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleCreate = async () => {
    if (!targetId || !scheduledFor) return;
    setCreating(true);
    try {
      const res = await fetch("/api/ops/scheduled-actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          action_type: actionType,
          target_type: targetType,
          target_id: targetId,
          payload: {},
          reason,
          scheduled_for: new Date(scheduledFor).toISOString(),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setTargetId("");
        setScheduledFor("");
        setReason("");
        fetchActions();
      }
    } catch (err) {
      logger.error("Create failed:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (actionId: string) => {
    try {
      await fetch("/api/ops/scheduled-actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          action_id: actionId,
        }),
      });
      fetchActions();
    } catch (err) {
      logger.error("Cancel failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Scheduled Actions</h1>
          <p className="text-zinc-400">Schedule future operations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchActions}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white hover:bg-zinc-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Schedule Action
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Clock className="h-5 w-5 text-blue-400" />
            New Scheduled Action
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Action Type</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
              >
                {ACTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
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
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Target ID</label>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="UUID of target"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Scheduled For</label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-2 block text-sm text-zinc-400">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this action scheduled?"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500"
            />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-white hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!targetId || !scheduledFor || creating}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Actions List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Scheduled Actions</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : actions.length === 0 ? (
          <p className="py-8 text-center text-zinc-500">No scheduled actions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 text-zinc-400">
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">Target</th>
                  <th className="pb-3 font-medium">Scheduled For</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Reason</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {actions.map((action) => (
                  <tr key={action.id}>
                    <td className="py-3 capitalize text-white">
                      {action.action_type.replace("_", " ")}
                    </td>
                    <td className="py-3">
                      <span className="text-zinc-400">{action.target_type}:</span>{" "}
                      <span className="font-mono text-xs text-white">
                        {action.target_id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="py-3 text-white">
                      {new Date(action.scheduled_for).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={action.status} />
                    </td>
                    <td className="py-3 text-zinc-400">
                      {action.reason || "-"}
                    </td>
                    <td className="py-3">
                      {action.status === "pending" && (
                        <button
                          onClick={() => handleCancel(action.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
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
    pending: { icon: Clock, color: "text-yellow-400 bg-yellow-500/10" },
    executed: { icon: CheckCircle, color: "text-green-400 bg-green-500/10" },
    cancelled: { icon: XCircle, color: "text-zinc-400 bg-zinc-500/10" },
    failed: { icon: AlertCircle, color: "text-red-400 bg-red-500/10" },
  };

  const { icon: Icon, color } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${color}`}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}
