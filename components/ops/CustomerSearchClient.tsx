"use client";

import { useState } from "react";
import { Search, Loader2, User, Building2, Mail, Phone, Wallet, Shield, LogIn, X, Ticket } from "lucide-react";
import type { CustomerSearchResult } from "@/lib/ops/customers";

type CustomerSearchClientProps = {
  initialQuery?: string;
  initialResults?: CustomerSearchResult[];
};

export default function CustomerSearchClient({
  initialQuery = "",
  initialResults = [],
}: CustomerSearchClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<CustomerSearchResult[]>(initialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ops/customers/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email, phone, workspace slug, or ID..."
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Search
            </>
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Found {results.length} result{results.length !== 1 ? "s" : ""}
            </h3>
          </div>

          <div className="grid gap-4">
            {results.map((result, idx) => (
              <CustomerCard key={`${result.workspaceId}-${idx}`} result={result} />
            ))}
          </div>
        </div>
      ) : !loading && query ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No results found for &quot;{query}&quot;</p>
        </div>
      ) : null}
    </div>
  );
}

function CustomerCard({ result }: { result: CustomerSearchResult }) {
  const [impersonateModal, setImpersonateModal] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(60);

  const [createTicketModal, setCreateTicketModal] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  const entitlementCount = result.entitlements
    ? Object.values(result.entitlements).filter(Boolean).length
    : 0;

  const handleImpersonate = async () => {
    if (!reason.trim() || reason.length < 10) {
      alert("Reason must be at least 10 characters");
      return;
    }

    setImpersonating(true);
    try {
      const response = await fetch("/api/ops/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: result.userId,
          workspaceId: result.workspaceId,
          reason: reason.trim(),
          durationMinutes: duration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Impersonation failed");
      }

      // Set impersonation cookie and redirect to workspace
      const setCookieResponse = await fetch("/api/ops/impersonate/cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ impersonationId: data.impersonationId }),
      });

      if (!setCookieResponse.ok) {
        throw new Error("Failed to set impersonation session");
      }

      // Redirect to workspace dashboard (default landing)
      window.location.href = `/${result.workspaceSlug}/dashboard`;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Impersonation failed");
      setImpersonating(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      alert("Subject and description are required");
      return;
    }

    setCreatingTicket(true);
    try {
      const response = await fetch("/api/ops/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: result.workspaceId,
          userId: result.userId,
          subject: ticketSubject.trim(),
          description: ticketDescription.trim(),
          priority: ticketPriority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create ticket");
      }

      alert(`Ticket created: ${data.ticket.ticketNumber}`);
      setCreateTicketModal(false);
      setTicketSubject("");
      setTicketDescription("");
      setTicketPriority("medium");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setCreatingTicket(false);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white">{result.workspaceName}</h4>
            <p className="text-sm text-slate-400">/{result.workspaceSlug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-700 text-slate-300 text-xs font-medium rounded-full">
            {result.workspacePlan}
          </span>
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              result.workspaceStatus === "active"
                ? "bg-green-500/10 text-green-400"
                : "bg-slate-700 text-slate-400"
            }`}
          >
            {result.workspaceStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Owner Email */}
        {result.ownerEmail && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">Owner:</span>
            <span className="text-white font-mono">{result.ownerEmail}</span>
          </div>
        )}

        {/* User Email (if different from owner) */}
        {result.userEmail && result.userEmail !== result.ownerEmail && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">User:</span>
            <span className="text-white font-mono">{result.userEmail}</span>
          </div>
        )}

        {/* Phone */}
        {result.userPhone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">Phone:</span>
            <span className="text-white font-mono">{result.userPhone}</span>
          </div>
        )}

        {/* Token Balance */}
        {result.tokenBalance !== null && (
          <div className="flex items-center gap-2 text-sm">
            <Wallet className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">Tokens:</span>
            <span className="text-white font-semibold">{result.tokenBalance.toLocaleString()}</span>
          </div>
        )}

        {/* Entitlements Count */}
        <div className="flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4 text-slate-400" />
          <span className="text-slate-300">Entitlements:</span>
          <span className="text-white">{entitlementCount} enabled</span>
        </div>

        {/* Match Type */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-300">Match:</span>
          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded">
            {result.matchType}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
        <button
          onClick={() => setImpersonateModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          Impersonate
        </button>
        <button
          onClick={() => setCreateTicketModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
        >
          <Ticket className="w-4 h-4" />
          Create Ticket
        </button>
        <button
          disabled
          className="px-4 py-2 bg-slate-700 text-slate-500 text-sm font-medium rounded cursor-not-allowed"
          title="Coming soon"
        >
          Suspend
        </button>
        <button
          disabled
          className="px-4 py-2 bg-slate-700 text-slate-500 text-sm font-medium rounded cursor-not-allowed"
          title="Coming soon"
        >
          Grant Tokens
        </button>
        <a
          href={`/ops/workspaces/${result.workspaceId}`}
          className="ml-auto px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded transition-colors"
        >
          View Details
        </a>
      </div>

      {/* Impersonation Modal */}
      {impersonateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Start Impersonation</h3>
              <button
                onClick={() => setImpersonateModal(false)}
                className="text-slate-400 hover:text-white"
                disabled={impersonating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Workspace
                </label>
                <p className="text-white font-medium">{result.workspaceName}</p>
                <p className="text-sm text-slate-400">/{result.workspaceSlug}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason (required)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Customer support ticket #1234 - investigating billing issue"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={impersonating}
                />
                <p className="text-xs text-slate-400 mt-1">
                  {reason.length}/500 characters (min 10)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={impersonating}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour (recommended)</option>
                  <option value={120}>2 hours</option>
                  <option value={240}>4 hours</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setImpersonateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded transition-colors"
                disabled={impersonating}
              >
                Cancel
              </button>
              <button
                onClick={handleImpersonate}
                disabled={impersonating || !reason.trim() || reason.length < 10}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-2"
              >
                {impersonating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Start Impersonation
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-4 text-center">
              All actions during impersonation are logged for audit purposes
            </p>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {createTicketModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Create Support Ticket</h3>
              <button
                onClick={() => setCreateTicketModal(false)}
                className="text-slate-400 hover:text-white"
                disabled={creatingTicket}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Workspace
                </label>
                <p className="text-white font-medium">{result.workspaceName}</p>
                <p className="text-sm text-slate-400">/{result.workspaceSlug}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Customer
                </label>
                <p className="text-white font-medium">{result.userEmail}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Subject (required)
                </label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Brief description of the issue"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creatingTicket}
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description (required)
                </label>
                <textarea
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Detailed description of the issue..."
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creatingTicket}
                  maxLength={5000}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Priority
                </label>
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value as "low" | "medium" | "high" | "urgent")}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creatingTicket}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCreateTicketModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded transition-colors"
                disabled={creatingTicket}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={creatingTicket || !ticketSubject.trim() || !ticketDescription.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-2"
              >
                {creatingTicket ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4" />
                    Create Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
