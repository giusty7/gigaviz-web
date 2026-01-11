import Link from "next/link";
import { redirect } from "next/navigation";
import ComparePlans from "@/components/app/ComparePlans";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getAppContext } from "@/lib/app-context";
import { getWorkspaceBilling, normalizePlanId } from "@/lib/billing";
import { canAccess, getPlanFeatures, getPlanMeta, planMeta, type FeatureKey } from "@/lib/entitlements";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  if (ctx.currentWorkspace.slug !== workspaceSlug) {
    redirect(`/${ctx.currentWorkspace.slug}/billing`);
  }

  await ensureWorkspaceCookie(ctx.currentWorkspace.id);

  const billing = await getWorkspaceBilling(ctx.currentWorkspace.id);
  const planIdNormalized = normalizePlanId(billing.plan?.code ?? billing.subscription?.plan_id);
  const planMetaCurrent = getPlanMeta(planIdNormalized);
  const featureUnion = Array.from(
    new Set(planMeta.flatMap((p) => getPlanFeatures(p.plan_id)).concat(getPlanFeatures(planIdNormalized)))
  );
  const featureLabels: Record<FeatureKey, string> = {
    dashboard_home: "Dashboard",
    account_settings: "Pengaturan akun",
    plan_comparison_view: "Lihat perbandingan plan",
    billing_manage: "Kelola billing",
    tokens_view: "Lihat token",
    helper: "Helper AI",
    office: "Office docs",
    graph: "Graph data",
    tracks: "Tracks",
    meta_hub: "Meta Hub",
    mass_blast: "Mass blast",
    analytics: "Analytics",
    member_invites: "Undang member",
    roles_permissions: "Role & permission",
    audit_log: "Audit log",
    meta_connect: "Meta connect",
    meta_send: "Kirim pesan Meta",
    meta_templates: "Template Meta",
    meta_webhooks: "Webhook Meta",
  };
  const available = (key: FeatureKey) =>
    canAccess({ plan_id: planIdNormalized, is_admin: ctx.profile?.is_admin }, key);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50">Plan aktif</p>
              <h1 className="text-2xl font-semibold text-white">
                {billing.plan?.name ?? planMetaCurrent.name}
              </h1>
              <p className="text-sm text-white/60">
                Kode: {billing.subscription?.plan_id ?? "free_locked"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">Status</p>
              <p className="text-sm font-semibold text-white">{billing.statusLabel}</p>
            </div>
          </div>
          <div className="text-sm text-white/60">{billing.periodLabel}</div>
          {billing.subscription?.seat_limit ? (
            <div className="text-sm text-white/60">Seat limit: {billing.subscription.seat_limit}</div>
          ) : null}
          <div className="pt-3">
            <Button asChild variant="secondary">
              <Link href="mailto:sales@gigaviz.com">Upgrade (coming soon)</Link>
            </Button>
          </div>
        </div>
      </section>

      {!billing.subscription ? (
        <Alert>
          <AlertTitle>Subscription belum terdaftar</AlertTitle>
          <AlertDescription>
            Workspace ini belum punya baris subscription. Default: Free (Locked).
          </AlertDescription>
        </Alert>
      ) : null}

      {!billing.plan ? (
        <Alert variant="destructive">
          <AlertTitle>Plan tidak ditemukan</AlertTitle>
          <AlertDescription>
            Kode plan {billing.subscription?.plan_id ?? "unknown"} belum ada di tabel plans. Menggunakan
            fallback Free.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Akses fitur</h2>
        <p className="text-sm text-white/60 mt-1">
          Fitur yang tersedia untuk plan saat ini. Upgrade untuk membuka fitur terkunci.
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {featureUnion.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
            >
              <span className="text-white/80">{featureLabels[key] ?? key}</span>
              <span
                className={`text-xs font-semibold ${
                  available(key) ? "text-emerald-300" : "text-white/40"
                }`}
              >
                {available(key) ? "Available" : "Locked"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Upgrade</h2>
            <p className="text-sm text-white/60">Upgrade via sales. Pembayaran belum diaktifkan.</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="mailto:sales@gigaviz.com">Contact sales / Upgrade</Link>
          </Button>
        </div>
      </section>

      <ComparePlans plans={planMeta} activePlanId={planIdNormalized} />
    </div>
  );
}

