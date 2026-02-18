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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("platformUI.editWorkspace");
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || "");
  const [workspaceType, setWorkspaceType] = useState(initialType);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t("nameRequired"));
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
                {t("title")}
              </DialogTitle>
              <DialogDescription className="text-[#f5f5dc]/60">
                {t("description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[#f5f5dc]">
              {t("nameLabel")}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="border-[#d4af37]/30 bg-[#0a1229]/80 text-[#f5f5dc]"
              maxLength={100}
            />
            <p className="text-xs text-[#f5f5dc]/50">
              {t("charsCount", { count: name.length, max: 100 })}
            </p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[#f5f5dc]">
              {t("descriptionLabel")}
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              className="border-[#d4af37]/30 bg-[#0a1229]/80 text-[#f5f5dc]"
              maxLength={500}
            />
            <p className="text-xs text-[#f5f5dc]/50">
              {t("charsCount", { count: description.length, max: 500 })}
            </p>
          </div>

          {/* Workspace Type Field */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-[#f5f5dc]">
              {t("typeLabel")}
            </Label>
            <Select value={workspaceType} onValueChange={setWorkspaceType}>
              <SelectTrigger className="border-[#d4af37]/30 bg-[#0a1229]/80 text-[#f5f5dc]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#d4af37]/20 bg-[#0a1229]">
                <SelectItem value="personal">{t("typePersonal")}</SelectItem>
                <SelectItem value="team">{t("typeTeam")}</SelectItem>
                <SelectItem value="company">{t("typeCompany")}</SelectItem>
                <SelectItem value="enterprise">{t("typeEnterprise")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[#f5f5dc]/50">
              {workspaceType === "personal" && t("typePersonalDesc")}
              {workspaceType === "team" && t("typeTeamDesc")}
              {workspaceType === "company" && t("typeCompanyDesc")}
              {workspaceType === "enterprise" && t("typeEnterpriseDesc")}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              {t("updatedSuccess")}
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
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="flex-1 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2.5 text-sm font-bold text-[#d4af37] transition hover:bg-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                {t("saving")}
              </>
            ) : (
              <>
                <Save className="inline h-4 w-4 mr-2" />
                {t("saveChanges")}
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
