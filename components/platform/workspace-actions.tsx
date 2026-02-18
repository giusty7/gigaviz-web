"use client";

import { useState } from "react";
import { Settings2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { EditWorkspaceDialog } from "./edit-workspace-dialog";
import { DeleteWorkspaceDialog } from "./delete-workspace-dialog";

type WorkspaceActionsProps = {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  workspaceDescription: string | null;
  workspaceType: string;
  userRole: string;
};

export function WorkspaceActions({
  workspaceId,
  workspaceName,
  workspaceSlug,
  workspaceDescription,
  workspaceType,
  userRole,
}: WorkspaceActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const t = useTranslations("platformUI.workspaceActions");

  // Only owner can delete, owner/admin can edit
  const canEdit = userRole === "owner" || userRole === "admin";
  const canDelete = userRole === "owner";

  if (!canEdit && !canDelete) return null;

  return (
    <div className="flex gap-2 mt-4">
      {canEdit && (
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 text-sm font-semibold text-[#d4af37] transition hover:bg-[#d4af37]/20"
        >
          <Settings2 className="h-4 w-4" />
          {t("settings")}
        </button>
      )}
      {canDelete && (
        <button
          onClick={() => setDeleteOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
        >
          <Trash2 className="h-4 w-4" />
          {t("delete")}
        </button>
      )}

      {/* Dialogs */}
      <EditWorkspaceDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        workspaceId={workspaceId}
        initialName={workspaceName}
        initialDescription={workspaceDescription}
        initialType={workspaceType}
      />

      <DeleteWorkspaceDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
}
