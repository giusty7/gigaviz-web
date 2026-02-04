"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DeleteWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
};

export function DeleteWorkspaceDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
}: DeleteWorkspaceDialogProps) {
  const router = useRouter();
  const [confirmName, setConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (confirmName !== workspaceName) {
      setError("Workspace name does not match");
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete workspace");
      }

      // Redirect to workspaces list
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete workspace");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md border-red-500/20 bg-[#0a1229]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl text-[#f5f5dc]">
                Delete Workspace
              </AlertDialogTitle>
              <p className="text-sm text-[#f5f5dc]/60">This action cannot be undone</p>
            </div>
          </div>
          <AlertDialogDescription className="space-y-4 pt-4">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-red-200 mb-2 font-semibold">
                ⚠️ Warning: Permanent Deletion
              </p>
              <p className="text-xs text-red-200/80">
                Deleting this workspace will permanently remove:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-red-200/80">
                <li>• All workspace data and settings</li>
                <li>• All team members and invitations</li>
                <li>• All audit logs and activity history</li>
                <li>• All product data (Meta Hub, Helper, etc.)</li>
                <li>• All subscriptions and billing history</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmName" className="text-[#f5f5dc]">
                Type <span className="font-mono font-bold text-red-400">{workspaceName}</span> to confirm
              </Label>
              <Input
                id="confirmName"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={workspaceName}
                className="border-[#d4af37]/30 bg-[#0a1229]/80 text-[#f5f5dc]"
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="flex-1 rounded-xl border border-[#d4af37]/30 bg-[#0a1229]/80 px-4 py-2.5 text-sm font-semibold text-[#f5f5dc] transition hover:border-[#d4af37]/60 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting || confirmName !== workspaceName}
            className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="inline h-4 w-4 mr-2" />
                Delete Workspace
              </>
            )}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
