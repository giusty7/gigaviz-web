"use client";

import Link from "next/link";
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
import { cn } from "@/lib/utils";

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
  billingHref = "/billing",
  className,
}: UpgradeModalProps) {
  const t = useTranslations("billing");

  const bullets = [
    t("upgradeModalBullet1"),
    t("upgradeModalBullet2"),
    t("upgradeModalBullet3"),
    t("upgradeModalBullet4"),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-lg bg-card text-foreground", className)}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t("upgradeModalTitle")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t("upgradeModalDesc")}
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

        <p className="text-xs text-muted-foreground">
          {t("upgradeModalFooter")}
        </p>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild size="sm" className="flex-1">
            <Link href={billingHref}>{t("viewPlans")}</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1 border-border"
            onClick={onClose}
          >
            {t("notNow")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
