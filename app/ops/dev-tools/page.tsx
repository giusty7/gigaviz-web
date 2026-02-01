import { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { OpsShell } from "@/components/platform/OpsShell";
import Link from "next/link";
import { Code, Webhook, Database, Flag } from "lucide-react";

export const metadata: Metadata = {
  title: "Developer Tools | Ops Console",
  description: "Development and debugging tools",
};

export const dynamic = "force-dynamic";

export default async function DevToolsPage() {
  const admin = await requirePlatformAdmin();

  if (!admin.ok) {
    throw new Error("Unauthorized");
  }

  const tools = [
    {
      name: "Webhook Debugger",
      description: "View and debug incoming webhook payloads",
      icon: Webhook,
      href: "/ops/dev-tools/webhooks",
      color: "text-blue-400",
      bg: "bg-blue-950/30",
      border: "border-blue-900/50",
    },
    {
      name: "Feature Flags",
      description: "Manage feature toggles per workspace",
      icon: Flag,
      href: "/ops/dev-tools/feature-flags",
      color: "text-green-400",
      bg: "bg-green-950/30",
      border: "border-green-900/50",
    },
    {
      name: "SQL Runner",
      description: "Execute read-only SQL queries",
      icon: Database,
      href: "/ops/dev-tools/sql-runner",
      color: "text-purple-400",
      bg: "bg-purple-950/30",
      border: "border-purple-900/50",
    },
    {
      name: "API Playground",
      description: "Test internal API endpoints",
      icon: Code,
      href: "/ops/dev-tools/api-playground",
      color: "text-orange-400",
      bg: "bg-orange-950/30",
      border: "border-orange-900/50",
    },
  ];

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Developer Tools</h1>
          <p className="text-slate-400 mt-1">Debugging and development utilities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className={`rounded-lg border ${tool.border} ${tool.bg} p-6 hover:bg-opacity-50 transition-all`}
            >
              <div className="flex items-start gap-4">
                <div className={`${tool.color}`}>
                  <tool.icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">{tool.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-4">
          <p className="text-sm text-yellow-400">
            ⚠️ <strong>Warning:</strong> These tools have elevated privileges. Use with caution in production.
          </p>
        </div>
      </div>
    </OpsShell>
  );
}
