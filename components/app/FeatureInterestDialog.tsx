"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export type FeatureInterestDialogProps = {
  workspaceId: string;
  children?: (openDialog: (moduleSlug: string, moduleName?: string) => void) => ReactNode;
};

export default function FeatureInterestDialog({ workspaceId, children }: FeatureInterestDialogProps) {
  const { toast } = useToast();
  const t = useTranslations("appUI.featureInterest");
  const [open, setOpen] = useState(false);
  const [moduleSlug, setModuleSlug] = useState<string>("");
  const [moduleName, setModuleName] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openDialog = useCallback((slug: string, name?: string) => {
    setModuleSlug(slug);
    setModuleName(name ?? slug);
    setOpen(true);
  }, []);

  const title = useMemo(() => (moduleName ? t("notifyMeModule", { name: moduleName }) : t("notifyMe")), [moduleName, t]);

  const handleSubmit = useCallback(async () => {
    if (!moduleSlug) {
      toast({ title: t("moduleRequired"), description: t("moduleRequiredDesc") });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feature-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          moduleSlug,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const error = payload?.reason || payload?.error || "request_failed";
        toast({ title: t("requestFailed"), description: String(error) });
        return;
      }

      toast({ title: t("saved"), description: t("savedDesc") });
      setOpen(false);
      setNotes("");
    } finally {
      setSubmitting(false);
    }
  }, [moduleSlug, notes, toast, t, workspaceId]);

  return (
    <>
      {typeof children === "function" ? children(openDialog) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {t("description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {t("module", { name: moduleName || moduleSlug })}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fi-notes">{t("notesOptional")}</Label>
              <Textarea
                id="fi-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                maxLength={2000}
              />
              <p className="text-[11px] text-muted-foreground">{t("charLimit")}</p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? t("submitting") : t("notifyMe")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
