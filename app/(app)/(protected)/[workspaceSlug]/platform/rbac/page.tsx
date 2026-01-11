import { redirect } from "next/navigation";
import { ActionGate } from "@/components/gates/action-gate";
import PreviewBanner from "@/components/modules/preview-banner";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import { getAppContext } from "@/lib/app-context";
import { canAccess } from "@/lib/entitlements";
import { getWorkspacePlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

type RBACPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function RBACPage({ params }: RBACPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const planInfo = await getWorkspacePlan(ctx.currentWorkspace.id);
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const isDevOverride = Boolean(planInfo.devOverride);
  const isPreview = planInfo.planId === "free_locked" && !isDevOverride;
  const entitlementCtx = { plan_id: planInfo.planId, is_admin: isAdmin || isDevOverride };
  const allowRoles = canAccess(entitlementCtx, "roles_permissions");
  const showUpgrade = !isDevOverride;

  const roles = [
    { name: "Owner", desc: "Kontrol penuh, billing, dan audit." },
    { name: "Admin", desc: "Kelola anggota, konfigurasi, webhook." },
    { name: "Member", desc: "Akses modul sesuai izin." },
    { name: "Viewer", desc: "Akses baca saja untuk laporan." },
  ];

  return (
    <div className="space-y-4">
      {isPreview && <PreviewBanner />}

      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Roles &amp; Access</CardTitle>
          <CardDescription>
            Atur role dan izin per modul. Mode preview menampilkan struktur default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {roles.map((role) => (
            <div
              key={role.name}
              className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gigaviz-surface text-xs text-gigaviz-gold"
                >
                  ⚙
                </span>
                <div>
                  <p className="font-semibold">{role.name}</p>
                  <p className="text-xs text-muted-foreground">{role.desc}</p>
                </div>
              </div>
              <ActionGate allowed={allowRoles}>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </ActionGate>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <ActionGate allowed={allowRoles}>
              <Button size="sm">
                <span aria-hidden className="mr-2 text-sm">
                  +
                </span>
                Tambah role
              </Button>
            </ActionGate>
            {showUpgrade && <UpgradeButton label="Upgrade" variant="ghost" size="sm" />}
          </div>

          <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
            <p className="font-semibold">{copy.emptyStates.roles.title}</p>
            <p className="text-muted-foreground">{copy.emptyStates.roles.helper}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
