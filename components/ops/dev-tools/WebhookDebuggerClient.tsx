"use client";
import { logger } from "@/lib/logging";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Webhook, AlertCircle, CheckCircle2, Clock } from "lucide-react";

type WebhookLog = {
  id: string;
  webhookType: string;
  method: string;
  url: string;
  headers: Record<string, unknown>;
  queryParams: Record<string, unknown>;
  body: Record<string, unknown>;
  rawBody: string | null;
  responseStatus: number | null;
  responseBody: Record<string, unknown> | null;
  processingError: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  workspaceId: string | null;
  processedAt: string | null;
  createdAt: string;
};

export default function WebhookDebuggerClient() {
  const t = useTranslations("opsUI");
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: "", hasError: false });

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function fetchLogs() {
    try {
      const params = new URLSearchParams();
      if (filter.type) params.set("type", filter.type);
      if (filter.hasError) params.set("hasError", "true");

      const res = await fetch(`/api/ops/webhooks?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      logger.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Clock className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("devTools.webhookDebugger.title")}</h1>
          <p className="text-slate-400 mt-1">{t("devTools.webhookDebugger.subtitle")}</p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
        >
          {t("devTools.webhookDebugger.refresh")}
        </button>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder={t("devTools.webhookDebugger.filterType")}
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="flex-1 px-4 py-2 rounded bg-slate-900 border border-slate-700 text-white"
        />
        <label className="flex items-center gap-2 px-4 py-2 rounded bg-slate-900 border border-slate-700 text-white">
          <input
            type="checkbox"
            checked={filter.hasError}
            onChange={(e) => setFilter({ ...filter, hasError: e.target.checked })}
          />
          Errors only
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Logs list */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {logs.map((log) => (
            <button
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className={`w-full text-left p-4 rounded border transition-all ${
                selectedLog?.id === log.id
                  ? "border-blue-500 bg-blue-950/30"
                  : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Webhook className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">{log.webhookType}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {log.method}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 truncate">{log.url}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
                {log.processingError ? (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Log detail */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-6 max-h-[600px] overflow-y-auto">
          {selectedLog ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-white">{t("devTools.webhookDebugger.eventId")}</h3>
              
              <div>
                <p className="text-xs text-slate-400 mb-1">Type</p>
                <p className="text-sm text-white">{selectedLog.webhookType}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1">URL</p>
                <p className="text-sm text-white break-all">{selectedLog.url}</p>
              </div>

              {selectedLog.processingError && (
                <div className="p-3 rounded border border-red-900/50 bg-red-950/20">
                  <p className="text-xs text-red-400 font-medium mb-1">Error</p>
                  <p className="text-sm text-red-300">{selectedLog.processingError}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-400 mb-1">Headers</p>
                <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto">
                  {JSON.stringify(selectedLog.headers, null, 2)}
                </pre>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1">Body</p>
                <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto">
                  {JSON.stringify(selectedLog.body, null, 2)}
                </pre>
              </div>

              {selectedLog.responseBody && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Response</p>
                  <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.responseBody, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-slate-400">{t("devTools.webhookDebugger.noEvents")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
