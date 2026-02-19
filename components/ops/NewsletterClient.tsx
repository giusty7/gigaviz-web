"use client";

import { useState, useMemo } from "react";
import {
  Mail,
  Search,
  Download,
  Trash2,
  Clock,
  TrendingUp,
  Globe,
  RefreshCw,
} from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  source?: string | null;
  locale?: string | null;
  created_at: string;
}

interface NewsletterClientProps {
  initialSubscribers: Subscriber[];
  stats: {
    total: number;
    last7d: number;
  };
  error?: string;
}

export function NewsletterClient({ initialSubscribers, stats, error }: NewsletterClientProps) {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return subscribers;
    return subscribers.filter(
      (sub) =>
        sub.email.toLowerCase().includes(search.toLowerCase()) ||
        (sub.source && sub.source.toLowerCase().includes(search.toLowerCase()))
    );
  }, [subscribers, search]);

  async function handleDelete(id: string) {
    if (!confirm("Remove this subscriber?")) return;
    setDeleting(id);
    try {
      const res = await fetch("/api/ops/newsletter/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setSubscribers((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      // Silently handle
    } finally {
      setDeleting(null);
    }
  }

  function handleExportCsv() {
    const rows = [
      ["Email", "Source", "Locale", "Subscribed At"],
      ...subscribers.map((s) => [
        s.email,
        s.source || "",
        s.locale || "",
        new Date(s.created_at).toISOString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/ops/newsletter/list");
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers ?? []);
      }
    } catch {
      // Silently handle
    } finally {
      setRefreshing(false);
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 flex items-center gap-4">
          <Mail className="h-8 w-8 text-purple-400" />
          <div>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-slate-400">Total Subscribers</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 flex items-center gap-4">
          <TrendingUp className="h-8 w-8 text-green-400" />
          <div>
            <p className="text-3xl font-bold text-white">+{stats.last7d}</p>
            <p className="text-sm text-slate-400">This Week</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by email or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-purple-500/50 transition-colors text-sm"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-purple-500/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <p className="text-sm text-slate-500">
        Showing {filtered.length} of {subscribers.length} subscribers
      </p>

      {/* Table */}
      <div className="rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Locale</th>
                <th className="px-4 py-3 text-left">Subscribed</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    No subscribers found
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-purple-400 shrink-0" />
                        <span className="text-white">{sub.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {sub.source || "website"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <Globe className="h-3 w-3" />
                        {sub.locale || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <Clock className="h-3 w-3" />
                        {new Date(sub.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(sub.id)}
                        disabled={deleting === sub.id}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                        title="Remove subscriber"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
