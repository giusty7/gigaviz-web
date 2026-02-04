"use client";

import { useState } from "react";
import { Download, FileJson, FileText } from "lucide-react";

type AuditEvent = {
  id: string;
  action: string;
  actor_email: string | null;
  created_at: string;
  meta: Record<string, unknown> | null;
};

type AuditLogExportProps = {
  events: AuditEvent[];
  workspaceName: string;
};

export function AuditLogExport({ events, workspaceName }: AuditLogExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const headers = ["Timestamp", "Action", "Actor", "Details"];
      const rows = events.map((evt) => [
        new Date(evt.created_at).toISOString(),
        evt.action,
        evt.actor_email || "Unknown",
        evt.meta ? JSON.stringify(evt.meta) : "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${workspaceName.toLowerCase().replace(/\s+/g, "-")}-audit-log-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    try {
      const exportData = {
        workspace: workspaceName,
        exported_at: new Date().toISOString(),
        total_events: events.length,
        events: events.map((evt) => ({
          timestamp: evt.created_at,
          action: evt.action,
          actor: evt.actor_email || "Unknown",
          metadata: evt.meta,
        })),
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${workspaceName.toLowerCase().replace(/\s+/g, "-")}-audit-log-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("JSON export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportToCSV}
        disabled={isExporting || events.length === 0}
        className="flex items-center gap-2 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-2 text-xs font-semibold text-[#d4af37] transition hover:bg-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export as CSV"
      >
        <FileText className="h-4 w-4" />
        CSV
      </button>
      <button
        onClick={exportToJSON}
        disabled={isExporting || events.length === 0}
        className="flex items-center gap-2 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-2 text-xs font-semibold text-[#d4af37] transition hover:bg-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export as JSON"
      >
        <FileJson className="h-4 w-4" />
        JSON
      </button>
      {isExporting && (
        <span className="text-xs text-[#f5f5dc]/50 flex items-center gap-2">
          <Download className="h-4 w-4 animate-bounce" />
          Exporting...
        </span>
      )}
    </div>
  );
}
