"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, ShieldCheck, ShieldOff, Loader2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  grantWorkspaceTokensAction,
  setWorkspaceEntitlementAction,
} from "@/app/ops/actions";
import { ENTITLEMENT_KEYS } from "@/lib/entitlements/payload-spec";
import type { GodWorkspaceCard } from "./GodConsoleClient";

type Props = {
  open: boolean;
  workspace: GodWorkspaceCard | null;
  onClose: () => void;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function WorkspaceDrawer({ open, workspace, onClose }: Props) {
  const { toast } = useToast();
  const [entitlements, setEntitlements] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [refId, setRefId] = useState("");
  const [grantPending, startGrant] = useTransition();
  const [entPending, startEnt] = useTransition();

  useEffect(() => {
    // Reset state when workspace changes; safe because effect depends on workspace
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntitlements(new Set(workspace?.entitlements ?? []));
    setAmount("");
    setReason("");
    setRefId("");
  }, [workspace]);

  const previewBalance = useMemo(() => {
    const base = workspace?.wallet_balance ?? 0;
    const delta = Number(amount);
    if (!Number.isFinite(delta)) return base;
    return base + delta;
  }, [amount, workspace?.wallet_balance]);

  const handleGrant = () => {
    if (!workspace) return;
    const formData = new FormData();
    formData.set("workspaceId", workspace.id);
    formData.set("amount", amount);
    formData.set("reason", reason);
    if (refId.trim()) formData.set("ref_id", refId.trim());

    startGrant(async () => {
      const result = await grantWorkspaceTokensAction(formData);
      if (result.ok) {
        toast({ title: "Tokens granted", description: "Balance updated via manual reward." });
        setAmount("");
        setReason("");
        setRefId("");
      } else {
        toast({
          title: "Reward failed",
          description: result.error ?? "Unable to apply reward.",
          variant: "destructive",
        });
      }
    });
  };

  const handleToggleEntitlement = (key: string, enabled: boolean) => {
    if (!workspace) return;
    const formData = new FormData();
    formData.set("workspaceId", workspace.id);
    formData.set("key", key);
    formData.set("enabled", enabled ? "true" : "false");
    formData.set("payload", "{}");

    startEnt(async () => {
      const result = await setWorkspaceEntitlementAction(formData);
      if (result.ok) {
        setEntitlements((prev) => {
          const next = new Set(prev);
          if (enabled) next.add(key);
          else next.delete(key);
          return next;
        });
        toast({ title: enabled ? "Feature unlocked" : "Feature locked", description: key });
      } else {
        toast({
          title: "Override failed",
          description: result.error ?? "Unable to update entitlement.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <AnimatePresence>
      {open && workspace ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-[#d4af37]/30 bg-[#050a18]/95 backdrop-blur-3xl shadow-[0_0_40px_rgba(0,0,0,0.55)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <div className="relative flex items-start justify-between p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#d4af37]">Workspace</p>
                <h2 className="text-2xl font-semibold text-[#f5f5dc]">{workspace.name}</h2>
                <p className="text-sm text-muted-foreground">/{workspace.slug}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full border border-[#d4af37]/40 bg-[#0a1229]/70 text-[#f5f5dc]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="px-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                >
                  <ShieldCheck className="mr-1 h-4 w-4" />
                  {workspace.plan_code}
                </Badge>
                <Badge
                  variant="outline"
                  className={`${
                    workspace.risk
                      ? "border-[#d946ef]/40 bg-[#d946ef]/10 text-[#f0abfc]"
                      : "border-[#d4af37]/40 bg-[#d4af37]/10 text-[#f5f5dc]"
                  }`}
                >
                  {workspace.subscription_status}
                </Badge>
                <Badge variant="secondary" className="bg-[#0a1229]/80 text-[#f5f5dc]">
                  Status: {workspace.status}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#f5f5dc]">
                <div className="rounded-xl border border-[#d4af37]/30 bg-[#0a1229]/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-[#f5f5dc]/60">Wallet</p>
                  <p className="mt-1 text-xl font-semibold">
                    {workspace.wallet_balance.toLocaleString()} tokens
                  </p>
                </div>
                <div className="rounded-xl border border-[#d4af37]/30 bg-[#0a1229]/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-[#f5f5dc]/60">Usage</p>
                  <p className="mt-1 text-xl font-semibold">
                    {workspace.usage_tokens.toLocaleString()}
                    {workspace.monthly_cap ? ` / ${workspace.monthly_cap.toLocaleString()}` : ""}
                  </p>
                  {workspace.hard_cap ? (
                    <p className="text-[11px] text-[#f5f5dc]/60">Hard cap enforced</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-5 flex-1 space-y-4 overflow-y-auto px-5 pb-8">
              <section className="rounded-2xl border border-[#d4af37]/40 bg-[#050a18]/80 p-4 shadow-inner">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#d4af37]">
                      Manual Reward
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Apply token delta via platform authority.
                    </p>
                  </div>
                  <Sparkles className="h-5 w-5 text-[#d4af37]" />
                </div>
                <div className="mt-3 grid gap-3">
                  <Input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount"
                    className="rounded-xl border-[#d4af37]/30 bg-[#0a1229]/80 text-[#f5f5dc] placeholder:text-[#f5f5dc]/50 focus:border-[#d4af37]"
                  />
                  <Textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason (required)"
                    className="rounded-xl border-[#d4af37]/30 bg-[#0a1229]/80 text-[#f5f5dc] placeholder:text-[#f5f5dc]/50 focus:border-[#d4af37]"
                  />
                  <Input
                    value={refId}
                    onChange={(e) => setRefId(e.target.value)}
                    placeholder="Reference ID (optional)"
                    className="rounded-xl border-[#d4af37]/30 bg-[#0a1229]/80 text-[#f5f5dc] placeholder:text-[#f5f5dc]/50 focus:border-[#d4af37]"
                  />
                  <div className="flex items-center justify-between text-xs text-[#f5f5dc]/70">
                    <span>Preview new balance</span>
                    <span className="font-semibold text-[#d4af37]">
                      {previewBalance.toLocaleString()} tokens
                    </span>
                  </div>
                  <Button
                    disabled={grantPending || !amount || !reason}
                    onClick={handleGrant}
                    className="rounded-xl border border-[#d4af37]/60 bg-[#d4af37]/90 text-[#050a18] shadow-[0_0_25px_rgba(212,175,55,0.45)] hover:shadow-[0_0_35px_rgba(212,175,55,0.65)]"
                  >
                    {grantPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Inject Tokens
                  </Button>
                </div>
              </section>

              <section className="rounded-2xl border border-[#d4af37]/40 bg-[#050a18]/80 p-4 shadow-inner">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#d4af37]">
                      Manual Overrides
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Force unlock or lock modules per workspace.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={entPending}
                      onClick={() => {
                        ENTITLEMENT_KEYS.forEach((key) => {
                          if (!entitlements.has(key)) {
                            handleToggleEntitlement(key, true);
                          }
                        });
                      }}
                      className="h-7 rounded-lg border-emerald-400/40 bg-emerald-500/10 text-emerald-200 text-xs hover:bg-emerald-500/20"
                    >
                      Unlock All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={entPending}
                      onClick={() => {
                        ENTITLEMENT_KEYS.forEach((key) => {
                          if (entitlements.has(key)) {
                            handleToggleEntitlement(key, false);
                          }
                        });
                      }}
                      className="h-7 rounded-lg border-red-400/40 bg-red-500/10 text-red-200 text-xs hover:bg-red-500/20"
                    >
                      Lock All
                    </Button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {ENTITLEMENT_KEYS.map((key) => {
                    const enabled = entitlements.has(key);
                    return (
                      <div
                        key={key}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-all ${
                          enabled
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                            : "border-[#d4af37]/25 bg-[#0a1229]/70 text-[#f5f5dc]/60"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {enabled ? (
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <ShieldOff className="h-4 w-4 text-[#f5f5dc]/30" />
                          )}
                          <span className="uppercase tracking-wide text-xs font-medium">{key.replace(/_/g, " ")}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={entPending}
                          onClick={() => handleToggleEntitlement(key, !enabled)}
                          className={`h-7 rounded-lg px-3 ${
                            enabled
                              ? "text-red-300 hover:bg-red-500/20 hover:text-red-200"
                              : "text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200"
                          }`}
                        >
                          {entPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : enabled ? (
                            "Lock"
                          ) : (
                            "Unlock"
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-[#d4af37]/40 bg-[#050a18]/80 p-4 shadow-inner">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-[#d4af37]" />
                  <p className="text-xs uppercase tracking-[0.16em] text-[#d4af37]">
                    Audit Trail
                  </p>
                </div>
                <div className="mt-3 space-y-3">
                  {workspace.audits.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent activity.</p>
                  ) : (
                    workspace.audits.map((row) => (
                      <div
                        key={row.id}
                        className="rounded-lg border border-[#d4af37]/25 bg-[#0a1229]/70 p-3 text-sm text-[#f5f5dc]"
                      >
                        <div className="flex items-center justify-between text-xs text-[#f5f5dc]/80">
                          <span>{row.action}</span>
                          <span>{formatDate(row.created_at)}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {row.actor_email ?? "unknown"} {row.actor_role ? `· ${row.actor_role}` : ""}
                        </div>
                        {row.meta ? (
                          <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-black/30 p-2 text-[11px] text-[#f5f5dc]/80">
                            {JSON.stringify(row.meta, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
