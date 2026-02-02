"use client";

import { useState, useEffect } from "react";
import { Download, RefreshCw, FileJson, FileSpreadsheet, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ExportJob {
  id: string;
  export_type: string;
  format: string;
  status: string;
  row_count: number | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

const EXPORT_TYPES = [
  { value: "workspaces", label: "Workspaces", description: "All workspace data" },
  { value: "users", label: "Users", description: "User profiles and accounts" },
];

const FORMATS = [
  { value: "json", label: "JSON", icon: FileJson },
  { value: "csv", label: "CSV", icon: FileSpreadsheet },
];

export default function ExportsClient() {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState("workspaces");
  const [format, setFormat] = useState("json");
  const [lastExportData, setLastExportData] = useState<Record<string, unknown>[] | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/ops/exports", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setLastExportData(null);
    try {
      const res = await fetch("/api/ops/exports", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          export_type: exportType,
          format,
          filters: {},
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastExportData(data.data);
        fetchJobs();
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const downloadData = () => {
    if (!lastExportData) return;

    const content =
      format === "json"
        ? JSON.stringify(lastExportData, null, 2)
        : convertToCSV(lastExportData);
    const blob = new Blob([content], {
      type: format === "json" ? "application/json" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportType}-export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: Record<string, unknown>[]): string => {
    if (data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Exports</h1>
          <p className="text-zinc-400">Export workspace and user data</p>
        </div>
        <button
          onClick={fetchJobs}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white hover:bg-zinc-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* New Export */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Create Export</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Export Type
            </label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
            >
              {EXPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-zinc-400">Format</label>
            <div className="flex gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 ${
                    format === f.value
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  <f.icon className="h-4 w-4" />
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting ? "Exporting..." : "Export"}
            </button>
          </div>
        </div>
      </div>

      {/* Export Result */}
      {lastExportData && (
        <div className="rounded-xl border border-green-900/50 bg-green-950/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="font-medium text-white">Export Complete</p>
                <p className="text-sm text-zinc-400">
                  {lastExportData.length} rows exported
                </p>
              </div>
            </div>
            <button
              onClick={downloadData}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Download {format.toUpperCase()}
            </button>
          </div>
          <div className="mt-4 max-h-64 overflow-auto rounded-lg border border-zinc-700 bg-zinc-800 p-4">
            <pre className="text-xs text-zinc-300">
              {JSON.stringify(lastExportData.slice(0, 5), null, 2)}
              {lastExportData.length > 5 && (
                <span className="text-zinc-500">
                  \n... and {lastExportData.length - 5} more rows
                </span>
              )}
            </pre>
          </div>
        </div>
      )}

      {/* Export History */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Export History</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : jobs.length === 0 ? (
          <p className="py-8 text-center text-zinc-500">No exports yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 text-zinc-400">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Format</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Rows</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="py-3 capitalize text-white">
                      {job.export_type}
                    </td>
                    <td className="py-3 uppercase text-zinc-400">
                      {job.format}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="py-3 text-white">{job.row_count ?? "-"}</td>
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
    pending: { icon: Clock, color: "text-yellow-400 bg-yellow-500/10" },
    processing: { icon: Loader2, color: "text-blue-400 bg-blue-500/10" },
    completed: { icon: CheckCircle, color: "text-green-400 bg-green-500/10" },
    failed: { icon: XCircle, color: "text-red-400 bg-red-500/10" },
  };

  const { icon: Icon, color } = config[status] || config.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${color}`}
    >
      <Icon className={`h-3 w-3 ${status === "processing" ? "animate-spin" : ""}`} />
      {status}
    </span>
  );
}
