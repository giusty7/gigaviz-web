"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, LogOut, Loader2 } from "lucide-react";

type ImpersonationBannerProps = {
  actorEmail: string;
  targetEmail: string;
  workspaceSlug: string;
  expiresAt: string;
  impersonationId: string;
};

export default function ImpersonationBanner({
  actorEmail,
  targetEmail,
  workspaceSlug,
  expiresAt,
  impersonationId,
}: ImpersonationBannerProps) {
  const t = useTranslations("appUI.impersonation");
  const [ending, setEnding] = useState(false);

  const handleEndImpersonation = async () => {
    if (!confirm(t("confirmEnd"))) return;

    setEnding(true);
    try {
      const response = await fetch("/api/ops/impersonate", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ impersonationId }),
      });

      if (!response.ok) {
        throw new Error(t("failedEnd"));
      }

      // Redirect to ops console
      window.location.href = "/ops/customers";
    } catch (err) {
      alert(err instanceof Error ? err.message : t("failedEnd"));
      setEnding(false);
    }
  };

  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const minutesLeft = Math.max(0, Math.floor((expiryDate.getTime() - now.getTime()) / 60000));

  return (
    <div className="bg-yellow-500 text-yellow-950 px-4 py-2 flex items-center justify-between gap-4 text-sm font-medium">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5" />
        <div className="flex items-center gap-2 flex-wrap">
          <span>{t("impersonating")}</span>
          <span className="font-bold">{targetEmail}</span>
          <span>{t("inWorkspace")}</span>
          <span className="font-bold">/{workspaceSlug}</span>
          <span className="text-yellow-800">•</span>
          <span>{t("expiresIn", { minutes: minutesLeft })}</span>
          <span className="text-yellow-800">•</span>
          <span className="text-xs">{t("actor", { email: actorEmail })}</span>
        </div>
      </div>

      <button
        onClick={handleEndImpersonation}
        disabled={ending}
        className="px-4 py-1.5 bg-yellow-950 hover:bg-yellow-900 text-yellow-50 rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {ending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("ending")}
          </>
        ) : (
          <>
            <LogOut className="w-4 h-4" />
            {t("endSession")}
          </>
        )}
      </button>
    </div>
  );
}
