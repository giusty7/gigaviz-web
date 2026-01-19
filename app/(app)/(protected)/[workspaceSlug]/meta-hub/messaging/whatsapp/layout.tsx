import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";
import { WhatsappStickyTabs } from "@/components/meta-hub/WhatsappStickyTabs";
import { getAppContext } from "@/lib/app-context";
import { getMetaHubAccess } from "@/lib/meta-hub/access";
import { getWorkspacePlan } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ workspaceSlug: string }>;
};

export default async function WhatsappShellLayout({ children, params }: LayoutProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/meta-hub/messaging/whatsapp`);
  }

  await ensureWorkspaceCookie(workspace.id);

  const planInfo = await getWorkspacePlan(workspace.id);
  const isAdmin = Boolean(ctx.profile?.is_admin) || Boolean(planInfo.devOverride);
  const access = getMetaHubAccess({ planId: planInfo.planId, isAdmin });

  const db = supabaseAdmin();
  const { data: phone } = await db
    .from("wa_phone_numbers")
    .select("phone_number_id")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .maybeSingle();

  const { data: metaToken } = await db
    .from("meta_tokens")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("provider", "meta_whatsapp")
    .maybeSingle();

  const { data: waToken } = await db
    .from("whatsapp_tokens")
    .select("id")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  const hasToken = Boolean(metaToken?.id || waToken?.id);
  const whatsappConfigured = Boolean(phone?.phone_number_id) && hasToken;
  const badgeStatus = !access.metaHub ? "locked" : whatsappConfigured ? "live" : "beta";

  const basePath = `/${workspace.slug}/meta-hub/messaging/whatsapp`;

  return (
    <div className="space-y-4">
      <header className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#0b1221] via-[#0f1c2c] to-[#111827] text-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(255,215,128,0.08),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.06),transparent_32%)]" />
        <div className="relative grid gap-6 p-6 md:grid-cols-[1.6fr_1fr] md:p-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-100/70">Meta Hub</p>
            <h1 className="text-2xl font-semibold leading-tight">WhatsApp Command Center</h1>
            <p className="text-sm text-muted-foreground">
              Manage approved templates, sandbox delivery, and inbox follow-ups without leaving this hub.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <MetaHubBadge status={badgeStatus} />
              <Link
                href={`/${workspace.slug}/meta-hub/connections`}
                className="rounded-lg border border-border bg-background/70 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition hover:border-gigaviz-gold"
              >
                Connection settings
              </Link>
              <Link
                href={`/${workspace.slug}/meta-hub/webhooks`}
                className="rounded-lg border border-border bg-background/70 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition hover:border-gigaviz-gold"
              >
                Webhook events
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-border bg-card/70 p-4 text-sm shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,215,128,0.06),transparent_45%)]" />
            <div className="relative space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Workflow checklist</p>
              <ul className="space-y-1 text-foreground">
                <li className="flex items-center gap-2">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span>Connect phone number and token in Connections.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span>Create or sync approved templates, then send test to whitelist.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span>Process inbox events and reply with approved templates.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <div className="sticky top-4 z-20">
        <WhatsappStickyTabs basePath={basePath} />
      </div>

      <div className="space-y-6">{children}</div>
    </div>
  );
}
