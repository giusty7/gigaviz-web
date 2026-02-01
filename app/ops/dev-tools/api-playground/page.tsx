import { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { OpsShell } from "@/components/platform/OpsShell";

export const metadata: Metadata = {
  title: "API Playground | Developer Tools",
  description: "Test internal API endpoints",
};

export const dynamic = "force-dynamic";

export default async function ApiPlaygroundPage() {
  const admin = await requirePlatformAdmin();

  if (!admin.ok) {
    throw new Error("Unauthorized");
  }

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">API Playground</h1>
          <p className="text-slate-400 mt-1">Test internal API endpoints</p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-6">
          <p className="text-slate-400 text-center">Coming soon...</p>
        </div>
      </div>
    </OpsShell>
  );
}
