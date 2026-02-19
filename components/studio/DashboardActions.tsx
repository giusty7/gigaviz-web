"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Globe, Lock, Loader2 } from "lucide-react";
import { EntityActions } from "./EntityActions";

type Props = {
  dashboardId: string;
  workspaceSlug: string;
  title: string;
  description: string;
  isPublic: boolean;
};

export function DashboardActions({ dashboardId, workspaceSlug, title, description, isPublic: initPublic }: Props) {
  const t = useTranslations("studio");
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initPublic);
  const [toggling, setToggling] = useState(false);

  const handleTogglePublic = async () => {
    setToggling(true);
    try {
      const res = await fetch(`/api/studio/graph/dashboards/${dashboardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: !isPublic }),
      });
      if (res.ok) {
        setIsPublic(!isPublic);
        router.refresh();
      }
    } finally {
      setToggling(false);
    }
  };

  return (
    <EntityActions
      entityId={dashboardId}
      workspaceSlug={workspaceSlug}
      apiPath="/api/studio/graph/dashboards"
      redirectAfterDelete="/modules/studio/graph/dashboards"
      editButtonLabel="dashboards.actions.editDashboard"
      accentColor="purple"
      fields={[
        { key: "title", label: "Title", value: title, placeholder: t("dashboards.actions.titlePlaceholder") },
        { key: "description", label: "Description", value: description, type: "textarea", placeholder: t("common.descriptionPlaceholder"), required: false },
      ]}
      extraPatchFields={{ is_public: isPublic }}
      extraActions={
        <button
          onClick={handleTogglePublic}
          disabled={toggling}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors ${
            isPublic
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
              : "bg-[#f5f5dc]/5 text-[#f5f5dc]/40 border border-[#f5f5dc]/10 hover:text-[#f5f5dc]"
          }`}
        >
          {toggling ? <Loader2 className="h-3 w-3 animate-spin" /> : isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {isPublic ? t("common.public") : t("common.private")}
        </button>
      }
    />
  );
}
