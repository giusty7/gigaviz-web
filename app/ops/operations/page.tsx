import { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { OpsShell } from "@/components/platform/OpsShell";
import Link from "next/link";
import { Zap, Clock, Copy, Filter, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Advanced Operations | Ops Console",
  description: "Bulk operations, scheduled actions, and more",
};

export const dynamic = "force-dynamic";

const tools = [
  {
    title: "Bulk Operations",
    description: "Execute operations on multiple workspaces or users at once",
    icon: Zap,
    href: "/ops/operations/bulk",
    color: "text-orange-400 bg-orange-500/10",
  },
  {
    title: "Scheduled Actions",
    description: "Schedule future plan changes, suspensions, or notifications",
    icon: Clock,
    href: "/ops/operations/scheduled",
    color: "text-blue-400 bg-blue-500/10",
  },
  {
    title: "Workspace Templates",
    description: "Create and manage workspace templates for quick provisioning",
    icon: Copy,
    href: "/ops/operations/templates",
    color: "text-purple-400 bg-purple-500/10",
  },
  {
    title: "Saved Filters",
    description: "Save and share filter presets across the ops console",
    icon: Filter,
    href: "/ops/operations/filters",
    color: "text-green-400 bg-green-500/10",
  },
];

export default async function OperationsPage() {
  const admin = await requirePlatformAdmin();

  if (!admin) {
    return null;
  }

  return (
    <OpsShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Advanced Operations</h1>
          <p className="text-zinc-400">
            Bulk operations, scheduled actions, and workspace management
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
            >
              <div className="flex items-start justify-between">
                <div className={`rounded-lg p-3 ${tool.color}`}>
                  <tool.icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-zinc-600 transition-colors group-hover:text-zinc-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">
                {tool.title}
              </h3>
              <p className="mt-1 text-sm text-zinc-400">{tool.description}</p>
            </Link>
          ))}
        </div>

        {/* Warning */}
        <div className="rounded-lg border border-orange-900/50 bg-orange-950/20 px-4 py-3">
          <p className="text-sm text-orange-400">
            <span className="font-medium">⚠️ Caution:</span> Advanced operations
            can affect multiple workspaces. Always preview before executing bulk
            actions.
          </p>
        </div>
      </div>
    </OpsShell>
  );
}
