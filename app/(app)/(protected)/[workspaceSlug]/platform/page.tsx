import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Circle,
  Clock3,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppContext } from "@/lib/app-context";
import { getWorkspacePlan } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

type PlatformOverviewPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

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

export default async function PlatformOverviewPage({ params }: PlatformOverviewPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");
  const workspace = ctx.currentWorkspace;

  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/platform`);
  }

  await ensureWorkspaceCookie(workspace.id);

  const planInfo = await getWorkspacePlan(workspace.id);
  const planLabel = planInfo.displayName;
  const isPaid = planInfo.planId !== "free_locked";
  const db = supabaseAdmin();

  const { count: memberCount } = await db
    .from("workspace_members")
    .select("user_id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  const { count: membersWithRole } = await db
    .from("workspace_members")
    .select("user_id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id)
    .not("role", "is", null);

  const { count: billingRequestCount } = await db
    .from("billing_requests")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  const { count: auditEventCount } = await db
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  const { data: recentAudit } = await db
    .from("audit_events")
    .select("id, action, actor_email, created_at, meta")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const summaryCards = [
    {
      title: "Active workspace",
      value: workspace.name,
      helper: workspace.slug,
      icon: Building2,
    },
    {
      title: "Members",
      value: memberCount ?? 0,
      helper: memberCount ? `${memberCount} members` : "No members yet",
      icon: Users2,
    },
    {
      title: "Your role",
      value: ctx.currentRole ? ctx.currentRole : "member",
      helper: "Access follows your workspace role.",
      icon: ShieldCheck,
    },
    {
      title: "Plan",
      value: planLabel,
      helper: planInfo.status ?? "Active plan",
      icon: Sparkles,
    },
  ];

  const quickActions = [
    {
      label: "Create or manage workspaces",
      href: `/${workspaceSlug}/platform/workspaces`,
      helper: "Spin up a new workspace or switch context.",
    },
    {
      label: "Invite members",
      href: `/${workspaceSlug}/platform/roles`,
      helper: "Send invites and manage seat access.",
    },
    {
      label: "Manage roles & access",
      href: `/${workspaceSlug}/platform/roles`,
      helper: "Owner/Admin can set least-privilege roles.",
    },
    {
      label: "View audit log",
      href: `/${workspaceSlug}/platform/audit`,
      helper: "Track important changes by user.",
    },
    {
      label: "Billing & plans",
      href: `/${workspaceSlug}/platform/billing`,
      helper: "Request upgrades or view plan details.",
    },
  ];

  const checklist = [
    {
      label: "Workspace created",
      done: true,
      helper: "You are inside an active workspace.",
    },
    {
      label: "Invite at least 2 members",
      done: (memberCount ?? 0) >= 2,
      helper: (memberCount ?? 0) >= 2 ? "Team ready" : "Add a teammate to collaborate.",
    },
    {
      label: "Assign roles",
      done: (memberCount ?? 0) > 0 && (membersWithRole ?? 0) === (memberCount ?? 0),
      helper:
        (membersWithRole ?? 0) === (memberCount ?? 0)
          ? "Roles applied to all members."
          : "Set owner/admin/member per person.",
    },
    {
      label: "Audit logging",
      done: (auditEventCount ?? 0) > 0,
      helper: (auditEventCount ?? 0) > 0 ? "Events captured." : "No audit events yet.",
    },
    {
      label: "Billing ready",
      done: isPaid || (billingRequestCount ?? 0) > 0,
      helper: isPaid ? "Paid plan active." : "Submit an upgrade request to unlock paid features.",
    },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="bg-card/80 border-border/80">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm text-muted-foreground">{card.title}</CardTitle>
                <span className="rounded-full bg-gigaviz-surface/60 p-2 text-gigaviz-gold">
                  <Icon size={16} />
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.helper}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card/85 border-border/80">
        <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump to the controls you need most.</CardDescription>
          </div>
          <Badge variant="outline" className="border-gigaviz-gold/60 text-gigaviz-gold">
            Plan: {planLabel}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center justify-between rounded-xl border border-border/80 bg-gigaviz-surface/70 px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-gigaviz-gold hover:shadow-lg hover:shadow-gigaviz-gold/10 motion-reduce:transform-none"
            >
              <div className="text-left">
                <div>{action.label}</div>
                <p className="text-xs font-normal text-muted-foreground">{action.helper}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gigaviz-gold transition group-hover:translate-x-1" />
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-card/85 border-border/80">
          <CardHeader>
            <CardTitle>Setup checklist</CardTitle>
            <CardDescription>What’s left to unlock a secure, production-ready workspace.</CardDescription>
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

        <Card className="bg-card/85 border-border/80">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>Recent audit events</CardTitle>
            <CardDescription>Workspace-scoped actions recorded in the last 50 events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {(recentAudit ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-background px-4 py-6 text-center">
                <p className="font-semibold text-foreground">No events yet</p>
                <p className="text-xs text-muted-foreground">
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
              href={`/${workspace.slug}/platform/audit`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gigaviz-gold hover:underline"
            >
              View full audit log
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScrollIndicator({ action }: { action: string }) {
  if (action.startsWith("member")) return <BadgeCheck className="h-4 w-4" />;
  if (action.startsWith("billing")) return <Sparkles className="h-4 w-4" />;
  if (action.includes("audit")) return <ShieldCheck className="h-4 w-4" />;
  if (action.includes("workspace")) return <Building2 className="h-4 w-4" />;
  if (action.includes("feature")) return <Circle className="h-4 w-4" />;
  return <Clock3 className="h-4 w-4" />;
}
