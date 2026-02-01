import { redirect } from "next/navigation";
import { OpsShell } from "@/components/platform/OpsShell";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import TicketsClient from "@/components/ops/TicketsClient";

export const dynamic = "force-dynamic";

export default async function OpsTicketsPage() {
  assertOpsEnabled();
  
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    redirect("/login");
  }

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-slate-400">IMPERIUM INTERNAL OPS</p>
          <h1 className="text-3xl font-bold text-white">Support Tickets</h1>
          <p className="text-slate-400">Manage customer support requests and track resolutions.</p>
        </div>

        <TicketsClient adminUserId={admin.user.id} />
      </div>
    </OpsShell>
  );
}
