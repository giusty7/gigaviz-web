"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Trash2, Save, X, Loader2 } from "lucide-react";

type Props = {
  trackId: string;
  workspaceSlug: string;
  title: string;
  description: string;
};

export function MusicActions({ trackId, workspaceSlug, title, description }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const basePath = `/${workspaceSlug}/modules/studio/tracks/music`;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/studio/tracks/music/${trackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), description: editDescription.trim() }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/studio/tracks/music/${trackId}`, { method: "DELETE" });
      if (res.ok) router.push(basePath);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {editing ? (
        <div className="w-full space-y-3 rounded-xl border border-teal-500/20 bg-[#0a1229]/40 p-4">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-3 py-2 text-sm text-[#f5f5dc] focus:border-teal-500/50 focus:outline-none"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-3 py-2 text-sm text-[#f5f5dc] focus:border-teal-500/50 focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !editTitle.trim()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-teal-600 px-3 text-xs font-medium text-white hover:bg-teal-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setEditTitle(title); setEditDescription(description); }}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#f5f5dc]/10 px-3 text-xs text-[#f5f5dc]/50 hover:text-[#f5f5dc]"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#f5f5dc]/10 px-3 text-xs font-medium text-[#f5f5dc]/50 hover:text-[#f5f5dc] hover:border-[#f5f5dc]/20 transition-colors"
          >
            <Edit3 className="h-3 w-3" />
            Edit
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Confirm delete?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="inline-flex h-8 items-center rounded-lg border border-[#f5f5dc]/10 px-3 text-xs text-[#f5f5dc]/50"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/20 px-3 text-xs font-medium text-red-400/70 hover:text-red-400 hover:border-red-500/40 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
        </>
      )}
    </div>
  );
}
