"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

type Props = {
  variant?: "default" | "outline" | "secondary";
};

export function ClaimPlatformAdminButton({ variant = "default" }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("platformUI.claimAdmin");
  const [pending, startTransition] = useTransition();

  const handleClaim = () => {
    startTransition(async () => {
      const res = await fetch("/api/ops/claim-platform-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body?.error || t("unableToClaim");
        toast({
          title: t("claimFailed"),
          description: message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t("platformAdminGranted"),
        description: t("platformAdminGrantedDesc"),
      });
      router.refresh();
    });
  };

  return (
    <Button variant={variant} onClick={handleClaim} disabled={pending}>
      {pending ? t("claiming") : t("claimPlatformAdmin")}
    </Button>
  );
}
