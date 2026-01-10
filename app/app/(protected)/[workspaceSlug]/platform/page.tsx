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
  if (!ctx.currentWorkspace) redirect("/app/onboarding");
  const workspace = ctx.currentWorkspace;

  if (workspace.slug !== workspaceSlug) {
    redirect(`/app/${workspace.slug}/platform`);
  }

  await ensureWorkspaceCookie(workspace.id);

  const planInfo = await getWorkspacePlan(workspace.id);
  const isPreview = planInfo.planId === "free_locked";
  const isAdmin = Boolean(ctx.profile?.is_admin);

  const db = supabaseAdmin();
  const { count: memberCount } = await db
    .from("workspace_members")
    .select("user_id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  const overviewCards = [
    {
      title: "Workspace aktif",
      value: workspace.name,
      helper: workspace.slug,
    },
    {
      title: "Anggota",
      value: memberCount ?? 0,
      helper: memberCount ? `${memberCount} anggota terdaftar` : copy.emptyStates.members.helper,
    },
    {
      title: "Peran Anda",
      value: ctx.currentRole ?? "Member",
      helper: "Hak akses mengikuti role.",
    },
    {
      title: "Status billing",
      value: planInfo.plan.name,
      helper: planInfo.status ?? "Plan aktif saat ini",
    },
  ];

  const quickActions = [
    {
      label: "Buat Workspace",
      href: "/app/onboarding",
      entitlement: null,
    },
    {
      label: "Undang Member",
      href: `/app/${workspaceSlug}/settings#members`,
      entitlement: "member_invites" as const,
    },
    {
      label: "Kelola Peran (RBAC)",
      href: `/app/${workspaceSlug}/platform/rbac`,
      entitlement: "roles_permissions" as const,
    },
    {
      label: "Lihat Audit Log",
      href: `/app/${workspaceSlug}/platform/audit`,
      entitlement: "audit_log" as const,
    },
  ];

  const checklist = [
    "Buat workspace pertama",
    "Tambahkan anggota",
    "Atur peran & izin",
    "Aktifkan audit log",
    "Atur billing & paket",
  ];

  const demoAuditEvents = [
    { action: "workspace.created", actor: ctx.user.email ?? "user", at: "baru saja" },
    { action: "member.invited", actor: "ops@gigaviz.com", at: "1h lalu" },
    { action: "role.updated", actor: "admin@gigaviz.com", at: "3h lalu" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Gigaviz Platform — Core OS</h2>
          <p className="text-sm text-muted-foreground">
            Akun, workspace, peran, audit, dan billing dalam satu dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-gigaviz-gold text-gigaviz-gold">
            Plan: {planInfo.plan.name}
          </Badge>
          <UpgradeButton label="Upgrade" variant="outline" size="sm" />
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
          <CardDescription>Aksi umum untuk memulai lebih cepat.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {quickActions.map((action) => {
            const allowed =
              !action.entitlement ||
              canAccess({ plan_id: planInfo.planId, is_admin: isAdmin }, action.entitlement);
            return (
              <ActionGate key={action.label} allowed={allowed}>
                <Link
                  href={action.href}
                  className="flex items-center justify-between rounded-xl border border-border bg-gigaviz-surface px-4 py-3 text-sm font-semibold text-foreground hover:border-gigaviz-gold"
                >
                  <span>{action.label}</span>
                  <span aria-hidden className="text-lg leading-none">→</span>
                </Link>
              </ActionGate>
            );
          })}
        </CardContent>
      </Card>

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Setup Checklist</CardTitle>
          <CardDescription>Lengkapi langkah berikut untuk siap produksi.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {checklist.map((item) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm"
            >
              <div>
                <p className="font-semibold">{item}</p>
                <p className="text-xs text-muted-foreground">Mode preview tersedia</p>
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
            <CardDescription>Ringkasan struktur tim.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
              <div>
                <p className="font-semibold">{workspace.name}</p>
                <p className="text-xs text-muted-foreground">
                  {memberCount ? `${memberCount} anggota` : copy.emptyStates.members.helper}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/app/${workspaceSlug}/settings#members`}>Kelola</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Roles &amp; Access</CardTitle>
            <CardDescription>Preview pengaturan peran.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {["Owner", "Admin", "Member"].map((role) => (
              <div
                key={role}
                className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{role}</p>
                  <p className="text-xs text-muted-foreground">Hak akses default role {role}</p>
                </div>
                <ActionGate
                  allowed={canAccess(
                    { plan_id: planInfo.planId, is_admin: isAdmin },
                    "roles_permissions"
                  )}
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
            <CardDescription>Sample event (akan real setelah audit aktif).</CardDescription>
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
          </CardContent>
        </Card>

        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Status paket dan langkah upgrade.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="font-semibold">{planInfo.plan.name}</p>
              <p className="text-xs text-muted-foreground">
                {planInfo.status ?? copy.emptyStates.billing.helper}
              </p>
            </div>
            <UpgradeButton label="Lihat Paket" variant="outline" size="sm" className="w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


