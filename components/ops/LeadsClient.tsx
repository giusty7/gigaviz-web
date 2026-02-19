"use client";

import { useState, useMemo } from "react";
import {
  Target,
  Phone,
  Mail,
  MessageCircle,
  Search,
  Filter,
  ChevronDown,
  Send,
  ExternalLink,
  Clock,
  Building2,
  RefreshCw,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  business?: string | null;
  need: string;
  notes?: string | null;
  source: string;
  status: string;
  created_at: string;
  ip?: string | null;
  user_agent?: string | null;
}

interface LeadsClientProps {
  initialLeads: Lead[];
  stats: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
  };
  error?: string;
}

const STATUS_OPTIONS = ["new", "contacted", "qualified", "converted", "lost"] as const;
const SOURCE_OPTIONS = ["wa-platform", "get-started", "contact-form"] as const;

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  qualified: "bg-green-500/20 text-green-400 border-green-500/30",
  converted: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  lost: "bg-red-500/20 text-red-400 border-red-500/30",
};

const SOURCE_LABELS: Record<string, string> = {
  "wa-platform": "WhatsApp Form",
  "get-started": "Get Started",
  "contact-form": "Contact Form",
};

export function LeadsClient({ initialLeads, stats, error }: LeadsClientProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [waMessage, setWaMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const matchSearch =
        !search ||
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone.toLowerCase().includes(search.toLowerCase()) ||
        (lead.business && lead.business.toLowerCase().includes(search.toLowerCase())) ||
        lead.need.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchSource = sourceFilter === "all" || lead.source === sourceFilter;

      return matchSearch && matchStatus && matchSource;
    });
  }, [leads, search, statusFilter, sourceFilter]);

  async function handleStatusChange(leadId: string, newStatus: string) {
    setUpdating(leadId);
    try {
      const res = await fetch("/api/ops/leads/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, status: newStatus }),
      });

      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
      }
    } catch {
      // Silently handle
    } finally {
      setUpdating(null);
    }
  }

  async function handleSendWa() {
    if (!selectedLead || !waMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/ops/leads/wa-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedLead.phone,
          message: waMessage,
          leadId: selectedLead.id,
        }),
      });

      if (res.ok) {
        setWaMessage("");
        // Auto-update status to contacted
        if (selectedLead.status === "new") {
          handleStatusChange(selectedLead.id, "contacted");
        }
        setSelectedLead(null);
      }
    } catch {
      // Silently handle
    } finally {
      setSending(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/ops/leads/list");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads ?? []);
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
      {/* Stats Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatPill label="Total" count={stats.total} color="text-white" />
        <StatPill label="New" count={stats.new} color="text-blue-400" />
        <StatPill label="Contacted" count={stats.contacted} color="text-amber-400" />
        <StatPill label="Qualified" count={stats.qualified} color="text-green-400" />
        <StatPill label="Converted" count={stats.converted} color="text-emerald-300" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, phone, business, or need..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="pl-4 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Sources</option>
            {SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>{SOURCE_LABELS[s] || s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-amber-500/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <p className="text-sm text-slate-500">
        Showing {filtered.length} of {leads.length} leads
      </p>

      {/* Leads Table */}
      <div className="rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Lead</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Need</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No leads found matching your filters
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-amber-400 shrink-0" />
                        <div>
                          <p className="text-white font-medium">{lead.name}</p>
                          {lead.business && (
                            <p className="text-slate-500 text-xs flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {lead.business}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-300 text-xs">
                        {lead.source === "contact-form" ? (
                          <>
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{lead.phone}</span>
                          </>
                        ) : (
                          <>
                            <Phone className="h-3 w-3" />
                            <span>{lead.phone}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-300 text-xs truncate max-w-[150px]">{lead.need}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {SOURCE_LABELS[lead.source] || lead.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        disabled={updating === lead.id}
                        className={`text-xs px-2 py-1 rounded border appearance-none cursor-pointer ${
                          STATUS_COLORS[lead.status] || "bg-slate-700 text-slate-300 border-slate-600"
                        } ${updating === lead.id ? "opacity-50" : ""}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <Clock className="h-3 w-3" />
                        {new Date(lead.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {lead.source !== "contact-form" && (
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setWaMessage(
                                `Hi ${lead.name}, thank you for your interest in Gigaviz! How can we help you with "${lead.need}"?`
                              );
                            }}
                            className="p-1.5 rounded hover:bg-green-500/20 text-green-400 transition-colors"
                            title="Send WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        )}
                        {lead.source === "contact-form" && lead.phone.includes("@") && (
                          <a
                            href={`mailto:${lead.phone}`}
                            className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition-colors"
                            title="Send Email"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Send Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg mx-4 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-green-400" />
              Send WhatsApp to {selectedLead.name}
            </h3>
            <p className="text-sm text-slate-400 mb-1">
              To: <span className="text-white">{selectedLead.phone}</span>
            </p>
            <p className="text-sm text-slate-400 mb-4">
              Need: <span className="text-white">{selectedLead.need}</span>
            </p>

            <textarea
              value={waMessage}
              onChange={(e) => setWaMessage(e.target.value)}
              rows={4}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-green-500/50"
              placeholder="Type your message..."
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setSelectedLead(null);
                  setWaMessage("");
                }}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSendWa}
                disabled={sending || !waMessage.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <Send className="h-4 w-4" />
                {sending ? "Sending..." : "Send WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}
