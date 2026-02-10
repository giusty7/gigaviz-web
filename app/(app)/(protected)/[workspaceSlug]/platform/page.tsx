import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
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
        {/* Checklist — streams independently via Suspense */}
        <Suspense fallback={<Skeleton className="h-64 rounded-2xl bg-[#d4af37]/10" />}>
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