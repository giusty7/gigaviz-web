"use client";
import { logger } from "@/lib/logging";

import { useState, useEffect, useCallback } from "react";
import {
  Ticket,
  Filter,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
  User,
  Building2,
} from "lucide-react";
import type { SupportTicket } from "@/lib/ops/types";
import TicketDetailModal from "./TicketDetailModal";

type TicketsClientProps = {
  adminUserId: string;
};

type TicketStats = {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
};

export default function TicketsClient({ adminUserId }: TicketsClientProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);

      const response = await fetch(`/api/ops/tickets?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTickets(data.tickets || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      logger.error("Fetch tickets error:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <div className="space-y-6">
      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticketId={selectedTicket.id}
          onClose={() => setSelectedTicket(null)}
          onUpdate={() => {
            fetchTickets();
            setSelectedTicket(null);
          }}
          adminUserId={adminUserId}
        />
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Tickets</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <Ticket className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Open</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">
                  {stats.byStatus.open || 0}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">In Progress</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">
                  {stats.byStatus.in_progress || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Resolved</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {stats.byStatus.resolved || 0}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <button
            onClick={fetchTickets}
            className="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No tickets found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => setSelectedTicket(ticket)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TicketCard({
  ticket,
  onClick,
}: {
  ticket: SupportTicket;
  onClick: () => void;
}) {
  const statusColors = {
    open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    in_progress: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    resolved: "bg-green-500/10 text-green-400 border-green-500/20",
    closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  const priorityColors = {
    low: "bg-slate-500/10 text-slate-400",
    medium: "bg-blue-500/10 text-blue-400",
    high: "bg-orange-500/10 text-orange-400",
    urgent: "bg-red-500/10 text-red-400",
  };

  return (
    <div
      onClick={onClick}
      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-slate-500">
              {ticket.ticketNumber}
            </span>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded border ${
                statusColors[ticket.status]
              }`}
            >
              {ticket.status.replace("_", " ")}
            </span>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                priorityColors[ticket.priority]
              }`}
            >
              {ticket.priority}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">{ticket.subject}</h3>
          <p className="text-sm text-slate-400 line-clamp-2">{ticket.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          <span>/{ticket.workspaceSlug}</span>
        </div>
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span>{ticket.userEmail}</span>
        </div>
        {ticket.assignedToEmail && (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>Assigned: {ticket.assignedToEmail}</span>
          </div>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <Clock className="w-3 h-3" />
          <span>{new Date(ticket.createdAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
