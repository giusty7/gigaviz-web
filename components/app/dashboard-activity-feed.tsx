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
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-[#f5f5dc]/30">
          Recent Activity
        </h3>
        <Link
          href={`/${workspaceSlug}/platform/audit`}
          className="text-[11px] font-medium text-[#d4af37]/60 hover:text-[#d4af37] transition flex items-center gap-1"
        >
          View all <Activity className="h-3 w-3" />
        </Link>
      </div>

      {activityItems.length === 0 ? (
        <div className="rounded-xl border border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02] px-4 py-6 text-center">
          <p className="text-xs font-medium text-[#f5f5dc]/40">No activity yet</p>
          <p className="mt-1 text-[11px] text-[#f5f5dc]/20">
            Actions in your workspace will appear here
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#f5f5dc]/[0.04] rounded-xl border border-[#f5f5dc]/[0.06] bg-[#f5f5dc]/[0.02]">
          {activityItems.slice(0, 6).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2.5 transition hover:bg-[#f5f5dc]/[0.02]">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#f5f5dc]/70 truncate">
                  {item.action}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-[10px] text-[#f5f5dc]/30 truncate">
                    {item.actor.split("@")[0]}
                  </p>
                  {item.moduleTag && (
                    <span className="rounded bg-[#d4af37]/10 px-1 py-px text-[9px] font-semibold uppercase text-[#d4af37]/60">
                      {item.moduleTag}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-[#f5f5dc]/20 whitespace-nowrap">
                {formatRelativeTime(item.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
