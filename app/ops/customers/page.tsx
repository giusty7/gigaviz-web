import { OpsShell } from "@/components/platform/OpsShell";
import CustomerSearchClient from "@/components/ops/CustomerSearchClient";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { getSearchHistory } from "@/lib/ops/customers";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  assertOpsEnabled();

  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  const searchHistory = await getSearchHistory(20);

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Customer Lookup</h1>
          <p className="text-slate-400">
            Search for customers by email, phone, workspace slug, or ID
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <CustomerSearchClient />
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-slate-400" />
              <h2 className="text-xl font-semibold text-white">Recent Searches</h2>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Query
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Results
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {searchHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-white font-mono">{entry.query}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                          {entry.queryType || "unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">{entry.resultCount}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </OpsShell>
  );
}
