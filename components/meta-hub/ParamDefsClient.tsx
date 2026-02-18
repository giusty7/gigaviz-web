"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ParamMappingEditorModal } from "./ParamMappingEditorModal";
import type { WaTemplate, WaTemplateParamDef } from "@/types/wa-templates";

type Props = {
  workspaceSlug: string;
  template: WaTemplate | null;
  paramDefs: WaTemplateParamDef[];
};

export function ParamDefsClient({ workspaceSlug, template, paramDefs }: Props) {
  const router = useRouter();
  const t = useTranslations("metaHubUI.paramDefs");

  // Show template selector if no template
  if (!template) {
    return null; // Server component handles this case
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card/80 p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href={`/${workspaceSlug}/meta-hub/messaging/whatsapp/param-defs`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("allTemplates")}
          </Link>
        </div>

        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold">{template.name}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="capitalize">{template.category?.toLowerCase()}</span>
            <span>•</span>
            <span className="uppercase">{template.language}</span>
            <span>•</span>
            <span>{template.variable_count} {t("parameters")}</span>
          </div>
        </div>

        <ParamMappingEditorModal
          template={template}
          existingDefs={paramDefs}
          onClose={() => router.push(`/${workspaceSlug}/meta-hub/messaging/whatsapp/param-defs`)}
          onSaved={() => router.refresh()}
        />
      </div>
    </div>
  );
}
