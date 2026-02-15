import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { OpsShell } from "@/components/platform/OpsShell";
import ApiPlaygroundClient from "@/components/ops/dev-tools/ApiPlaygroundClient";

export const metadata: Metadata = {
  title: "API Playground | Developer Tools",
  description: "Test internal API endpoints",
};

export const dynamic = "force-dynamic";

export default async function ApiPlaygroundPage() {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <ApiPlaygroundClient />
    </OpsShell>
  );
}
