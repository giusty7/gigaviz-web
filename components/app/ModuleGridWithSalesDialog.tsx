"use client";

import ContactSalesDialog from "@/components/app/ContactSalesDialog";
import ModuleGrid, { type ModuleItem } from "@/components/app/ModuleGrid";
import FeatureInterestDialog from "@/components/app/FeatureInterestDialog";
import type { PlanMeta } from "@/lib/entitlements";

type ModuleGridWithSalesDialogProps = {
  modules: ModuleItem[];
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  userEmail: string;
  planOptions: PlanMeta[];
  defaultPlanId?: string | null;
};

export default function ModuleGridWithSalesDialog(props: ModuleGridWithSalesDialogProps) {
  const { modules, workspaceId, workspaceName, workspaceSlug, userEmail, planOptions, defaultPlanId } = props;

  return (
    <FeatureInterestDialog workspaceId={workspaceId}>
      {(openNotify) => (
        <ContactSalesDialog
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          workspaceSlug={workspaceSlug}
          userEmail={userEmail}
          planOptions={planOptions}
          defaultPlanId={defaultPlanId}
        >
          {(openSalesDialog) => (
            <ModuleGrid
              modules={modules}
              onUnlock={(module) => openSalesDialog(module.planId)}
              onNotify={(module) => openNotify(module.slug ?? module.key, module.name)}
            />
          )}
        </ContactSalesDialog>
      )}
    </FeatureInterestDialog>
  );
}
