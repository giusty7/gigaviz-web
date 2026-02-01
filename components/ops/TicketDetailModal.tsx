"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Loader2,
  MessageSquare,
  User,
  Clock,
  Send,
  Lock,
  FileText,
  Search,
} from "lucide-react";
import type { SupportTicket, TicketComment, CannedResponse } from "@/lib/ops/types";
import { getSLAStatus, getTimeUntilDue } from "@/lib/ops/sla-helpers";

type TicketDetailModalProps = {
  ticketId: string;
  onClose: () => void;
  onUpdate: () => void;
  adminUserId: string;
};

export default function TicketDetailModal({
  ticketId,
  onClose,
  onUpdate,
  adminUserId,
}: TicketDetailModalProps) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [showCannedResponses, setShowCannedResponses] = useState(false);
  const [cannedSearchQuery, setCannedSearchQuery] = useState("");

  const fetchTicketDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ops/tickets/${ticketId}`);
      const data = await response.json();

      if (response.ok) {
        setTicket(data.ticket);
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Fetch ticket details error:", err);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicketDetails();
  }, [fetchTicketDetails]);

  const handleUpdateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/ops/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await fetchTicketDetails();
        onUpdate();
      }
    } catch (err) {
      console.error("Update status error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePriority = async (priority: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/ops/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });

      if (response.ok) {
        await fetchTicketDetails();
        onUpdate();
      }
    } catch (err) {
      console.error("Update priority error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignToMe = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/ops/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: adminUserId }),
      });

      if (response.ok) {
        await fetchTicketDetails();
        onUpdate();
      }
    } catch (err) {
      console.error("Assign ticket error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/ops/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: newComment.trim(), isInternal }),
      });

      if (response.ok) {
        setNewComment("");
        setIsInternal(false);
        setShowCannedResponses(false);
        await fetchTicketDetails();
      }
    } catch (err) {
      console.error("Add comment error:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const fetchCannedResponses = useCallback(async () => {
    try {
      const query = cannedSearchQuery ? `?q=${encodeURIComponent(cannedSearchQuery)}` : "";
      const response = await fetch(`/api/ops/canned-responses${query}`);
      const data = await response.json();
      if (response.ok) {
        setCannedResponses(data.responses || []);
      }
    } catch (err) {
      console.error("Fetch canned responses error:", err);
    }
  }, [cannedSearchQuery]);

  const handleUseCannedResponse = (response: CannedResponse) => {
    setNewComment(response.content);
    setShowCannedResponses(false);
  };

  useEffect(() => {
    if (showCannedResponses) {
      fetchCannedResponses();
    }
  }, [showCannedResponses, fetchCannedResponses]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

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

  const slaStatus = getSLAStatus(ticket);
  const timeUntilDue = getTimeUntilDue(ticket);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-slate-500">{ticket.ticketNumber}</span>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded border ${
                  statusColors[ticket.status]
                }`}
              >
                {ticket.status.replace("_", " ")}
              </span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${priorityColors[ticket.priority]}`}>
                {ticket.priority}
              </span>
              {timeUntilDue && (
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded flex items-center gap-1 ${
                    slaStatus === "overdue"
                      ? "bg-red-500/10 text-red-400"
                      : slaStatus === "warning"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : "bg-green-500/10 text-green-400"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {timeUntilDue}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white">{ticket.subject}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Ticket Info */}
          <div className="bg-slate-900 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Workspace</p>
                <p className="text-white font-medium">/{ticket.workspaceSlug}</p>
              </div>
              <div>
                <p className="text-slate-400">Customer</p>
                <p className="text-white font-medium">{ticket.userEmail}</p>
              </div>
              <div>
                <p className="text-slate-400">Created</p>
                <p className="text-white font-medium">
                  {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Assigned To</p>
                <p className="text-white font-medium">
                  {ticket.assignedToEmail || "Unassigned"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Description</p>
              <p className="text-white whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={ticket.status}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              disabled={updating}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={ticket.priority}
              onChange={(e) => handleUpdatePriority(e.target.value)}
              disabled={updating}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            {ticket.assignedTo !== adminUserId && (
              <button
                onClick={handleAssignToMe}
                disabled={updating}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
              >
                Assign to Me
              </button>
            )}
          </div>

          {/* Comments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comments ({comments.length})
            </h3>

            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`rounded-lg p-4 ${
                    comment.isInternal
                      ? "bg-yellow-500/10 border border-yellow-500/20"
                      : "bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-white">
                      {comment.authorEmail}
                    </span>
                    {comment.isInternal && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Internal
                      </span>
                    )}
                    <span className="text-xs text-slate-500 ml-auto">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">
                    {comment.comment}
                  </p>
                </div>
              ))}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-3">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={submittingComment}
                />
                
                {/* Canned Responses Dropdown */}
                {showCannedResponses && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
                    <div className="p-2 border-b border-slate-700 sticky top-0 bg-slate-800">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={cannedSearchQuery}
                          onChange={(e) => setCannedSearchQuery(e.target.value)}
                          placeholder="Search templates..."
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div className="p-1">
                      {cannedResponses.length === 0 ? (
                        <p className="text-slate-400 text-sm p-3 text-center">No templates found</p>
                      ) : (
                        cannedResponses.map((resp) => (
                          <button
                            key={resp.id}
                            type="button"
                            onClick={() => handleUseCannedResponse(resp)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded text-sm group"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-3 h-3 text-purple-400" />
                              <span className="text-white font-medium">{resp.title}</span>
                              {resp.shortcut && (
                                <span className="text-xs text-slate-500 ml-auto">{resp.shortcut}</span>
                              )}
                            </div>
                            <p className="text-slate-400 text-xs line-clamp-2">{resp.content}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCannedResponses(!showCannedResponses)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Templates
                </button>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-2 focus:ring-purple-500"
                  />
                  <Lock className="w-4 h-4" />
                  Internal note
                </label>
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
                >
                  {submittingComment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
