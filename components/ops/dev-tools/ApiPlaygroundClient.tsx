"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send, Copy, Check, Clock, XCircle } from "lucide-react";

interface RequestConfig {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  endpoint: string;
  body: string;
  headers: Record<string, string>;
}

interface Response {
  status: number;
  statusText: string;
  body: unknown;
  duration: number;
  timestamp: string;
}

const SAMPLE_ENDPOINTS = [
  { label: "Health Status", method: "GET", endpoint: "/api/ops/health" },
  { label: "Analytics Summary", method: "GET", endpoint: "/api/ops/analytics?action=summary" },
  { label: "List Webhooks", method: "GET", endpoint: "/api/ops/webhooks?limit=10" },
  { label: "Feature Flags", method: "GET", endpoint: "/api/ops/feature-flags" },
  { label: "Bulk Jobs", method: "GET", endpoint: "/api/ops/bulk-jobs" },
  { label: "Scheduled Actions", method: "GET", endpoint: "/api/ops/scheduled-actions" },
  { label: "Workspaces", method: "GET", endpoint: "/api/ops/workspaces?limit=10" },
  { label: "Customers", method: "GET", endpoint: "/api/ops/customers?limit=10" },
];

export default function ApiPlaygroundClient() {
  const t = useTranslations("opsUI");
  const [config, setConfig] = useState<RequestConfig>({
    method: "GET",
    endpoint: "/api/ops/health",
    body: "{}",
    headers: {},
  });
  const [response, setResponse] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<Response[]>([]);

  const executeRequest = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const fetchOptions: RequestInit = {
        method: config.method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...config.headers,
        },
      };

      if (config.method !== "GET" && config.body) {
        fetchOptions.body = config.body;
      }

      const res = await fetch(config.endpoint, fetchOptions);
      const duration = Date.now() - startTime;

      let body: unknown;
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        body = await res.json();
      } else {
        body = await res.text();
      }

      const newResponse: Response = {
        status: res.status,
        statusText: res.statusText,
        body,
        duration,
        timestamp: new Date().toISOString(),
      };

      setResponse(newResponse);
      setHistory((prev) => [newResponse, ...prev.slice(0, 9)]);
    } catch (error) {
      const duration = Date.now() - startTime;
      const newResponse: Response = {
        status: 0,
        statusText: "Network Error",
        body: error instanceof Error ? error.message : "Unknown error",
        duration,
        timestamp: new Date().toISOString(),
      };
      setResponse(newResponse);
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = async () => {
    if (response) {
      await navigator.clipboard.writeText(JSON.stringify(response.body, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-400";
    if (status >= 400 && status < 500) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("devTools.apiPlayground.title")}</h1>
        <p className="text-slate-400 mt-1">{t("devTools.apiPlayground.subtitle")}</p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {SAMPLE_ENDPOINTS.map((sample) => (
          <button
            key={sample.endpoint}
            onClick={() =>
              setConfig({
                ...config,
                method: sample.method as RequestConfig["method"],
                endpoint: sample.endpoint,
              })
            }
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
          >
            {sample.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Panel */}
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h2 className="text-lg font-semibold text-white mb-4">{t("devTools.apiPlayground.endpoint")}</h2>

            {/* Method + Endpoint */}
            <div className="flex gap-2 mb-4">
              <select
                value={config.method}
                onChange={(e) =>
                  setConfig({ ...config, method: e.target.value as RequestConfig["method"] })
                }
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>

              <input
                type="text"
                value={config.endpoint}
                onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                placeholder="/api/ops/..."
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm placeholder:text-slate-500"
              />

              <button
                onClick={executeRequest}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {loading ? "..." : t("devTools.apiPlayground.send")}
              </button>
            </div>

            {/* Body (for non-GET) */}
            {config.method !== "GET" && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {t("devTools.apiPlayground.body")}
                </label>
                <textarea
                  value={config.body}
                  onChange={(e) => setConfig({ ...config, body: e.target.value })}
                  rows={6}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-mono text-slate-300"
                  placeholder="{}"
                />
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Recent Requests</h3>
              <div className="space-y-2">
                {history.slice(0, 5).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs text-slate-400 py-1 border-b border-slate-800 last:border-0"
                  >
                    <span className={getStatusColor(item.status)}>{item.status}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.duration}ms
                    </span>
                    <span className="text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Response Panel */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">{t("devTools.apiPlayground.response")}</h2>
            {response && (
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${getStatusColor(response.status)}`}>
                  {response.status} {response.statusText}
                </span>
                <span className="text-xs text-slate-500">{response.duration}ms</span>
                <button
                  onClick={copyResponse}
                  className="text-slate-400 hover:text-white"
                  title="Copy response"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>

          {response ? (
            <pre className="overflow-auto rounded-lg bg-slate-900 p-4 text-xs font-mono text-slate-300 max-h-[500px]">
              {typeof response.body === "string"
                ? response.body
                : JSON.stringify(response.body, null, 2)}
            </pre>
          ) : (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <XCircle className="h-8 w-8 mr-2" />
              {t("devTools.apiPlayground.noResponse")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
