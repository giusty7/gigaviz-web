import Link from "next/link";
import { Activity } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatRelativeTime } from "@/lib/time";

/**
 * Async server component — renders the activity feed.
 * Designed to be wrapped with <Suspense> for progressive streaming.
 */
export async function DashboardActivityFeed({
  workspaceId,
  workspaceSlug,
}: {
  workspaceId: string;
  workspaceSlug: string;
}) {
  const db = supabaseAdmin();
  const { data: activityEventsRaw } = await db
    .from("audit_events")
    .select("id, action, actor_email, created_at, meta")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(8);

  const activityEvents = activityEventsRaw ?? [];

  const activityItems = activityEvents.map((event) => {
    const meta = (event as { meta?: Record<string, unknown> | null }).meta ?? null;
    const moduleTag = typeof meta?.module === "string" ? meta.module : undefined;
    const actor = event.actor_email || "System";

    const action = (() => {
      switch (event.action) {
        case "workspace.created":
          return "Workspace created";
        case "member.role_updated":
          return "Member role updated";
        case "billing.requested":
          return "Billing request submitted";
        case "tokens.topup_requested":
          return "Credits top-up requested";
        case "tokens.topup_paid":
          return "Credits applied";
        case "feature.interest":
          return "Feature interest recorded";
        case "meta.message_sent":
          return "WhatsApp message sent";
        case "helper.conversation_started":
          return "Helper conversation started";
        default: {
          const clean = event.action?.replaceAll(".", " → ");
          return clean ? clean : "Activity recorded";
        }
      }
    })();

    return {
      id: event.id,
      action,
      actor,
      moduleTag,
      createdAt: event.created_at,
    };
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]/80 font-semibold">
            Workspace Activity
          </p>
          <h2 className="text-xl font-bold text-[#f5f5dc]">Recent Events</h2>
        </div>
        <Link
          href={`/${workspaceSlug}/platform/audit`}
          className="text-sm font-semibold text-[#d4af37] hover:underline flex items-center gap-1"
        >
          View all <Activity className="h-4 w-4" />
        </Link>
      </div>

      {activityItems.length === 0 ? (
        <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/70 p-6 text-center">
          <p className="font-semibold text-[#f5f5dc] mb-2">No recent activity yet</p>
          <p className="text-sm text-[#f5f5dc]/60">
            Start using your workspace to see activity here
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#d4af37]/15 overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/70">
          {activityItems.slice(0, 6).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[#d4af37]/5 transition">
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-semibold text-[#f5f5dc] truncate">
                  {item.action}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-[#f5f5dc]/60 truncate">
                    {item.actor}
                  </p>
                  {item.moduleTag && (
                    <span className="rounded-full bg-[#d4af37]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#d4af37] border border-[#d4af37]/20">
                      {item.moduleTag}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#f5f5dc]/50 whitespace-nowrap">
                {formatRelativeTime(item.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
