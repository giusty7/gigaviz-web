"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EditWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  initialName: string;
  initialDescription: string | null;
  initialType: string;
};

export function EditWorkspaceDialog({
  open,
  onOpenChange,
  workspaceId,
  initialName,
  initialDescription,
  initialType,
}: EditWorkspaceDialogProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || "");
  const [workspaceType, setWorkspaceType] = useState(initialType);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Workspace name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          workspace_type: workspaceType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update workspace");
      }

      setSuccess(true);
      router.refresh();

      // Close dialog after brief success message
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update workspace");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-[#d4af37]/20 bg-[#0a1229]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20">
              <Settings2 className="h-6 w-6 text-[#d4af37]" />
            </div>
            <div>
              <DialogTitle className="text-xl text-[#f5f5dc]">
                Workspace Settings
              </DialogTitle>
              <DialogDescription className="text-[#f5f5dc]/60">
                Update workspace details and preferences
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[#f5f5dc]">
              Workspace Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Acme Corporation"
              className="border-[#d4af37]/30 bg-[#0a1229]/80 text-[#f5f5dc]"
              maxLength={100}
            />
            <p className="text-xs text-[#f5f5dc]/50">
              {name.length}/100 characters
            </p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[#f5f5dc]">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your workspace"
              className="border-[#d4af37]/30 bg-[#0a1229]/80 text-[#f5f5dc]"
              maxLength={500}
            />
            <p className="text-xs text-[#f5f5dc]/50">
              {description.length}/500 characters
            </p>
          </div>

          {/* Workspace Type Field */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-[#f5f5dc]">
              Workspace Type
            </Label>
            <Select value={workspaceType} onValueChange={setWorkspaceType}>
              <SelectTrigger className="border-[#d4af37]/30 bg-[#0a1229]/80 text-[#f5f5dc]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#d4af37]/20 bg-[#0a1229]">
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[#f5f5dc]/50">
              {workspaceType === "personal" && "For individual use"}
              {workspaceType === "team" && "For small teams (2-10 members)"}
              {workspaceType === "company" && "For companies (10-100 members)"}
              {workspaceType === "enterprise" && "For large organizations (100+ members)"}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              ✅ Workspace updated successfully!
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="flex-1 rounded-xl border border-[#d4af37]/30 bg-[#0a1229]/80 px-4 py-2.5 text-sm font-semibold text-[#f5f5dc] transition hover:border-[#d4af37]/60 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="flex-1 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2.5 text-sm font-bold text-[#d4af37] transition hover:bg-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Saving...
              </>
            ) : (
              <>
                <Save className="inline h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
