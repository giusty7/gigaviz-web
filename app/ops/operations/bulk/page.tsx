import { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { OpsShell } from "@/components/platform/OpsShell";
import BulkOperationsClient from "@/components/ops/operations/BulkOperationsClient";

export const metadata: Metadata = {
  title: "Bulk Operations | Ops Console",
  description: "Execute operations on multiple targets",
};

export const dynamic = "force-dynamic";

export default async function BulkOpsPage() {
  const admin = await requirePlatformAdmin();

  if (!admin) {
    return null;
  }

  return (
    <OpsShell>
      <BulkOperationsClient />
    </OpsShell>
  );
}
