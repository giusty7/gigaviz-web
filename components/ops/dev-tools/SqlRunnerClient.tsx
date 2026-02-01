"use client";

import { useState, useEffect } from "react";
import { Play, Clock, AlertCircle } from "lucide-react";

type QueryResult = {
  rows: unknown[];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
};

type QueryHistory = {
  id: string;
  adminEmail: string;
  queryText: string;
  executionTimeMs: number;
  rowCount: number;
  errorMessage: string | null;
  createdAt: string;
};

export default function SqlRunnerClient() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch("/api/ops/sql-query");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function executeQuery() {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ops/sql-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      
      const data = await res.json();
      setResult(data);
      await fetchHistory();
    } catch (err) {
      setResult({
        rows: [],
        rowCount: 0,
        executionTimeMs: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">SQL Runner</h1>
        <p className="text-slate-400 mt-1">Execute read-only SQL queries</p>
      </div>

      <div className="rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-4">
        <p className="text-sm text-yellow-400">
          ⚠️ <strong>Read-only mode:</strong> Only SELECT queries are allowed. Must include LIMIT clause (max 100).
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">SQL Query</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM workspaces LIMIT 10;"
            rows={8}
            className="w-full px-4 py-3 rounded bg-slate-900 border border-slate-700 text-white font-mono text-sm"
          />
        </div>

        <button
          onClick={executeQuery}
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium transition-colors"
        >
          {loading ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Execute Query
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Results</h3>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>{result.rowCount} rows</span>
              <span>{result.executionTimeMs}ms</span>
            </div>
          </div>

          {result.error ? (
            <div className="p-4 rounded border border-red-900/50 bg-red-950/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Query Error</p>
                  <p className="text-sm text-red-300 mt-1">{result.error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <pre className="text-xs text-slate-300 bg-slate-900 p-4 rounded">
                {JSON.stringify(result.rows, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-6 space-y-4">
        <h3 className="font-semibold text-white">Query History</h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => setQuery(item.queryText)}
              className="w-full text-left p-3 rounded border border-slate-800 hover:border-slate-700 bg-slate-900/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <code className="text-xs text-slate-300 font-mono break-all">
                  {item.queryText.length > 100
                    ? item.queryText.substring(0, 100) + "..."
                    : item.queryText}
                </code>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-slate-400">{item.executionTimeMs}ms</p>
                  <p className="text-xs text-slate-500">{item.rowCount} rows</p>
                </div>
              </div>
              {item.errorMessage && (
                <p className="text-xs text-red-400 mt-1">{item.errorMessage}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
