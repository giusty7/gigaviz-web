"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Play, Pause, Archive, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EntityActions } from "./EntityActions";

type Props = {
  workflowId: string;
  workspaceSlug: string;
  title: string;
  description: string;
  status: string;
};

export function WorkflowActions({ workflowId, workspaceSlug, title, description, status }: Props) {
  const t = useTranslations("studio");
  const router = useRouter();
  const [statusChanging, setStatusChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    setStatusChanging(true);
    setError(null);
    try {
      const res = await fetch(`/api/studio/tracks/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t("tracks.actions.statusChangeFailed"));
        return;
      }
      router.refresh();
    } catch {
      setError(t("tracks.actions.statusChangeFailed"));
    } finally {
      setStatusChanging(false);
    }
  };

  const statusButtons = (
    <>
      {status === "draft" && (
        <button
          onClick={() => handleStatusChange("active")}
          disabled={statusChanging}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
        >
          {statusChanging ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          {t("tracks.actions.activate")}
        </button>
      )}
      {status === "active" && (
        <button
          onClick={() => handleStatusChange("paused")}
          disabled={statusChanging}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-600 px-4 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
        >
          {statusChanging ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pause className="h-3 w-3" />}
          {t("tracks.actions.pause")}
        </button>
      )}
      {status === "paused" && (
        <button
          onClick={() => handleStatusChange("active")}
          disabled={statusChanging}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
        >
          {statusChanging ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          {t("tracks.actions.resume")}
        </button>
      )}
      {(status === "active" || status === "paused") && (
        <button
          onClick={() => handleStatusChange("archived")}
          disabled={statusChanging}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-xs font-medium transition-colors disabled:opacity-50",
            "border-[#f5f5dc]/10 text-[#f5f5dc]/50 hover:text-[#f5f5dc]"
          )}
        >
          <Archive className="h-3 w-3" />
          {t("tracks.actions.archive")}
        </button>
      )}
    </>
  );

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
      )}
      <EntityActions
        entityId={workflowId}
        workspaceSlug={workspaceSlug}
        apiPath="/api/studio/tracks/workflows"
        redirectAfterDelete="/modules/studio/tracks"
        editButtonLabel="common.edit"
        accentColor="teal"
        fields={[
          { key: "title", label: "Title", value: title },
          { key: "description", label: "Description", value: description, type: "textarea", required: false },
        ]}
        extraActions={statusButtons}
      />
    </div>
  );
}
