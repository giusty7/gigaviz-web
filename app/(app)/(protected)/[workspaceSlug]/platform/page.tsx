import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import {
  ArrowRight,
  Building2,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react";
import { GetStartedPanel } from "@/components/onboarding/get-started-panel";
import { WorkspaceActions } from "@/components/platform/workspace-actions";
import { PlatformAuditEvents, PlatformChecklist } from "@/components/platform/platform-suspense-sections";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { Skeleton } from "@/components/ui/skeleton";
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

  // Parallel fetch: plan info + onboarding signals + member count (for summary cards)
  const [planInfo, onboardingSignals, memberResult] = await Promise.all([
    getWorkspacePlan(workspace.id),
    getOnboardingSignals(workspace.id),
    supabaseAdmin()
      .from("workspace_members")
      .select("user_id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id),
  ]);

  const planLabel = planInfo.displayName;
  const memberCount = memberResult.count ?? 0;

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

  return (
    <div className="relative space-y-6">
      {/* Cyber-Batik Pattern Background */}
      <div className="pointer-events-none fixed inset-0 batik-pattern opacity-[0.03]" aria-hidden />

      {/* Imperium Page Header */}
      <PageHeader
        title="Imperial Platform"
        description="Manage workspaces, members, roles, billing, and audit trails from your command center."
        titleClassName="bg-gradient-to-r from-gigaviz-gold via-gigaviz-gold-bright to-gigaviz-gold bg-clip-text text-transparent"
        badge={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-gigaviz-gold-bright/10 shadow-lg shadow-accent/10">
              <Building2 className="h-5 w-5 text-accent" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-success">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Command Center
            </div>
          </div>
        }
      />

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
            <div key={card.title} className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gigaviz-surface/80 p-5 backdrop-blur-xl transition-all hover:border-accent/40">
              <div className="pointer-events-none absolute inset-0 rounded-2xl gradient-overlay-gold-tr-soft" aria-hidden />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{card.title}</p>
                  <span className="rounded-full bg-accent/10 p-2 text-accent">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                </div>
                <p className="text-xl font-bold bg-gradient-to-r from-accent to-gigaviz-gold-bright bg-clip-text text-transparent">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.helper}</p>
                {/* Add workspace actions to first card */}
                {card.title === "Active workspace" && (
                  <WorkspaceActions
                    workspaceId={workspace.id}
                    workspaceName={workspace.name}
                    workspaceSlug={workspace.slug}
                    workspaceDescription={workspace.description}
                    workspaceType={workspace.workspace_type}
                    userRole={ctx.currentRole ?? "member"}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gigaviz-surface/80 p-6 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 rounded-2xl gradient-overlay-magenta-bl-soft" aria-hidden />
        <div className="relative">
          <div className="flex flex-col gap-3 mb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-destructive" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
              </div>
              <p className="text-sm text-muted-foreground">Jump to the controls you need most.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Plan: {planLabel}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center justify-between rounded-xl border border-accent/10 bg-background/50 px-4 py-3 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10 motion-reduce:transform-none"
              >
                <div className="text-left">
                  <div>{action.label}</div>
                  <p className="text-xs font-normal text-muted-foreground">{action.helper}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-accent transition group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Checklist — streams independently via Suspense */}
        <Suspense fallback={<Skeleton className="h-64 rounded-2xl bg-accent/10" />}>
          <PlatformChecklist workspaceId={workspace.id} />
        </Suspense>

        {/* Audit events — streams independently via Suspense */}
        <Suspense fallback={<SkeletonList rows={4} />}>
          <PlatformAuditEvents workspaceId={workspace.id} workspaceSlug={workspaceSlug} />
        </Suspense>
      </div>
    </div>
  );
}