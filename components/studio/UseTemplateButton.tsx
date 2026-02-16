"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Loader2 } from "lucide-react";

interface UseTemplateButtonProps {
  templateId: string;
  workspaceSlug: string;
}

export function UseTemplateButton({ templateId, workspaceSlug }: UseTemplateButtonProps) {
  const t = useTranslations("studio");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClone = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/studio/office/templates/${templateId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const { data } = await res.json();
        router.push(`/${workspaceSlug}/modules/studio/office/${data.id}`);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || t("common.cloneFailed"));
      }
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClone}
        disabled={loading}
        className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("common.cloning")}
          </>
        ) : (
          <>
            {t("common.useTemplate")} <ArrowRight className="h-3 w-3" />
          </>
        )}
      </button>
      {error && (
        <p className="mt-1 text-[10px] text-red-400">{error}</p>
      )}
    </div>
  );
}
