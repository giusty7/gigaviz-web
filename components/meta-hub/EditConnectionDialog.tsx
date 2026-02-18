"use client";
import { logger } from "@/lib/logging";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

type EditConnectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: {
    phoneNumberId: string;
    displayName: string | null;
    notes?: string | null;
  };
  workspaceId: string;
};

export function EditConnectionDialog({
  open,
  onOpenChange,
  connection,
  workspaceId,
}: EditConnectionDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("metaHubUI.editConnection");
  const [displayName, setDisplayName] = useState(connection.displayName ?? "");
  const [notes, setNotes] = useState(connection.notes ?? "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meta-hub/connections/${connection.phoneNumberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          displayName: displayName.trim() || undefined,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to update connection");
      }

      toast({
        title: t("successTitle"),
        description: t("successDescription"),
      });

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      logger.error("Failed to update connection:", err);
      toast({
        title: t("errorTitle"),
        description: err instanceof Error ? err.message : t("errorDescription"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">{t("connectionNameLabel")}</Label>
            <Input
              id="displayName"
              placeholder={t("connectionNamePlaceholder")}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
            />
            <p className="text-sm text-muted-foreground">
              {t("connectionNameHelp")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("notesLabel")}</Label>
            <Textarea
              id="notes"
              placeholder={t("notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t("cancel")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={loading}>
            {loading ? t("saving") : t("saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
