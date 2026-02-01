import { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { OpsShell } from "@/components/platform/OpsShell";
import SqlRunnerClient from "@/components/ops/dev-tools/SqlRunnerClient";

export const metadata: Metadata = {
  title: "SQL Runner | Developer Tools",
  description: "Execute read-only SQL queries",
};

export const dynamic = "force-dynamic";

export default async function SqlRunnerPage() {
  const admin = await requirePlatformAdmin();

  if (!admin.ok) {
    throw new Error("Unauthorized");
  }

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <SqlRunnerClient />
    </OpsShell>
  );
}
