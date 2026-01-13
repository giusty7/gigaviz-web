import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionGate } from "@/components/gates/action-gate";
import PreviewBanner from "@/components/modules/preview-banner";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import { getAppContext } from "@/lib/app-context";
import { canAccess } from "@/lib/entitlements";
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

  const planInfo = await getWorkspacePlan(workspace.id);
  const isDevOverride = Boolean(planInfo.devOverride);
  const isPreview = planInfo.planId === "free_locked" && !isDevOverride;
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const entitlementCtx = { plan_id: planInfo.planId, is_admin: isAdmin || isDevOverride };
  const planLabel = isDevOverride ? "DEV (Full Access)" : planInfo.displayName;

  const db = supabaseAdmin();
  const { count: memberCount } = await db
    .from("workspace_members")
    .select("user_id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  const overviewCards = [
    {
      title: "Active workspace",
      value: workspace.name,
      helper: workspace.slug,
    },
    {
      title: "Members",
      value: memberCount ?? 0,
      helper: memberCount ? `${memberCount} members` : copy.emptyStates.members.helper,
    },
    {
      title: "Your role",
      value: ctx.currentRole ?? "Member",
      helper: "Access follows your role.",
    },
    {
      title: "Billing status",
      value: planLabel,
      helper: planInfo.status ?? "Current active plan",
    },
  ];

  const quickActions = [
    {
      label: "Create Workspace",
      href: "/onboarding",
      entitlement: null,
    },
    {
      label: "Invite Members",
      href: `/${workspaceSlug}/settings#members`,
      entitlement: "member_invites" as const,
    },
    {
      label: "Manage Roles (RBAC)",
      href: `/${workspaceSlug}/platform/rbac`,
      entitlement: "roles_permissions" as const,
    },
    {
      label: "View Audit Log",
      href: `/${workspaceSlug}/platform/audit`,
      entitlement: "audit_log" as const,
    },
  ];

  const checklist = [
    "Create the first workspace",
    "Add members",
    "Set roles & permissions",
    "Enable audit log",
    "Set billing & plan",
  ];

  const demoAuditEvents = [
    { action: "workspace.created", actor: ctx.user.email ?? "user", at: "just now" },
    { action: "member.invited", actor: "ops@gigaviz.com", at: "1h ago" },
    { action: "role.updated", actor: "admin@gigaviz.com", at: "3h ago" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Gigaviz Platform - Core OS</h2>
          <p className="text-sm text-muted-foreground">
            Accounts, workspaces, roles, audit, and billing in one dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-gigaviz-gold text-gigaviz-gold">
            Plan: {planLabel}
          </Badge>
          {!isDevOverride && <UpgradeButton label="Upgrade" variant="outline" size="sm" />}
        </div>
      </div>

      {isPreview && <PreviewBanner />}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <Card key={card.title} className="bg-card/80">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common actions to get started faster.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {quickActions.map((action) => {
            const allowed =
              !action.entitlement || canAccess(entitlementCtx, action.entitlement);
            return (
              <ActionGate key={action.label} allowed={allowed}>
                <Link
                  href={action.href}
                  className="flex items-center justify-between rounded-xl border border-border bg-gigaviz-surface px-4 py-3 text-sm font-semibold text-foreground hover:border-gigaviz-gold"
                >
                  <span>{action.label}</span>
                  <span aria-hidden className="text-lg leading-none">{">"}</span>
                </Link>
              </ActionGate>
            );
          })}
        </CardContent>
      </Card>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Setup Checklist</CardTitle>
          <CardDescription>Complete these steps to be production-ready.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {checklist.map((item) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm"
            >
              <div>
                <p className="font-semibold">{item}</p>
                <p className="text-xs text-muted-foreground">Preview mode available</p>
              </div>
              <span className="rounded-full bg-gigaviz-surface px-2 py-1 text-[11px] text-muted-foreground">
                TODO
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Workspace &amp; Team</CardTitle>
            <CardDescription>Team structure overview.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
              <div>
                <p className="font-semibold">{workspace.name}</p>
                <p className="text-xs text-muted-foreground">
                  {memberCount ? `${memberCount} members` : copy.emptyStates.members.helper}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/${workspaceSlug}/settings#members`}>Manage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Roles &amp; Access</CardTitle>
            <CardDescription>Role settings preview.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {["Owner", "Admin", "Member"].map((role) => (
              <div
                key={role}
                className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{role}</p>
                  <p className="text-xs text-muted-foreground">Default access for role {role}</p>
                </div>
                <ActionGate
                  allowed={canAccess(entitlementCtx, "roles_permissions")}
                >
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </ActionGate>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>Sample events (live after audit is enabled).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {demoAuditEvents.map((evt) => (
              <div
                key={`${evt.action}-${evt.at}`}
                className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{evt.action}</p>
                  <p className="text-xs text-muted-foreground">{evt.actor}</p>
                </div>
                <span className="text-xs text-muted-foreground">{evt.at}</span>
              </div>
            ))}
            <UpgradeButton label="View Plans" variant="outline" size="sm" className="w-full" />
          </CardContent>
        </Card>

        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Plan status and upgrade steps.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="font-semibold">{planLabel}</p>
              <p className="text-xs text-muted-foreground">
                {planInfo.status ?? copy.emptyStates.billing.helper}
              </p>
            </div>
            <UpgradeButton label="View Plans" variant="outline" size="sm" className="w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
