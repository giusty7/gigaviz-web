import { OpsShell } from "@/components/platform/OpsShell";
import CannedResponsesClient from "@/components/ops/CannedResponsesClient";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CannedResponsesPage() {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Canned Responses</h1>
          <p className="text-slate-400">Manage response templates for support tickets.</p>
        </div>

        <CannedResponsesClient />
      </div>
    </OpsShell>
  );
}
