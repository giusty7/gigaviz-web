"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  X,
} from "lucide-react";
import type { CannedResponse } from "@/lib/ops/types";

export default function CannedResponsesClient() {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    shortcut: "",
    category: "general",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchResponses = useCallback(async () => {
    setLoading(true);
    try {
      const query = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : "";
      const response = await fetch(`/api/ops/canned-responses${query}`);
      const data = await response.json();

      if (response.ok) {
        setResponses(data.responses || []);
      }
    } catch (err) {
      console.error("Fetch canned responses error:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const handleOpenModal = (response?: CannedResponse) => {
    if (response) {
      setEditingResponse(response);
      setFormData({
        title: response.title,
        content: response.content,
        shortcut: response.shortcut || "",
        category: response.category,
      });
    } else {
      setEditingResponse(null);
      setFormData({
        title: "",
        content: "",
        shortcut: "",
        category: "general",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingResponse(null);
    setFormData({
      title: "",
      content: "",
      shortcut: "",
      category: "general",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Title and content are required");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingResponse
        ? `/api/ops/canned-responses/${editingResponse.id}`
        : "/api/ops/canned-responses";

      const response = await fetch(url, {
        method: editingResponse ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchResponses();
        handleCloseModal();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to save response");
      }
    } catch (err) {
      console.error("Save canned response error:", err);
      alert("Failed to save response");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this canned response?")) {
      return;
    }

    try {
      const response = await fetch(`/api/ops/canned-responses/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchResponses();
      } else {
        alert("Failed to delete response");
      }
    } catch (err) {
      console.error("Delete canned response error:", err);
      alert("Failed to delete response");
    }
  };

  const groupedResponses = responses.reduce((acc, resp) => {
    if (!acc[resp.category]) acc[resp.category] = [];
    acc[resp.category].push(resp);
    return acc;
  }, {} as Record<string, CannedResponse[]>);

  return (
    <div className="space-y-6">
      {/* Search & Actions */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Template
        </button>
      </div>

      {/* Responses List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : Object.keys(groupedResponses).length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No canned responses found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedResponses).map(([category, categoryResponses]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold text-white capitalize">{category}</h3>
              <div className="grid gap-3">
                {categoryResponses.map((resp) => (
                  <div
                    key={resp.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-purple-400" />
                          <h4 className="text-white font-medium">{resp.title}</h4>
                          {resp.shortcut && (
                            <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs font-mono rounded">
                              {resp.shortcut}
                            </span>
                          )}
                          {!resp.workspaceId && (
                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded">
                              Global
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm line-clamp-2">{resp.content}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleOpenModal(resp)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(resp.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingResponse ? "Edit Template" : "New Template"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Welcome Message"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Template response text..."
                  rows={6}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  maxLength={2000}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Shortcut (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.shortcut}
                    onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                    placeholder="e.g., /welcome"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="general">General</option>
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="escalation">Escalation</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Template"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
