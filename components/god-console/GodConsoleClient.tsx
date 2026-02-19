"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldAlert, Search, Activity, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WorkspaceDrawer from "./WorkspaceDrawer";

export type GodWorkspaceCard = {
  id: string;
  name: string;
  slug: string;
  created_at: string | null;
  status: string;
  plan_code: string;
  subscription_status: string;
  wallet_balance: number;
  usage_tokens: number;
  monthly_cap: number | null;
  hard_cap: boolean;
  entitlements: string[];
  audits: Array<{
    id: string;
    action: string;
    actor_email: string | null;
    actor_role: string | null;
    created_at: string | null;
    meta: Record<string, unknown> | null;
  }>;
  risk: boolean;
};

type Props = {
  workspaces: GodWorkspaceCard[];
  query: string;
  actorEmail: string | null;
  focusWorkspaceId?: string | null;
};

function watermarkStyle() {
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'>
      <text x='20' y='120' font-size='32' font-family='Inter, sans-serif' fill='rgba(212,175,55,0.08)' transform='rotate(-30 120 120)'>INTERNAL ACCESS</text>
    </svg>`
  );
  return {
    backgroundImage: `url("data:image/svg+xml,${svg}")`,
    backgroundRepeat: "repeat",
    backgroundSize: "240px 240px",
    opacity: 0.4,
  } as const;
}

export default function GodConsoleClient({ workspaces, query, actorEmail, focusWorkspaceId }: Props) {
  const t = useTranslations("opsUI");
  const [selected, setSelected] = useState<GodWorkspaceCard | null>(null);
  const [open, setOpen] = useState(false);

  // Auto-open drawer when focusWorkspaceId is provided (e.g. from "Sovereign Command" link)
  useEffect(() => {
    if (focusWorkspaceId && workspaces.length > 0) {
      const match = workspaces.find((ws) => ws.id === focusWorkspaceId);
      if (match) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelected(match);
        setOpen(true);
      }
    }
  }, [focusWorkspaceId, workspaces]);

  const sorted = useMemo(
    () =>
      [...workspaces].sort((a, b) => {
        const riskScore = Number(b.risk) - Number(a.risk);
        if (riskScore !== 0) return riskScore;
        return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      }),
    [workspaces]
  );

  const handleSelect = (ws: GodWorkspaceCard) => {
    setSelected(ws);
    setOpen(true);
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="batik-overlay opacity-100" />
        <div className="absolute inset-0" style={watermarkStyle()} />
      </div>

      <div className="relative space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">{t("godConsole.title")}</p>
            <h1 className="text-3xl font-semibold text-foreground">{t("godConsole.subtitle")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("godConsole.description")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-[#d4af37]/60 bg-[#d4af37]/10 text-[#f5f5dc]">
              <ShieldCheck className="mr-1 h-4 w-4" />
              {t("godConsole.adminOnly")}
            </Badge>
            {actorEmail ? (
              <Badge variant="secondary" className="bg-[#050a18]/70 text-[#f5f5dc]">
                {actorEmail}
              </Badge>
            ) : null}
          </div>
        </header>

        <section className="rounded-2xl border border-[#d4af37]/30 bg-[#050a18]/80 p-4 backdrop-blur-3xl shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)]">
          <form method="get" className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d4af37]" />
              <Input
                name="q"
                defaultValue={query}
                placeholder="Search workspace by slug or name"
                className="w-full rounded-xl border-[#d4af37]/30 bg-[#0a1229]/80 pl-10 text-[#f5f5dc] placeholder:text-[#f5f5dc]/40 focus:border-[#d4af37] focus:ring-[#d4af37]"
              />
            </div>
            <Button
              type="submit"
              className="w-full md:w-auto rounded-xl border border-[#d4af37]/50 bg-[#d4af37]/90 text-[#050a18] shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:shadow-[0_0_30px_rgba(212,175,55,0.55)]"
            >
              {t("godConsole.scanUniverse")}
            </Button>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t("godConsole.results")} {sorted.length}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-emerald-200">
                <ShieldCheck className="h-3 w-3" /> {t("godConsole.healthy")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#d946ef]/40 bg-[#d946ef]/10 px-2 py-1 text-[#f0abfc]">
                <ShieldAlert className="h-3 w-3" /> {t("godConsole.risk")}
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sorted.map((ws) => {
              const capLabel =
                ws.monthly_cap && ws.monthly_cap > 0
                  ? `${ws.usage_tokens.toLocaleString()} / ${ws.monthly_cap.toLocaleString()}`
                  : `${ws.usage_tokens.toLocaleString()} used`;
              return (
                <button
                  key={ws.id}
                  onClick={() => handleSelect(ws)}
                  className="group relative overflow-hidden rounded-2xl border border-[#d4af37]/40 bg-[#050a18]/80 p-4 text-left shadow-[0_20px_60px_-45px_rgba(0,0,0,0.8)] transition hover:-translate-y-1 hover:border-[#d4af37]/70 hover:shadow-[0_25px_80px_-50px_rgba(212,175,55,0.45)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/6 via-transparent to-[#d946ef]/10 opacity-0 transition group-hover:opacity-100" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.14em] text-[#f5f5dc]/60">
                        /{ws.slug}
                      </p>
                      <h3 className="text-lg font-semibold text-[#f5f5dc]">{ws.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Plan: {ws.plan_code} • Sub: {ws.subscription_status}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${
                        ws.risk
                          ? "border-[#d946ef]/50 bg-[#d946ef]/10 text-[#f0abfc]"
                          : "border-emerald-400/50 bg-emerald-400/10 text-emerald-200"
                      }`}
                    >
                      {ws.status}
                    </Badge>
                  </div>

                  <div className="relative mt-4 grid grid-cols-2 gap-3 text-sm text-[#f5f5dc]">
                    <div className="rounded-xl border border-[#d4af37]/30 bg-[#0a1229]/70 p-3">
                      <div className="flex items-center gap-2 text-xs text-[#f5f5dc]/70">
                        <Coins className="h-4 w-4 text-[#d4af37]" /> {t("godConsole.wallet")}
                      </div>
                      <p className="mt-1 text-lg font-semibold">
                        {ws.wallet_balance.toLocaleString()} tokens
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#d4af37]/30 bg-[#0a1229]/70 p-3">
                      <div className="flex items-center gap-2 text-xs text-[#f5f5dc]/70">
                        <Activity className="h-4 w-4 text-[#d946ef]" /> {t("godConsole.usage")}
                      </div>
                      <p className="mt-1 text-lg font-semibold">{capLabel}</p>
                      {ws.hard_cap ? (
                        <p className="text-[11px] text-[#f5f5dc]/60">{t("godConsole.hardCapEnforced")}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="relative mt-3 flex flex-wrap gap-2">
                    {(ws.entitlements ?? []).slice(0, 6).map((key) => (
                      <span
                        key={key}
                        className="rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1 text-[11px] uppercase tracking-wide text-[#f5f5dc]/80"
                      >
                        {key}
                      </span>
                    ))}
                    {ws.entitlements.length > 6 ? (
                      <span className="text-[11px] text-[#f5f5dc]/60">
                        {t("godConsole.moreWorkspaces", { count: ws.entitlements.length - 6 })}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          {sorted.length === 0 ? (
            <div className="rounded-2xl border border-[#d4af37]/30 bg-[#050a18]/70 p-6 text-sm text-muted-foreground">
              {t("godConsole.noWorkspacesFound")}
            </div>
          ) : null}
        </section>
      </div>

      <WorkspaceDrawer open={open} workspace={selected} onClose={() => setOpen(false)} />
    </div>
  );
}
