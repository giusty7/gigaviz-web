import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { OpsShell } from "@/components/platform/OpsShell";
import ScheduledActionsClient from "@/components/ops/operations/ScheduledActionsClient";

export const metadata: Metadata = {
  title: "Scheduled Actions | Ops Console",
  description: "Manage scheduled future actions",
};

export const dynamic = "force-dynamic";

export default async function ScheduledPage() {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <ScheduledActionsClient />
    </OpsShell>
  );
}
