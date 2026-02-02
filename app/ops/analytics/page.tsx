import { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { OpsShell } from "@/components/platform/OpsShell";
import AnalyticsDashboardClient from "@/components/ops/analytics/AnalyticsDashboardClient";

export const metadata: Metadata = {
  title: "Business Analytics | Ops Console",
  description: "Revenue, growth, and usage analytics",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const admin = await requirePlatformAdmin();

  if (!admin) {
    return null;
  }

  return (
    <OpsShell>
      <AnalyticsDashboardClient />
    </OpsShell>
  );
}
