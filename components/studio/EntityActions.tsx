"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Pencil, Trash2, Loader2, Save, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type EntityField = {
  /** Field key sent to PATCH API */
  key: string;
  /** Label displayed above the input */
  label: string;
  /** Initial value */
  value: string;
  /** "input" (default) or "textarea" */
  type?: "input" | "textarea";
  /** Placeholder text */
  placeholder?: string;
  /** Textarea rows (default 3) */
  rows?: number;
  /** Is this field required? (default true for first field) */
  required?: boolean;
};

export type EntityActionsProps = {
  /** Entity ID for API calls */
  entityId: string;
  /** Workspace slug for redirect after delete */
  workspaceSlug: string;
  /** API endpoint path, e.g. "/api/studio/graph/charts" */
  apiPath: string;
  /** Redirect path after delete (relative), e.g. "/modules/studio/graph" */
  redirectAfterDelete: string;
  /** Editable fields configuration */
  fields: EntityField[];
  /** i18n key for the edit button label, e.g. "graph.actions.editChart" */
  editButtonLabel: string;
  /** Accent color for edit form border & buttons (default "purple") */
  accentColor?: "purple" | "cyan" | "teal" | "blue" | "emerald";
  /** Extra actions rendered between edit and delete buttons */
  extraActions?: ReactNode;
  /** Additional body fields to send with PATCH (e.g., { is_public: true }) */
  extraPatchFields?: Record<string, unknown>;
};

/* ------------------------------------------------------------------ */
/*  Color config                                                        */
/* ------------------------------------------------------------------ */

const colorMap = {
  purple: { border: "border-purple-500/20", focus: "focus:border-purple-500/50", bg: "bg-purple-600", hover: "hover:bg-purple-500" },
  cyan: { border: "border-cyan-500/20", focus: "focus:border-cyan-500/50", bg: "bg-cyan-600", hover: "hover:bg-cyan-500" },
  teal: { border: "border-teal-500/20", focus: "focus:border-teal-500/50", bg: "bg-teal-600", hover: "hover:bg-teal-500" },
  blue: { border: "border-blue-500/20", focus: "focus:border-blue-500/50", bg: "bg-blue-600", hover: "hover:bg-blue-500" },
  emerald: { border: "border-emerald-500/20", focus: "focus:border-emerald-500/50", bg: "bg-emerald-600", hover: "hover:bg-emerald-500" },
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function EntityActions({
  entityId,
  workspaceSlug,
  apiPath,
  redirectAfterDelete,
  fields,
  editButtonLabel,
  accentColor = "purple",
  extraActions,
  extraPatchFields,
}: EntityActionsProps) {
  const t = useTranslations("studio");
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, f.value]))
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = colorMap[accentColor];

  const updateValue = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const resetFields = () => {
    setValues(Object.fromEntries(fields.map((f) => [f.key, f.value])));
    setEditing(false);
  };

  const firstRequired = fields[0]?.key;
  const canSave = firstRequired ? (values[firstRequired]?.trim() ?? "") !== "" : true;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      for (const f of fields) {
        const v = values[f.key]?.trim() ?? "";
        body[f.key] = v || (f.required !== false ? v : undefined);
      }
      if (extraPatchFields) Object.assign(body, extraPatchFields);

      const res = await fetch(`${apiPath}/${entityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t("common.updateFailed"));
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
      const res = await fetch(`${apiPath}/${entityId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t("common.deleteFailed"));
        setDeleting(false);
        return;
      }
      router.push(`/${workspaceSlug}${redirectAfterDelete}`);
    } catch {
      setError(t("common.networkErrorShort"));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {editing ? (
        <div className={`space-y-3 rounded-xl border ${colors.border} bg-[#0a1229]/40 p-4`}>
          {fields.map((field) =>
            field.type === "textarea" ? (
              <textarea
                key={field.key}
                value={values[field.key] ?? ""}
                onChange={(e) => updateValue(field.key, e.target.value)}
                className={`w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-3 py-2 text-sm text-[#f5f5dc] ${colors.focus} focus:outline-none resize-none`}
                rows={field.rows ?? 3}
                placeholder={field.placeholder}
              />
            ) : (
              <input
                key={field.key}
                type="text"
                value={values[field.key] ?? ""}
                onChange={(e) => updateValue(field.key, e.target.value)}
                className={`w-full rounded-lg border border-[#f5f5dc]/10 bg-[#0a1229]/60 px-3 py-2 text-sm text-[#f5f5dc] ${colors.focus} focus:outline-none`}
                placeholder={field.placeholder}
              />
            )
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !canSave}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg ${colors.bg} px-4 text-xs font-medium text-white ${colors.hover} disabled:opacity-50`}
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              {t("common.save")}
            </button>
            <button
              onClick={resetFields}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#f5f5dc]/10 px-3 text-xs text-[#f5f5dc]/50 hover:text-[#f5f5dc]"
            >
              <X className="h-3 w-3" />
              {t("common.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setEditing(true)}
            className={`inline-flex h-9 items-center gap-2 rounded-lg ${colors.bg} px-4 text-xs font-medium text-white ${colors.hover} transition-colors`}
          >
            <Pencil className="h-3 w-3" />
            {t(editButtonLabel)}
          </button>

          {extraActions}

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
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-500/20 px-4 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
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
