import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { OpsShell } from "@/components/platform/OpsShell";
import FeatureFlagManagerClient from "@/components/ops/dev-tools/FeatureFlagManagerClient";

export const metadata: Metadata = {
  title: "Feature Flags | Developer Tools",
  description: "Manage feature toggles",
};

export const dynamic = "force-dynamic";

export default async function FeatureFlagsPage() {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <FeatureFlagManagerClient />
    </OpsShell>
  );
}
