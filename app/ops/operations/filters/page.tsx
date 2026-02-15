import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { OpsShell } from "@/components/platform/OpsShell";
import SavedFiltersClient from "@/components/ops/operations/SavedFiltersClient";

export const metadata: Metadata = {
  title: "Saved Filters | Ops Console",
  description: "Manage saved filter presets",
};

export const dynamic = "force-dynamic";

export default async function FiltersPage() {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <SavedFiltersClient />
    </OpsShell>
  );
}
