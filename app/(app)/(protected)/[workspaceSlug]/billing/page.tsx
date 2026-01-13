import { redirect } from "next/navigation";
import ComparePlans from "@/components/app/ComparePlans";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAppContext } from "@/lib/app-context";
import { getWorkspaceBilling, normalizePlanId } from "@/lib/billing";
import { canAccess, getPlanFeatures, planMeta, type FeatureKey } from "@/lib/entitlements";
import { ensureWorkspaceCookie } from "@/lib/workspaces";
import { getBillingSummary } from "@/lib/billing/summary";
import { BillingSummaryClient } from "@/components/billing/BillingSummaryClient";

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
  const summary = await getBillingSummary(ctx.currentWorkspace.id);
  const planIdNormalized = normalizePlanId(billing.plan?.code ?? billing.subscription?.plan_id);
  const featureUnion = Array.from(
    new Set(planMeta.flatMap((p) => getPlanFeatures(p.plan_id)).concat(getPlanFeatures(planIdNormalized)))
  );
  const featureLabels: Record<FeatureKey, string> = {
    dashboard_home: "Dashboard",
    account_settings: "Account settings",
    plan_comparison_view: "View plan comparison",
    billing_manage: "Manage billing",
    tokens_view: "View tokens",
    helper: "Helper AI",
    office: "Office docs",
    graph: "Graph data",
    tracks: "Tracks",
    meta_hub: "Meta Hub",
    mass_blast: "Mass blast",
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
    canAccess({ plan_id: planIdNormalized, is_admin: ctx.profile?.is_admin }, key);

  return (
    <div className="space-y-6">
      <BillingSummaryClient workspaceSlug={workspaceSlug} initialSummary={summary} />

      {!billing.subscription ? (
        <Alert>
          <AlertTitle>No subscription found</AlertTitle>
          <AlertDescription>
            This workspace has no subscription record. Default: Free (Locked).
          </AlertDescription>
        </Alert>
      ) : null}

      {!billing.plan ? (
        <Alert variant="destructive">
          <AlertTitle>Plan not found</AlertTitle>
          <AlertDescription>
            Plan code {billing.subscription?.plan_id ?? "unknown"} is missing in the plans table. Falling back to
            Free.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Feature access</h2>
        <p className="text-sm text-white/60 mt-1">
          Features available on the current plan. Upgrade to unlock the rest.
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

      <ComparePlans plans={planMeta} activePlanId={planIdNormalized} />
    </div>
  );
}

