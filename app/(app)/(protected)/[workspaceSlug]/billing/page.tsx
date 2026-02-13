import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ComparePlans from "@/components/app/ComparePlans";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAppContext } from "@/lib/app-context";
import { getWorkspaceBilling, normalizePlanId } from "@/lib/billing";
import { canAccess, getPlanFeatures, planMeta, type FeatureKey } from "@/lib/entitlements";
import { ensureWorkspaceCookie } from "@/lib/workspaces";
import { getBillingSummary } from "@/lib/billing/summary";
import { BillingSummaryClient } from "@/components/billing/BillingSummaryClient";
import { TokenTopupClient } from "@/components/billing/TokenTopupClient";

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

  const t = await getTranslations("billing");
  const billing = await getWorkspaceBilling(ctx.currentWorkspace.id);
  const summary = await getBillingSummary(ctx.currentWorkspace.id);
  const userEmail = ctx.user.email ?? "";
  const canEdit = ctx.currentRole === "owner" || ctx.currentRole === "admin";
  const midtransEnabled = process.env.NEXT_PUBLIC_MIDTRANS_ENABLED === "1";
  const planIdNormalized = normalizePlanId(billing.plan?.code ?? billing.subscription?.plan_id);
  const featureUnion = Array.from(
    new Set(planMeta.flatMap((p) => getPlanFeatures(p.plan_id)).concat(getPlanFeatures(planIdNormalized)))
  );
  const featureLabels: Record<FeatureKey, string> = {
    // Base features
    dashboard_home: "Dashboard",
    account_settings: "Account settings",
    plan_comparison_view: "View plan comparison",
    billing_manage: "Manage billing",
    tokens_view: "View tokens",
    // 10 Hubs
    core_os: "Core OS",
    meta_hub: "Meta Hub",
    studio: "Studio",
    helper: "Helper AI",
    office: "Office docs",
    marketplace: "Marketplace",
    arena: "Arena",
    pay: "Pay",
    trade: "Trade",
    community: "Community",
    // Legacy/capabilities
    graph: "Graph data",
    tracks: "Tracks",
    inbox: "Inbox",
    automation: "Automation",
    studio_graph: "Studio graph",
    mass_blast: "Mass blast",
    wa_blast: "WA blast",
    analytics: "Analytics",
    member_invites: "Invite members",
    roles_permissions: "Roles & permissions",
    audit_log: "Audit log",
    meta_connect: "Meta connect",
    meta_send: "Send Meta messages",
    meta_templates: "Meta templates",
    meta_webhooks: "Meta webhooks",
  };
  const available = (key: FeatureKey) =>
    canAccess(
      {
        plan_id: planIdNormalized,
        is_admin: ctx.profile?.is_admin,
        effectiveEntitlements: ctx.effectiveEntitlements,
      },
      key
    );

  return (
    <div className="space-y-6">
      <BillingSummaryClient workspaceId={ctx.currentWorkspace.id} workspaceSlug={workspaceSlug} initialSummary={summary} midtransEnabled={midtransEnabled} />

      <TokenTopupClient
        workspaceId={ctx.currentWorkspace.id}
        initialSummary={summary}
        canEdit={canEdit}
        midtransEnabled={midtransEnabled}
      />

      {!billing.subscription ? (
        <Alert>
          <AlertTitle>{t("noSubscription")}</AlertTitle>
          <AlertDescription>
            {t("noSubscriptionDesc")}
          </AlertDescription>
        </Alert>
      ) : null}

      {!billing.plan ? (
        <Alert variant="destructive">
          <AlertTitle>{t("planNotFound")}</AlertTitle>
          <AlertDescription>
            {t("planNotFoundDesc", { code: billing.subscription?.plan_id ?? "unknown" })}
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-6">
        <div className="absolute inset-0 batik-pattern opacity-[0.04]" />
        <div className="relative">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] bg-clip-text text-transparent">{t("featureAccess")}</h2>
          <p className="text-sm text-[#f5f5dc]/60 mt-1">
            {t("featureAccessDesc")}
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {featureUnion.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-[#d4af37]/20 bg-[#050a18]/60 px-3 py-2 text-sm transition-all hover:border-[#d4af37]/40"
              >
                <span className="text-[#f5f5dc]/80">{featureLabels[key] ?? key}</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    available(key) ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-[#f5f5dc]/5 text-[#f5f5dc]/40 border border-[#f5f5dc]/10"
                  }`}
                >
                  {available(key) ? t("available") : t("locked")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ComparePlans
        plans={planMeta}
        activePlanId={planIdNormalized}
        workspaceId={ctx.currentWorkspace.id}
        workspaceSlug={ctx.currentWorkspace.slug}
        workspaceName={ctx.currentWorkspace.name}
        userEmail={userEmail}
      />
    </div>
  );
}
