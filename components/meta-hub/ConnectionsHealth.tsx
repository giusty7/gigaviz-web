"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClipboardCopyIcon,
  ExternalLinkIcon,
  Loader2Icon,
  RefreshCwIcon,
  XCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type CheckResult = {
  ok: boolean;
  reason?: string;
  wabaId?: string;
  phoneNumberId?: string;
  count?: number;
  lastEventAt?: string | null;
  events24h?: number;
  lastSyncedAt?: string | null;
};

type VerifyResponse = {
  ok: boolean;
  checks: {
    token: CheckResult;
    connection: CheckResult;
    templates: CheckResult;
    webhooks: CheckResult;
  };
  recommendations: string[];
};

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  initialConnection?: {
    phoneNumberId: string | null;
    wabaId: string | null;
    displayName: string | null;
    status: string | null;
  } | null;
  tokenSet: boolean;
  canEdit: boolean;
};

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function getRelativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function StatusIcon({ ok, loading }: { ok: boolean; loading?: boolean }) {
  if (loading) return <Loader2Icon className="h-5 w-5 text-muted-foreground animate-spin" />;
  if (ok) return <CheckCircleIcon className="h-5 w-5 text-emerald-400" />;
  return <XCircleIcon className="h-5 w-5 text-red-400" />;
}

