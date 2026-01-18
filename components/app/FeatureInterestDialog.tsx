"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
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

  const title = useMemo(() => (moduleName ? `Notify me: ${moduleName}` : "Notify me"), [moduleName]);

  const handleSubmit = useCallback(async () => {
    if (!moduleSlug) {
      toast({ title: "Module required", description: "Pick a module to subscribe to updates." });
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
        toast({ title: "Request failed", description: String(error) });
        return;
      }

      toast({ title: "Saved", description: "We will notify you when this module is ready." });
      setOpen(false);
      setNotes("");
    } finally {
      setSubmitting(false);
    }
  }, [moduleSlug, notes, toast, workspaceId]);

  return (
    <>
      {typeof children === "function" ? children(openDialog) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              We will reach out when this module is available. Share any context to help us prioritize.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Module: {moduleName || moduleSlug}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fi-notes">Notes (optional)</Label>
              <Textarea
                id="fi-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Timeline, business impact, or extra details."
                maxLength={2000}
              />
              <p className="text-[11px] text-muted-foreground">Up to 2000 characters.</p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Notify me"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
