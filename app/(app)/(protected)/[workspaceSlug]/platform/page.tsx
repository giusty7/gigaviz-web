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
import { GetStartedPanel } from "@/components/onboarding/get-started-panel";
import { getAppContext } from "@/lib/app-context";
import {
  getOnboardingSignals,
  buildOnboardingSteps,
  getOnboardingProgress,
  getNextIncompleteStep,
} from "@/lib/onboarding/signals";
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

  // Onboarding signals
  const onboardingSignals = await getOnboardingSignals(workspace.id);
  const onboardingSteps = buildOnboardingSteps(onboardingSignals, workspaceSlug);
  const onboardingProgress = getOnboardingProgress(onboardingSteps);
  const nextOnboardingStep = getNextIncompleteStep(onboardingSteps);

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
    <div className="relative space-y-6">
      {/* Cyber-Batik Pattern Background */}
      <div className="pointer-events-none fixed inset-0 batik-pattern opacity-[0.03]" aria-hidden />

      {/* Imperium Page Header */}
      <div className="relative mb-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 shadow-lg shadow-[#d4af37]/10">
            <Building2 className="h-5 w-5 text-[#d4af37]" />
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[#10b981]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#10b981]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10b981]" />
            </span>
            Command Center
          </div>
        </div>
        <h1 className="text-2xl font-bold md:text-3xl">
          <span className="bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent">
            Imperial Platform
          </span>
        </h1>
        <p className="mt-2 text-sm text-[#f5f5dc]/60">
          Manage workspaces, members, roles, billing, and audit trails from your command center.
        </p>
      </div>

      {/* Get Started wizard */}
      <GetStartedPanel
        workspaceId={workspace.id}
        workspaceSlug={workspaceSlug}
        userId={ctx.user.id}
        steps={onboardingSteps}
        progress={onboardingProgress}
        nextStep={nextOnboardingStep}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-5 backdrop-blur-xl transition-all hover:border-[#d4af37]/40">
              <div className="pointer-events-none absolute inset-0 rounded-2xl gradient-overlay-gold-tr-soft" aria-hidden />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-wider text-[#f5f5dc]/50">{card.title}</p>
                  <span className="rounded-full bg-[#d4af37]/10 p-2 text-[#d4af37]">
                    <Icon size={16} />
                  </span>
                </div>
                <p className="text-xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">{card.value}</p>
                <p className="mt-1 text-xs text-[#f5f5dc]/50">{card.helper}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 rounded-2xl gradient-overlay-magenta-bl-soft" aria-hidden />
        <div className="relative">
          <div className="flex flex-col gap-3 mb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-[#e11d48]" />
                <h2 className="text-lg font-semibold text-[#f5f5dc]">Quick Actions</h2>
              </div>
              <p className="text-sm text-[#f5f5dc]/60">Jump to the controls you need most.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1.5 text-xs font-semibold text-[#d4af37]">
              <Sparkles className="h-3 w-3" />
              Plan: {planLabel}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center justify-between rounded-xl border border-[#d4af37]/10 bg-[#050a18]/50 px-4 py-3 text-sm font-semibold text-[#f5f5dc] transition-all hover:-translate-y-0.5 hover:border-[#d4af37]/40 hover:shadow-lg hover:shadow-[#d4af37]/10 motion-reduce:transform-none"
              >
                <div className="text-left">
                  <div>{action.label}</div>
                  <p className="text-xs font-normal text-[#f5f5dc]/50">{action.helper}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#d4af37] transition group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </div>

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
