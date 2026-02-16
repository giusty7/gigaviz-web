"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2, Save, X } from "lucide-react";

type Props = {
  documentId: string;
  workspaceSlug: string;
  title: string;
  content: string;
};

export function DocumentActions({ documentId, workspaceSlug, title: initTitle, content: initContent }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initTitle);
  const [content, setContent] = useState(initContent);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/studio/office/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content_json: content.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Update failed");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/studio/office/documents/${documentId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Delete failed");
        setDeleting(false);
        return;
      }
      router.push(`/${workspaceSlug}/modules/studio/office`);
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
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-3 py-2 text-sm text-[#f5f5dc] focus:border-cyan-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#f5f5dc]/40 uppercase tracking-wider">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-3 py-2 text-sm text-[#f5f5dc] font-mono focus:border-cyan-500/50 focus:outline-none resize-y min-h-[200px]"
              rows={12}
              placeholder="Enter document content..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-cyan-600 px-4 text-xs font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save Changes
            </button>
            <button
              onClick={() => { setEditing(false); setTitle(initTitle); setContent(initContent); }}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#f5f5dc]/10 px-3 text-xs text-[#f5f5dc]/50 hover:text-[#f5f5dc]"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-cyan-600 px-4 text-xs font-medium text-white hover:bg-cyan-500 transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Edit Document
          </button>
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
