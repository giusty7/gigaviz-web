import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Circle, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabaseAdmin } from "@/lib/supabase/admin";

function formatRelativeTime(input?: string | null) {
  if (!input) return "Just now";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

function ScrollIndicator({ action }: { action: string }) {
  if (action.startsWith("member")) return <BadgeCheck className="h-4 w-4" />;
  if (action.startsWith("billing")) return <Sparkles className="h-4 w-4" />;
  if (action.includes("audit")) return <ShieldCheck className="h-4 w-4" />;
  if (action.includes("workspace")) return <Building2 className="h-4 w-4" />;
  if (action.includes("feature")) return <Circle className="h-4 w-4" />;
  return <Clock3 className="h-4 w-4" />;
}

/**
 * Async server component — renders the audit events card.
 * Designed to be wrapped with <Suspense> for streaming.
 */
export async function PlatformAuditEvents({
  workspaceId,
  workspaceSlug,
}: {
  workspaceId: string;
  workspaceSlug: string;
}) {
  const db = supabaseAdmin();

  const { data: recentAudit } = await db
    .from("audit_events")
    .select("id, action, actor_email, created_at, meta")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <Card className="bg-card/85 border-border/80">
      <CardHeader className="flex flex-col gap-1">
        <CardTitle>Recent audit events</CardTitle>
        <CardDescription>Workspace-scoped actions recorded in the last 50 events.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {(recentAudit ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d4af37]/30 bg-[#050a18]/30 px-4 py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10">
              <Clock3 className="h-6 w-6 text-[#d4af37]" />
            </div>
            <p className="font-semibold text-[#d4af37]">Awaiting Sovereignty</p>
            <p className="mt-1 text-xs text-[#f5f5dc]/50">
              Trigger actions like role updates or billing requests to populate the log.
            </p>
          </div>
        ) : (
          recentAudit!.map((evt) => (
            <div
              key={evt.id}
              className="flex items-start justify-between rounded-xl border border-border/80 bg-background px-4 py-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gigaviz-surface/60 text-gigaviz-gold">
                    <ScrollIndicator action={evt.action} />
                  </span>
                  <div>
                    <p className="font-semibold leading-tight">{evt.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {evt.actor_email ?? "Unknown actor"}
                    </p>
                  </div>
                </div>
                {evt.meta ? (
                  <p className="text-xs text-muted-foreground">
                    {JSON.stringify(evt.meta)}
                  </p>
                ) : null}
              </div>
              <span className="text-xs text-muted-foreground">{formatRelativeTime(evt.created_at)}</span>
            </div>
          ))
        )}

        <Link
          href={`/${workspaceSlug}/platform/audit`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gigaviz-gold hover:underline"
        >
          View full audit log
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

/**
 * Async server component — renders the setup checklist card.
 * Designed to be wrapped with <Suspense> for streaming.
 */
export async function PlatformChecklist({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const db = supabaseAdmin();

  const [memberResult, roleResult, billingResult, auditResult, planResult] = await Promise.all([
    db
      .from("workspace_members")
      .select("user_id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    db
      .from("workspace_members")
      .select("user_id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .not("role", "is", null),
    db
      .from("billing_requests")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    db
      .from("audit_events")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    // Simple check: workspace has any subscription-level record
    db
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .neq("plan_id", "free_locked"),
  ]);

  const memberCount = memberResult.count ?? 0;
  const membersWithRole = roleResult.count ?? 0;
  const billingRequestCount = billingResult.count ?? 0;
  const auditEventCount = auditResult.count ?? 0;
  const isPaid = (planResult.count ?? 0) > 0;

  const checklist = [
    {
      label: "Workspace created",
      done: true,
      helper: "You are inside an active workspace.",
    },
    {
      label: "Invite at least 2 members",
      done: memberCount >= 2,
      helper: memberCount >= 2 ? "Team ready" : "Add a teammate to collaborate.",
    },
    {
      label: "Assign roles",
      done: memberCount > 0 && membersWithRole === memberCount,
      helper:
        membersWithRole === memberCount
          ? "Roles applied to all members."
          : "Set owner/admin/member per person.",
    },
    {
      label: "Audit logging",
      done: auditEventCount > 0,
      helper: auditEventCount > 0 ? "Events captured." : "No audit events yet.",
    },
    {
      label: "Billing ready",
      done: isPaid || billingRequestCount > 0,
      helper: isPaid ? "Paid plan active." : "Submit an upgrade request to unlock paid features.",
    },
  ];

  return (
    <Card className="bg-card/85 border-border/80">
      <CardHeader>
        <CardTitle>Setup checklist</CardTitle>
        <CardDescription>What&apos;s left to unlock a secure, production-ready workspace.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2">
        {checklist.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-xl border border-border/80 bg-background px-4 py-3 text-sm"
          >
            <div>
              <p className="font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.helper}</p>
            </div>
            <Badge
              variant={item.done ? "outline" : "secondary"}
              className={item.done ? "border-emerald-400/70 text-emerald-200" : "bg-gigaviz-surface text-muted-foreground"}
            >
              {item.done ? "Done" : "TODO"}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