function StatusBadge({ status }: { status: "live" | "beta" | "soon" | "error" }) {
  const styles = {
    live: "border-emerald-400/50 bg-emerald-400/15 text-emerald-100",
    beta: "border-amber-300/50 bg-amber-300/15 text-amber-100",
    soon: "border-border bg-gigaviz-surface text-muted-foreground",
    error: "border-red-400/50 bg-red-400/15 text-red-100",
  };
  const labels = { live: "LIVE", beta: "BETA", soon: "SOON", error: "ERROR" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const { toast } = useToast();
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast({ title: label ? `${label} copied` : "Copied to clipboard" });
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded hover:bg-gigaviz-surface/70 text-muted-foreground hover:text-foreground transition-colors"
      title={`Copy ${label ?? "ID"}`}
    >
      <ClipboardCopyIcon className="h-3.5 w-3.5" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export function ConnectionsHealth({
  workspaceId,
  workspaceSlug,
  initialConnection,
  tokenSet,
  canEdit,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
  const [checklistOpen, setChecklistOpen] = useState(true);

  const handleVerify = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meta/whatsapp/verify?workspaceId=${workspaceId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setVerifyResult(data);

      if (data.ok) {
        toast({ title: "All checks passed!", description: "Your WhatsApp connection is healthy." });
      } else {
        const failCount = Object.values(data.checks).filter((c) => !(c as CheckResult).ok).length;
        toast({
          title: `${failCount} issue${failCount > 1 ? "s" : ""} found`,
          description: "Review the health panel for details.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Verification failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, toast]);

  const checks = verifyResult?.checks;
  const hasConnection = Boolean(initialConnection?.phoneNumberId);
  const overallStatus = !hasConnection || !tokenSet ? "error" : verifyResult?.ok ? "live" : "beta";

  // Setup checklist items
  const checklist = [
    {
      label: "Add token + phone number",
      done: Boolean(initialConnection?.phoneNumberId && tokenSet),
      href: null, // stays on this page
      description: "Configure your WhatsApp Phone Number ID and Access Token.",
    },
    {
      label: "Verify webhook",
      done: checks?.webhooks?.ok ?? false,
      href: `/${workspaceSlug}/meta-hub/messaging/whatsapp/webhooks`,
      description: "Ensure Meta is sending webhook events to this workspace.",
    },
    {
      label: "Sync templates",
      done: checks?.templates?.ok ?? false,
      href: `/${workspaceSlug}/meta-hub/messaging/whatsapp`,
      description: "Import your approved WhatsApp message templates.",
    },
    {
      label: "Process events",
      done: (checks?.webhooks?.events24h ?? 0) > 0,
      href: `/${workspaceSlug}/meta-hub/webhooks`,
      description: "Start receiving and processing WhatsApp messages.",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Health Overview Card */}
      <Card className="border-gigaviz-border bg-gigaviz-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">Connection Health</CardTitle>
              <StatusBadge status={overallStatus} />
            </div>
            <Button
              onClick={handleVerify}
              disabled={loading}
              size="sm"
              className="gap-2"
            >
              {loading ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCwIcon className="h-4 w-4" />
              )}
              Verify now
            </Button>
          </div>
          <CardDescription>
            Check the status of your WhatsApp Business API connection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection IDs display */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-gigaviz-border bg-gigaviz-surface/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Phone Number ID</p>
              <div className="flex items-center">
                <span className="text-sm font-mono">
                  {initialConnection?.phoneNumberId || "Not configured"}
                </span>
                {initialConnection?.phoneNumberId && (
                  <CopyButton text={initialConnection.phoneNumberId} label="Phone Number ID" />
                )}
              </div>
            </div>
            <div className="rounded-lg border border-gigaviz-border bg-gigaviz-surface/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">WABA ID</p>
              <div className="flex items-center">
                <span className="text-sm font-mono">
                  {initialConnection?.wabaId || "Not configured"}
                </span>
                {initialConnection?.wabaId && (
                  <CopyButton text={initialConnection.wabaId} label="WABA ID" />
                )}
              </div>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn(
                "px-3 py-1 text-xs",
                tokenSet
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                  : "border-red-500/50 bg-red-500/10 text-red-200"
              )}
            >
              Token: {tokenSet ? "Present" : "Missing"}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "px-3 py-1 text-xs",
                hasConnection
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                  : "border-red-500/50 bg-red-500/10 text-red-200"
              )}
            >
              Connection: {hasConnection ? "Active" : "Not configured"}
            </Badge>
            {checks?.webhooks && (
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1 text-xs",
                  checks.webhooks.ok
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                    : "border-amber-500/50 bg-amber-500/10 text-amber-200"
                )}
              >
                Events 24h: {checks.webhooks.events24h ?? 0}
              </Badge>
            )}
            {checks?.templates && (
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1 text-xs",
                  checks.templates.ok
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                    : "border-amber-500/50 bg-amber-500/10 text-amber-200"
                )}
              >
                Templates: {checks.templates.count ?? 0}
              </Badge>
            )}
          </div>

          {/* Health check results */}
          {verifyResult && (
            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium text-muted-foreground">Health Checks</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {/* Token check */}
                <div className="flex items-start gap-3 rounded-lg border border-gigaviz-border bg-gigaviz-surface/30 p-3">
                  <StatusIcon ok={checks?.token.ok ?? false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Access Token</p>
                    <p className="text-xs text-muted-foreground">
                      {checks?.token.ok ? "Token configured and valid" : checks?.token.reason}
                    </p>
                  </div>
                  {!checks?.token.ok && canEdit && (
                    <Button variant="ghost" size="sm" className="text-xs shrink-0" asChild>
                      <span>Fix it ↓</span>
                    </Button>
                  )}
                </div>

                {/* Connection check */}
                <div className="flex items-start gap-3 rounded-lg border border-gigaviz-border bg-gigaviz-surface/30 p-3">
                  <StatusIcon ok={checks?.connection.ok ?? false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Phone Number</p>
                    <p className="text-xs text-muted-foreground">
                      {checks?.connection.ok
                        ? `Connected: ${checks.connection.phoneNumberId}`
                        : checks?.connection.reason}
                    </p>
                  </div>
                  {!checks?.connection.ok && canEdit && (
                    <Button variant="ghost" size="sm" className="text-xs shrink-0" asChild>
                      <span>Fix it ↓</span>
                    </Button>
                  )}
                </div>

                {/* Templates check */}
                <div className="flex items-start gap-3 rounded-lg border border-gigaviz-border bg-gigaviz-surface/30 p-3">
                  <StatusIcon ok={checks?.templates.ok ?? false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Templates</p>
                    <p className="text-xs text-muted-foreground">
                      {checks?.templates.ok
                        ? `${checks.templates.count} template${(checks.templates.count ?? 0) !== 1 ? "s" : ""} synced`
                        : checks?.templates.reason}
                    </p>
                    {checks?.templates.lastSyncedAt && (
                      <p className="text-xs text-muted-foreground">
                        Last sync: {getRelativeTime(checks.templates.lastSyncedAt)}
                      </p>
                    )}
                  </div>
                  {!checks?.templates.ok && (
                    <Link href={`/${workspaceSlug}/meta-hub/messaging/whatsapp`}>
                      <Button variant="ghost" size="sm" className="text-xs shrink-0 gap-1">
                        Sync <ExternalLinkIcon className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Webhooks check */}
                <div className="flex items-start gap-3 rounded-lg border border-gigaviz-border bg-gigaviz-surface/30 p-3">
                  <StatusIcon ok={checks?.webhooks.ok ?? false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Webhooks</p>
                    <p className="text-xs text-muted-foreground">
                      {checks?.webhooks.ok
                        ? `${checks.webhooks.events24h} event${(checks.webhooks.events24h ?? 0) !== 1 ? "s" : ""} in 24h`
                        : checks?.webhooks.reason}
                    </p>
                    {checks?.webhooks.lastEventAt && (
                      <p className="text-xs text-muted-foreground">
                        Last event: {getRelativeTime(checks.webhooks.lastEventAt)}
                      </p>
                    )}
                  </div>
                  <Link href={`/${workspaceSlug}/meta-hub/messaging/whatsapp/webhooks`}>
                    <Button variant="ghost" size="sm" className="text-xs shrink-0 gap-1">
                      View <ExternalLinkIcon className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {verifyResult && verifyResult.recommendations.length > 0 && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
              <div className="flex items-start gap-2">
                <AlertCircleIcon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-100">Recommendations</p>
                  <ul className="mt-1 space-y-1">
                    {verifyResult.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-amber-200/90">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Checklist */}
      <Collapsible open={checklistOpen} onOpenChange={setChecklistOpen}>
        <Card className="border-gigaviz-border bg-gigaviz-card/50">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer pb-3 hover:bg-gigaviz-surface/30 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Setup Checklist</CardTitle>
                  <CardDescription>Complete these steps to fully configure WhatsApp.</CardDescription>
                </div>
                <ChevronRightIcon
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    checklistOpen && "rotate-90"
                  )}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                      item.done
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-gigaviz-border bg-gigaviz-surface/30"
                    )}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gigaviz-border bg-gigaviz-bg text-xs font-semibold">
                      {item.done ? (
                        <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium", item.done && "text-muted-foreground")}>
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    {item.href && !item.done && (
                      <Link href={item.href}>
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          Go <ExternalLinkIcon className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href={`/${workspaceSlug}/meta-hub/messaging/whatsapp/webhooks`}>
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLinkIcon className="h-4 w-4" />
            Open Webhooks
          </Button>
        </Link>
        <Link href={`/${workspaceSlug}/meta-hub/messaging/whatsapp`}>
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLinkIcon className="h-4 w-4" />
            Sync Templates
          </Button>
        </Link>
        <Link href={`/${workspaceSlug}/meta-hub`}>
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLinkIcon className="h-4 w-4" />
            Meta Hub Overview
          </Button>
        </Link>
      </div>
    </div>
  );
}
