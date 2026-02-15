import { redirect } from "next/navigation";
import { OpsShell } from "@/components/platform/OpsShell";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import TicketsClient from "@/components/ops/TicketsClient";

export const dynamic = "force-dynamic";

export default async function OpsTicketsPage() {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Support Tickets</h1>
          <p className="text-slate-400">Manage customer support requests and track resolutions.</p>
        </div>

        <TicketsClient adminUserId={admin.user.id} />
      </div>
    </OpsShell>
  );
}
