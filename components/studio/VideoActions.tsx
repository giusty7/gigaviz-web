"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Pencil, Trash2, Loader2, Save, X } from "lucide-react";

type Props = {
  videoId: string;
  workspaceSlug: string;
  title: string;
  description: string;
};

export function VideoActions({ videoId, workspaceSlug, title: initTitle, description: initDesc }: Props) {
  const t = useTranslations("studio");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initTitle);
  const [description, setDescription] = useState(initDesc);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/studio/graph/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || t("common.updateFailed"));
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError(t("common.networkErrorShort"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/studio/graph/videos/${videoId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || t("common.deleteFailed"));
        setDeleting(false);
        return;
      }
      router.push(`/${workspaceSlug}/modules/studio/graph/videos`);
    } catch {
      setError(t("common.networkErrorShort"));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
      )}

      {editing ? (
        <div className="space-y-3 rounded-xl border border-purple-500/20 bg-[#0a1229]/40 p-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-3 py-2 text-sm text-[#f5f5dc] focus:border-purple-500/50 focus:outline-none"
            placeholder={t("videos.actions.titlePlaceholder")}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-3 py-2 text-sm text-[#f5f5dc] focus:border-purple-500/50 focus:outline-none resize-none"
            rows={3}
            placeholder={t("common.descriptionPlaceholder")}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-purple-600 px-4 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              {t("common.save")}
            </button>
            <button
              onClick={() => { setEditing(false); setTitle(initTitle); setDescription(initDesc); }}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#f5f5dc]/10 px-3 text-xs text-[#f5f5dc]/50 hover:text-[#f5f5dc]"
            >
              <X className="h-3 w-3" />
              {t("common.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-purple-600 px-4 text-xs font-medium text-white hover:bg-purple-500 transition-colors"
          >
            <Pencil className="h-3 w-3" />
            {t("videos.actions.editVideo")}
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">{t("common.deleteConfirm")}</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : t("common.yesDelete")}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="inline-flex h-9 items-center rounded-lg border border-[#f5f5dc]/10 px-3 text-xs text-[#f5f5dc]/50 hover:text-[#f5f5dc]"
              >
                {t("common.cancel")}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-500/30 px-4 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              {t("common.delete")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
