"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  variant?: "default" | "outline" | "secondary";
};

export function ClaimPlatformAdminButton({ variant = "default" }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const handleClaim = () => {
    startTransition(async () => {
      const res = await fetch("/api/ops/claim-platform-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body?.error || "Unable to claim platform admin";
        toast({
          title: "Claim failed",
          description: message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Platform admin granted",
        description: "You now have platform admin access.",
      });
      router.refresh();
    });
  };

  return (
    <Button variant={variant} onClick={handleClaim} disabled={pending}>
      {pending ? "Claiming..." : "Claim Platform Admin"}
    </Button>
  );
}
