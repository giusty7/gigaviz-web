import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { OpsShell } from "@/components/platform/OpsShell";
import HealthDashboardClient from "@/components/ops/HealthDashboardClient";

export const metadata: Metadata = {
  title: "System Health | Ops Console",
  description: "Monitor system health and performance",
};

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <HealthDashboardClient />
    </OpsShell>
  );
}
