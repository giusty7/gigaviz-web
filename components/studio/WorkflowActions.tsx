"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2, Save, X, Play, Pause, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  workflowId: string;
  workspaceSlug: string;
  title: string;
  description: string;
  status: string;
};

export function WorkflowActions({ workflowId, workspaceSlug, title: initTitle, description: initDesc, status }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initTitle);
  const [description, setDescription] = useState(initDesc);
  const [saving, setSaving] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patchWorkflow = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/studio/tracks/workflows/${workflowId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Update failed");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await patchWorkflow({ title: title.trim(), description: description.trim() || undefined });
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusChanging(true);
    setError(null);
    try {
      await patchWorkflow({ status: newStatus });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status change failed");
    } finally {
      setStatusChanging(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/studio/tracks/workflows/${workflowId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Delete failed");
        setDeleting(false);
        return;
      }
      router.push(`/${workspaceSlug}/modules/studio/tracks`);
    } catch {
      setError("Network error");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
      )}

      {editing ? (
        <div className="space-y-3 rounded-xl border border-teal-500/20 bg-[#0a1229]/40 p-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-3 py-2 text-sm text-[#f5f5dc] focus:border-teal-500/50 focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-3 py-2 text-sm text-[#f5f5dc] focus:border-teal-500/50 focus:outline-none resize-none"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-teal-600 px-4 text-xs font-medium text-white hover:bg-teal-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setTitle(initTitle); setDescription(initDesc); }}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#f5f5dc]/10 px-3 text-xs text-[#f5f5dc]/50 hover:text-[#f5f5dc]"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {/* Edit */}
          <button
            onClick={() => setEditing(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-teal-600 px-4 text-xs font-medium text-white hover:bg-teal-500 transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>

          {/* Status toggles */}
          {status === "draft" && (
            <button
              onClick={() => handleStatusChange("active")}
              disabled={statusChanging}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              {statusChanging ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              Activate
            </button>
          )}
          {status === "active" && (
            <button
              onClick={() => handleStatusChange("paused")}
              disabled={statusChanging}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-600 px-4 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
            >
              {statusChanging ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pause className="h-3 w-3" />}
              Pause
            </button>
          )}
          {status === "paused" && (
            <button
              onClick={() => handleStatusChange("active")}
              disabled={statusChanging}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              {statusChanging ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              Resume
            </button>
          )}
          {(status === "active" || status === "paused") && (
            <button
              onClick={() => handleStatusChange("archived")}
              disabled={statusChanging}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-xs font-medium transition-colors disabled:opacity-50",
                "border-[#f5f5dc]/10 text-[#f5f5dc]/50 hover:text-[#f5f5dc]"
              )}
            >
              <Archive className="h-3 w-3" />
              Archive
            </button>
          )}

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Delete permanently?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="inline-flex h-9 items-center rounded-lg border border-[#f5f5dc]/10 px-3 text-xs text-[#f5f5dc]/50 hover:text-[#f5f5dc]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-500/20 px-4 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
