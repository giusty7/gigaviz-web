import { notFound } from "next/navigation";
import { OpsShell } from "@/components/platform/OpsShell";
import { EntitlementManagerClient } from "@/components/ops/EntitlementManagerClient";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Entitlement Manager | OPS Platform Admin",
  description: "Grant or revoke product access for workspaces",
};

type Props = {
  searchParams: Promise<{ workspaceId?: string }>;
};

export default async function EntitlementManagerPage({ searchParams }: Props) {
  assertOpsEnabled();

  const admin = await requirePlatformAdmin();
  if (!admin.ok) notFound();

  const { workspaceId } = await searchParams;

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <EntitlementManagerClient initialWorkspaceId={workspaceId} />
    </OpsShell>
  );
}
