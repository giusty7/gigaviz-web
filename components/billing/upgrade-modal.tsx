"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/copy";

type UpgradeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  billingHref?: string;
  className?: string;
};

export default function UpgradeModal({
  open,
  onOpenChange,
  onClose,
  billingHref = "/app/billing",
  className,
}: UpgradeModalProps) {
  const bullets = useMemo(
    () => copy.upgradeModal.bullets.slice(0, 4),
    []
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-lg bg-card text-foreground", className)}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {copy.upgradeModal.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {copy.upgradeModal.description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-2 rounded-xl border border-border bg-gigaviz-surface/60 px-4 py-3">
          {bullets.map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-gigaviz-gold" aria-hidden />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {copy.upgradeModal.footerNote ? (
          <p className="text-xs text-muted-foreground">
            {copy.upgradeModal.footerNote}
          </p>
        ) : null}

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild size="sm" className="flex-1">
            <Link href={billingHref}>{copy.upgradeModal.ctaPrimary}</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1 border-border"
            onClick={onClose}
          >
            {copy.upgradeModal.ctaSecondary}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
