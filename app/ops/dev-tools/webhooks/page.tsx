import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { OpsShell } from "@/components/platform/OpsShell";
import WebhookDebuggerClient from "@/components/ops/dev-tools/WebhookDebuggerClient";

export const metadata: Metadata = {
  title: "Webhook Debugger | Developer Tools",
  description: "Debug incoming webhook payloads",
};

export const dynamic = "force-dynamic";

export default async function WebhookDebuggerPage() {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <WebhookDebuggerClient />
    </OpsShell>
  );
}
