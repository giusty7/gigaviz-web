import { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { OpsShell } from "@/components/platform/OpsShell";
import WorkspaceTemplatesClient from "@/components/ops/operations/WorkspaceTemplatesClient";

export const metadata: Metadata = {
  title: "Workspace Templates | Ops Console",
  description: "Manage workspace templates for quick provisioning",
};

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const admin = await requirePlatformAdmin();

  if (!admin) {
    return null;
  }

  return (
    <OpsShell>
      <WorkspaceTemplatesClient />
    </OpsShell>
  );
}
