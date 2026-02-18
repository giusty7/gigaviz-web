"use client";
import { logger } from "@/lib/logging";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Flag, Plus, Check, X } from "lucide-react";

type FeatureFlag = {
  id: string;
  flagKey: string;
  flagName: string;
  description: string | null;
  defaultEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type WorkspaceFlag = {
  id: string;
  workspaceId: string;
  flagKey: string;
  enabled: boolean;
  reason: string | null;
  setBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function FeatureFlagManagerClient() {
  const t = useTranslations("opsUI");
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaceFlags, setWorkspaceFlags] = useState<WorkspaceFlag[]>([]);
  const [showNewFlag, setShowNewFlag] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlags();
  }, []);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceFlags();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function fetchFlags() {
    try {
      const res = await fetch("/api/ops/feature-flags");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setFlags(data.flags || []);
    } catch (err) {
      logger.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function fetchWorkspaceFlags() {
    try {
      const res = await fetch(`/api/ops/feature-flags?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setWorkspaceFlags(data.flags || []);
    } catch (err) {
      logger.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function toggleWorkspaceFlag(flagKey: string, enabled: boolean) {
    try {
      const res = await fetch("/api/ops/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          flagKey,
          enabled,
          reason: enabled ? "Enabled via ops console" : "Disabled via ops console",
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await fetchWorkspaceFlags();
    } catch (err) {
      logger.error(err instanceof Error ? err.message : String(err));
      alert(t("devTools.featureFlags.actionFailed"));
    }
  }

  async function createFlag(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch("/api/ops/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flagKey: formData.get("flagKey"),
          flagName: formData.get("flagName"),
          description: formData.get("description"),
          defaultEnabled: formData.get("defaultEnabled") === "on",
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      await fetchFlags();
      setShowNewFlag(false);
    } catch (err) {
      logger.error(err instanceof Error ? err.message : String(err));
      alert(t("devTools.featureFlags.actionFailed"));
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("devTools.featureFlags.title")}</h1>
          <p className="text-slate-400 mt-1">{t("devTools.featureFlags.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowNewFlag(true)}
          className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
        >
          <Plus className="w-4 h-4" />
          {t("devTools.featureFlags.addFlag")}
        </button>
      </div>

      {showNewFlag && (
        <form onSubmit={createFlag} className="rounded-lg border border-slate-800 bg-slate-950/50 p-6 space-y-4">
          <h3 className="font-semibold text-white">{t("devTools.featureFlags.createFlag")}</h3>
          <div>
            <label className="block text-sm text-slate-400 mb-1">{t("devTools.featureFlags.flagName")}</label>
            <input
              name="flagKey"
              required
              placeholder="my_feature_flag"
              className="w-full px-4 py-2 rounded bg-slate-900 border border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">{t("devTools.featureFlags.description")}</label>
            <input
              name="flagName"
              required
              placeholder="My Feature Flag"
              className="w-full px-4 py-2 rounded bg-slate-900 border border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">{t("devTools.featureFlags.description")}</label>
            <textarea
              name="description"
              rows={2}
              className="w-full px-4 py-2 rounded bg-slate-900 border border-slate-700 text-white"
            />
          </div>
          <label className="flex items-center gap-2 text-white">
            <input type="checkbox" name="defaultEnabled" />
            {t("devTools.featureFlags.enabled")}
          </label>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm">
              {t("devTools.featureFlags.createFlag")}
            </button>
            <button
              type="button"
              onClick={() => setShowNewFlag(false)}
              className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-6 space-y-4">
        <h3 className="font-semibold text-white">{t("devTools.featureFlags.workspaceOverride")}</h3>
        <input
          type="text"
          placeholder="Enter workspace ID..."
          value={workspaceId}
          onChange={(e) => setWorkspaceId(e.target.value)}
          className="w-full px-4 py-2 rounded bg-slate-900 border border-slate-700 text-white"
        />
      </div>

      <div className="space-y-2">
        {flags.map((flag) => {
          const override = workspaceFlags.find((wf) => wf.flagKey === flag.flagKey);
          const isEnabled = override ? override.enabled : flag.defaultEnabled;

          return (
            <div
              key={flag.id}
              className="flex items-center justify-between p-4 rounded border border-slate-800 bg-slate-950/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-blue-400" />
                  <span className="font-medium text-white">{flag.flagName}</span>
                  <code className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {flag.flagKey}
                  </code>
                </div>
                {flag.description && (
                  <p className="text-sm text-slate-400 mt-1">{flag.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span>Default: {flag.defaultEnabled ? "ON" : "OFF"}</span>
                  {override && <span className="text-blue-400">â€¢ Override active</span>}
                </div>
              </div>

              {workspaceId && (
                <button
                  onClick={() => toggleWorkspaceFlag(flag.flagKey, !isEnabled)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isEnabled
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  }`}
                >
                  {isEnabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
