import { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { OpsShell } from "@/components/platform/OpsShell";
import ExportsClient from "@/components/ops/analytics/ExportsClient";

export const metadata: Metadata = {
  title: "Data Exports | Ops Console",
  description: "Export workspace and user data",
};

export const dynamic = "force-dynamic";

export default async function ExportsPage() {
  const admin = await requirePlatformAdmin();

  if (!admin) {
    return null;
  }

  return (
    <OpsShell>
      <ExportsClient />
    </OpsShell>
  );
}
