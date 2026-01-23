"use client";

import { Button } from "@/components/ui/button";
import { useUpgradeModal } from "@/components/billing/upgrade-modal-provider";

type UpgradeButtonProps = {
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default";
  className?: string;
};

export function UpgradeButton({
  label = "Upgrade",
  variant = "default",
  size = "default",
  className,
}: UpgradeButtonProps) {
  const { open } = useUpgradeModal();

  return (
    <Button variant={variant} size={size} className={className} onClick={() => open()}>
      {label}
    </Button>
  );
}
