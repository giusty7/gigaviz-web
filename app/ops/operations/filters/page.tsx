import { Metadata } from "next";
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

  if (!admin) {
    return null;
  }

  return (
    <OpsShell>
      <SavedFiltersClient />
    </OpsShell>
  );
}
