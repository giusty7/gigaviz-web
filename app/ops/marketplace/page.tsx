import { OpsShell } from "@/components/platform/OpsShell";
import { redirect } from "next/navigation";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  Store, CheckCircle, XCircle, Clock, Eye, Package,
  AlertTriangle, TrendingUp, DollarSign,
} from "lucide-react";
import Link from "next/link";
import { MarketplaceModerationActions } from "@/components/ops/MarketplaceModerationActions";

export const dynamic = "force-dynamic";

export default async function OpsMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  assertOpsEnabled();
  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  const filters = await searchParams;
  const statusFilter = filters.status || "under_review";
  const page = parseInt(filters.page || "1", 10);
  const perPage = 20;

  const db = supabaseAdmin();

  // Fetch items with the given status
  const query = db
    .from("marketplace_items")
    .select("*, workspaces!marketplace_items_creator_workspace_id_fkey(name, slug)", { count: "exact" })
    .eq("status", statusFilter)
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  const { data: items, count: totalCount } = await query;

  // Aggregate stats
  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
    { count: totalItems },
  ] = await Promise.all([
    db.from("marketplace_items").select("*", { count: "exact", head: true }).eq("status", "under_review"),
    db.from("marketplace_items").select("*", { count: "exact", head: true }).eq("status", "approved"),
    db.from("marketplace_items").select("*", { count: "exact", head: true }).eq("status", "rejected"),
    db.from("marketplace_items").select("*", { count: "exact", head: true }),
  ]);

  // Revenue stats
  const { data: revenueData } = await db
    .from("marketplace_purchases")
    .select("platform_fee_cents")
    .eq("payment_status", "completed");

  const totalRevenue = (revenueData ?? []).reduce(
    (sum, p) => sum + (p.platform_fee_cents || 0), 0
  );

  const statusTabs = [
    { key: "under_review", label: "Pending Review", count: pendingCount ?? 0, icon: Clock, color: "text-yellow-500" },
    { key: "approved", label: "Approved", count: approvedCount ?? 0, icon: CheckCircle, color: "text-green-500" },
    { key: "rejected", label: "Rejected", count: rejectedCount ?? 0, icon: XCircle, color: "text-red-500" },
    { key: "draft", label: "Drafts", count: null, icon: Package, color: "text-gray-500" },
    { key: "archived", label: "Archived", count: null, icon: AlertTriangle, color: "text-gray-400" },
  ];

  const totalPages = Math.ceil((totalCount ?? 0) / perPage);

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Store className="h-6 w-6 text-amber-400" />
            Marketplace Moderation
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Review, approve, or reject marketplace item submissions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{totalItems ?? 0}</p>
                <p className="text-xs text-slate-400">Total Items</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-yellow-700/30 bg-yellow-900/20 p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-yellow-400">{pendingCount ?? 0}</p>
                <p className="text-xs text-slate-400">Pending Review</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-green-700/30 bg-green-900/20 p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-green-400">{approvedCount ?? 0}</p>
                <p className="text-xs text-slate-400">Approved</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-emerald-700/30 bg-emerald-900/20 p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-emerald-400">
                  ${(totalRevenue / 100).toFixed(2)}
                </p>
                <p className="text-xs text-slate-400">Platform Revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 border-b border-slate-700 pb-2">
          {statusTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.key === statusFilter;
            return (
              <Link
                key={tab.key}
                href={`/ops/marketplace?status=${tab.key}`}
                className={`inline-flex items-center gap-2 rounded-t-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? tab.color : ""}`} />
                {tab.label}
                {tab.count !== null && (
                  <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                    isActive ? "bg-slate-600" : "bg-slate-800"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Items Table */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/50">
          {!items || items.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-slate-600" />
              <p className="text-sm text-slate-400">
                No items with status &quot;{statusFilter.replace("_", " ")}&quot;
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {items.map((item) => {
                const workspace = item.workspaces as { name: string; slug: string } | null;
                return (
                  <div key={item.id} className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-white">{item.title}</h3>
                        <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                          {item.category}
                        </span>
                        <span className="text-xs text-slate-500">
                          ${(item.price_usd / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>by {workspace?.name ?? "Unknown"}</span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{item.tags?.join(", ") || "no tags"}</span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {workspace?.slug && (
                        <Link
                          href={`/${workspace.slug}/marketplace/items/${item.slug}`}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-600 px-2 text-xs text-slate-300 hover:bg-slate-700"
                          target="_blank"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Link>
                      )}
                      {statusFilter === "under_review" && (
                        <MarketplaceModerationActions itemId={item.id} itemTitle={item.title} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount ?? 0)} of {totalCount ?? 0}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/ops/marketplace?status=${statusFilter}&page=${page - 1}`}
                  className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/ops/marketplace?status=${statusFilter}&page=${page + 1}`}
                  className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </OpsShell>
  );
}
