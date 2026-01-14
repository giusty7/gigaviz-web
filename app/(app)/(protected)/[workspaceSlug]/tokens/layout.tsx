import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import LockedScreen from "@/components/app/LockedScreen";
import { TokensTabs } from "@/components/tokens/tokens-tabs";
import { getAppContext } from "@/lib/app-context";
import { canAccess } from "@/lib/entitlements";
import { getWorkspacePlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

type TokensLayoutProps = {
  children: ReactNode;
  params: Promise<{ workspaceSlug: string }>;
};

export default async function TokensLayout({ children, params }: TokensLayoutProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  if (ctx.currentWorkspace.slug !== workspaceSlug) {
    redirect(`/${ctx.currentWorkspace.slug}/tokens`);
  }

  const planInfo = await getWorkspacePlan(ctx.currentWorkspace.id);
  const isAdmin = Boolean(ctx.profile?.is_admin);
  const allowed = canAccess({ plan_id: planInfo.planId, is_admin: isAdmin }, "tokens_view");
  const baseHref = `/${ctx.currentWorkspace.slug}/tokens`;

  if (!allowed) {
    return (
      <div className="space-y-6">
        <TokensHero name={ctx.currentWorkspace.name} slug={ctx.currentWorkspace.slug} />
        <LockedScreen
          title="Tokens locked"
          description="Upgrade to access tokens, usage guardrails, and wallet top ups."
          workspaceSlug={ctx.currentWorkspace.slug}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TokensHero name={ctx.currentWorkspace.name} slug={ctx.currentWorkspace.slug} />
      <TokensTabs baseHref={baseHref} />
      {children}
    </div>
  );
}

type TokensHeroProps = {
  name: string;
  slug: string;
};

function TokensHero({ name, slug }: TokensHeroProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.12em] text-gigaviz-gold">Billing Stack</p>
          <h1 className="text-2xl font-semibold text-foreground">Tokens</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Monitor token budgets, wallet balance, and ledgers per workspace. Multi-tenant, auditable, and ready for enterprise.
          </p>
        </div>
        <div className="rounded-2xl border border-gigaviz-gold/30 bg-gigaviz-surface/60 px-4 py-3 text-right text-sm shadow-inner">
          <div className="font-semibold text-foreground">{name}</div>
          <div className="text-xs text-muted-foreground">{slug}</div>
        </div>
      </div>
    </div>
  );
}
