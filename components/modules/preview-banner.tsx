"use client";
import { Button } from "@/components/ui/button";
import { useUpgradeModal } from "@/components/billing/upgrade-modal-provider";
import { copy } from "@/lib/copy";

type PreviewBannerProps = {
  className?: string;
  onUpgradeClick?: () => void;
};

export default function PreviewBanner({ className, onUpgradeClick }: PreviewBannerProps) {
  const { open } = useUpgradeModal();

  const handleUpgrade = () => {
    if (onUpgradeClick) onUpgradeClick();
    open();
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-border bg-gigaviz-surface/70 px-4 py-3 text-sm text-foreground ${className ?? ""}`}
    >
      <span
        aria-hidden
        className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-gigaviz-gold text-[10px] text-gigaviz-gold"
      >
        !
      </span>
      <div className="flex-1">
        <p className="font-semibold">{copy.previewBanner.title}</p>
        <p className="text-muted-foreground">{copy.previewBanner.text}</p>
      </div>
      <Button size="sm" variant="outline" onClick={handleUpgrade}>
        {copy.previewBanner.action}
      </Button>
    </div>
  );
}
