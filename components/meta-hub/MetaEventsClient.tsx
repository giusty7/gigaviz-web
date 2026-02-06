"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Database,
  ExternalLink,
  Loader2,
  Radio,
  RefreshCw,
  Send,
  Shield,
  ShieldCheck,
  Unplug,
  XCircle,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const EVENT_OPTIONS = [
  "Purchase",
  "LeadSubmitted",
  "InitiateCheckout",
  "AddToCart",
  "ViewContent",
  "OrderCreated",
  "OrderShipped",
] as const;

type SendLogRow = {
  id: string;
  waba_id: string | null;
  dataset_id: string | null;
  event_name: string | null;
  event_time: string | null;
  status: string | null;
  error_message?: string | null;
  created_at: string | null;
};

type RecentEventRow = {
  id: string;
  event_type: string | null;
  source: string | null;
  referral_hash?: string | null;
  received_at: string | null;
};

type TokenStatus = {
  provider: string | null;
  expiresAt: string | null;
  scopes: Record<string, unknown> | null;
};

type Props = {
  workspaceId: string;
  canEdit: boolean;
  connection: {
    wabaId: string | null;
    phoneNumberId: string | null;
    displayPhoneNumber: string | null;
    verifiedName: string | null;
    datasetId: string | null;
  };
  logs: SendLogRow[];
  tokenStatus: TokenStatus;
  recentEvents: RecentEventRow[];
};

/* ── helpers ── */

function tokenProviderLabel(provider: string | null) {
  if (provider === "meta_oauth") return "Meta OAuth";
  if (provider === "meta_system_user") return "System User";
  if (provider === "meta_whatsapp") return "Embedded Signup";
  if (provider === "env_system_user") return "Env System User";
  return provider || "Not set";
}

function tokenExpiryInfo(expiresAt: string | null): { label: string; warn: boolean; expired: boolean } {
  if (!expiresAt) return { label: "No expiry", warn: false, expired: false };
  const expDate = new Date(expiresAt);
  const now = new Date();
  const daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / 86_400_000);
  if (daysLeft < 0) return { label: `Expired ${Math.abs(daysLeft)}d ago`, warn: true, expired: true };
  if (daysLeft <= 7) return { label: `Expires in ${daysLeft}d`, warn: true, expired: false };
  return { label: `Expires ${expDate.toLocaleDateString()}`, warn: false, expired: false };
}

const PAGE_SIZE = 20;

export function MetaEventsClient({ workspaceId, canEdit, connection, logs, tokenStatus, recentEvents }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [wabaId, setWabaId] = useState(connection.wabaId ?? "");
  const [datasetId, setDatasetId] = useState(connection.datasetId ?? "");
  const [eventName, setEventName] = useState<(typeof EVENT_OPTIONS)[number]>(EVENT_OPTIONS[0]);
  const [currency, setCurrency] = useState("IDR");
  const [value, setValue] = useState<string>("");
  const [ctwaClid, setCtwaClid] = useState<string>("");
  const [creatingDataset, setCreatingDataset] = useState(false);
  const [sending, setSending] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"unknown" | "yes" | "no">("unknown");
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  // pagination
  const [logsPage, setLogsPage] = useState(1);
  const [eventsPage, setEventsPage] = useState(1);
  const visibleLogs = logs.slice(0, logsPage * PAGE_SIZE);
  const visibleEvents = recentEvents.slice(0, eventsPage * PAGE_SIZE);

  const disabled = !canEdit;

  // checklist state derived from real data
  const hasToken = !!tokenStatus.provider;
  const hasConnection = !!connection.wabaId && !!connection.phoneNumberId;
  const hasDataset = !!datasetId;
  const hasSentEvent = logs.some((l) => l.status === "success");
  const hasLogs = logs.length > 0 || recentEvents.length > 0;
  const expiry = tokenExpiryInfo(tokenStatus.expiresAt);

  const checkSubscription = useCallback(
    async (silent = false) => {
      if (!wabaId) return;
      setCheckingSubscription(true);
      try {
        const res = await fetch(
          `/api/meta/events/subscribed-apps?workspaceId=${workspaceId}&wabaId=${wabaId}`
        );
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.error) throw new Error(data?.reason || data?.error || "Check failed");
        setSubscriptionStatus(data.subscribed ? "yes" : "no");
        if (!silent) {
          toast({ title: data.subscribed ? "App subscribed ✓" : "Not subscribed", description: `App ID: ${data.appId}` });
        }
      } catch (err) {
        setSubscriptionStatus("unknown");
        if (!silent) {
          toast({
            title: "Subscription check failed",
            description: err instanceof Error ? err.message : "Unknown",
            variant: "destructive",
          });
        }
      } finally {
        setCheckingSubscription(false);
      }
    },
    [toast, wabaId, workspaceId]
  );

  useEffect(() => {
    if (!wabaId) return;
    checkSubscription(true).catch(() => undefined);
  }, [checkSubscription, wabaId]);

  async function handleCreateDataset() {
    if (!wabaId) {
      toast({ title: "Enter WABA ID first", variant: "destructive" });
      return;
    }
    setCreatingDataset(true);
    try {
      const res = await fetch("/api/meta/events/datasets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, wabaId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.error) {
        throw new Error(data?.reason || data?.error || "Failed to create dataset");
      }
      setDatasetId(data.datasetId);
      toast({ title: "Dataset ready ✓", description: `ID: ${data.datasetId}` });
      router.refresh();
    } catch (err) {
      toast({
        title: "Dataset error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setCreatingDataset(false);
    }
  }

  async function handleSendEvent() {
    if (!wabaId) {
      toast({ title: "Enter WABA ID first", variant: "destructive" });
      return;
    }
    if (!datasetId) {
      toast({ title: "Dataset missing", description: "Create a dataset first before sending events.", variant: "destructive" });
      return;
    }
    if (!ctwaClid.trim()) {
      toast({ title: "ctwa_clid required", description: "Paste the ctwa_clid value from a WhatsApp click-to-chat referral.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const payload = {
        workspaceId,
        wabaId,
        datasetId,
        eventName,
        value: value ? Number(value) : undefined,
        currency: currency || "IDR",
        ctwaClid: ctwaClid.trim(),
      };
      const res = await fetch("/api/meta/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.error) {
        throw new Error(data?.reason || data?.error || "Failed to send event");
      }
      toast({ title: "Event sent successfully ✓", description: data.fbtrace_id ? `fbtrace_id: ${data.fbtrace_id}` : "Event logged." });
      setCtwaClid("");
      setValue("");
      router.refresh();
    } catch (err) {
      toast({
        title: "Send failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  async function subscribeApp() {
    if (!wabaId) {
      toast({ title: "Enter WABA ID first", variant: "destructive" });
      return;
    }
    setCheckingSubscription(true);
    try {
      const res = await fetch(`/api/meta/events/subscribed-apps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, wabaId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.error) throw new Error(data?.reason || data?.error || "Subscribe failed");
      setSubscriptionStatus("yes");
      toast({ title: "Subscribed ✓", description: data.appId ? `App ${data.appId} subscribed to WABA` : undefined });
    } catch (err) {
      setSubscriptionStatus("unknown");
      toast({
        title: "Subscribe failed",
        description: err instanceof Error ? err.message : "Unknown",
        variant: "destructive",
      });
    } finally {
      setCheckingSubscription(false);
    }
  }

  /* ── Checklist step component ── */
  function ChecklistStep({ step, label, done }: { step: number; label: string; done: boolean }) {
    return (
      <div className="flex items-center gap-2">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
        ) : (
          <Circle className="h-4 w-4 text-[#d4af37]/50 shrink-0" />
        )}
        <Badge
          variant="outline"
          className={cn(
            "border px-1.5 py-0 text-[10px]",
            done ? "border-emerald-500/50 text-emerald-400" : "border-[#d4af37]/40 text-[#d4af37]"
          )}
        >
          {step}
        </Badge>
        <span className={cn("text-sm", done ? "text-[#f5f5dc]" : "text-[#f5f5dc]/60")}>{label}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Row 1: Connection Status + App Review Checklist ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 border border-[#d4af37]/30 bg-[#0a1229]/70 text-[#f5f5dc]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-[#d4af37]" />
                  Connection Status
                </CardTitle>
                <CardDescription className="text-[#f5f5dc]/60">
                  WABA and phone details for this workspace.
                </CardDescription>
              </div>
              {hasConnection && hasToken ? (
                <Badge className="border-emerald-500/50 bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="border-rose-500/50 text-rose-300">
                  <Unplug className="mr-1 h-3 w-3" /> Not Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-[#f5f5dc]/70">WABA ID</Label>
              <Input
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                placeholder="Enter WABA ID"
                disabled={disabled}
                className="mt-1 bg-[#050a18] text-[#f5f5dc] border-[#d4af37]/20 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-[#f5f5dc]/40">Required for dataset & events.</p>
            </div>
            <div>
              <Label className="text-xs text-[#f5f5dc]/70">Phone Number</Label>
              <div className="mt-1 flex items-center gap-2 rounded-md border border-[#d4af37]/20 bg-[#050a18] p-2.5 text-sm text-[#f5f5dc]/80 font-mono">
                {connection.displayPhoneNumber ?? connection.phoneNumberId ?? (
                  <span className="text-[#f5f5dc]/40 font-sans">No phone connected</span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#f5f5dc]/40">
                Verified: {connection.verifiedName ? (
                  <span className="text-emerald-400">{connection.verifiedName}</span>
                ) : (
                  <span className="text-[#f5f5dc]/40">—</span>
                )}
              </p>
            </div>
            <div>
              <Label className="text-xs text-[#f5f5dc]/70">Token</Label>
              <div className={cn(
                "mt-1 rounded-md border bg-[#050a18]/70 p-3 text-sm",
                expiry.expired
                  ? "border-rose-500/50"
                  : expiry.warn
                    ? "border-amber-500/50"
                    : "border-[#d4af37]/20"
              )}>
                <div className="flex items-center gap-2">
                  {hasToken ? (
                    <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Shield className="h-4 w-4 text-[#f5f5dc]/40 shrink-0" />
                  )}
                  <p className="font-semibold">{tokenProviderLabel(tokenStatus.provider)}</p>
                </div>
                <p className={cn(
                  "mt-0.5 text-xs",
                  expiry.expired ? "text-rose-300" : expiry.warn ? "text-amber-300" : "text-[#f5f5dc]/50"
                )}>
                  {expiry.expired && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                  {expiry.warn && !expiry.expired && <Clock className="inline h-3 w-3 mr-1" />}
                  {expiry.label}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-xs text-[#f5f5dc]/70">Subscription</Label>
              <div className="mt-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "border px-2 py-0.5",
                      subscriptionStatus === "yes"
                        ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                        : subscriptionStatus === "no"
                          ? "border-rose-500/50 text-rose-300 bg-rose-500/10"
                          : "border-[#d4af37]/40 text-[#d4af37]"
                    )}
                  >
                    {subscriptionStatus === "yes" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                    {subscriptionStatus === "no" && <XCircle className="mr-1 h-3 w-3" />}
                    {subscriptionStatus === "yes" ? "Subscribed" : subscriptionStatus === "no" ? "Not subscribed" : "Unknown"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => checkSubscription()}
                    disabled={checkingSubscription || !wabaId}
                    className="text-xs border-[#d4af37]/30 text-[#f5f5dc]/80 hover:bg-[#d4af37]/10"
                  >
                    {checkingSubscription ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                    Check
                  </Button>
                  {subscriptionStatus !== "yes" && (
                    <Button
                      size="sm"
                      onClick={subscribeApp}
                      disabled={checkingSubscription || !wabaId || disabled}
                      className="text-xs bg-[#d4af37]/20 text-[#f5f5dc] hover:bg-[#d4af37]/30"
                    >
                      {checkingSubscription ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Zap className="mr-1 h-3 w-3" />}
                      Subscribe
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-[#f5f5dc]/40">
                  POST /{"{waba_id}"}/subscribed_apps — subscribes to messages & business_messaging fields.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── App Review Checklist (interactive) ── */}
        <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70 text-[#f5f5dc]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-[#d4af37]" />
              App Review Checklist
            </CardTitle>
            <CardDescription className="text-[#f5f5dc]/60">
              Steps to record for Meta review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <ChecklistStep step={1} label="Login as owner/admin" done={canEdit} />
            <ChecklistStep step={2} label="Connect via Embedded Signup" done={hasConnection && hasToken} />
            <ChecklistStep step={3} label="Create dataset" done={hasDataset} />
            <ChecklistStep step={4} label="Subscribe app to WABA" done={subscriptionStatus === "yes"} />
            <ChecklistStep step={5} label="Send CAPI event with ctwa_clid" done={hasSentEvent} />
            <ChecklistStep step={6} label="Show event logs" done={hasLogs} />
            <Separator className="bg-[#d4af37]/10 my-2" />
            <div className="text-center">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  [canEdit, hasConnection && hasToken, hasDataset, subscriptionStatus === "yes", hasSentEvent, hasLogs].every(Boolean)
                    ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                    : "border-[#d4af37]/40 text-[#d4af37]"
                )}
              >
                {[canEdit, hasConnection && hasToken, hasDataset, subscriptionStatus === "yes", hasSentEvent, hasLogs].filter(Boolean).length}/6 Complete
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: Dataset + Send Test Event ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70 text-[#f5f5dc]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[#d4af37]" />
              Dataset
            </CardTitle>
            <CardDescription className="text-[#f5f5dc]/60">
              Required for Conversions API (business_messaging).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#f5f5dc]/50">Dataset ID</p>
                {datasetId ? (
                  <p className="text-sm font-semibold text-[#f5f5dc] font-mono">{datasetId}</p>
                ) : (
                  <p className="text-sm text-rose-300/70 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Not set
                  </p>
                )}
              </div>
              <Button
                size="sm"
                onClick={handleCreateDataset}
                disabled={disabled || creatingDataset || !wabaId}
                className="bg-[#d4af37]/20 text-[#f5f5dc] hover:bg-[#d4af37]/30"
              >
                {creatingDataset ? (
                  <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Working...</>
                ) : datasetId ? (
                  <><RefreshCw className="mr-1 h-3 w-3" /> Refresh</>
                ) : (
                  <><Database className="mr-1 h-3 w-3" /> Create</>
                )}
              </Button>
            </div>
            <Separator className="bg-[#d4af37]/10" />
            <p className="text-xs text-[#f5f5dc]/40 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Graph calls stay server-side; no tokens exposed to client.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70 text-[#f5f5dc]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-[#d4af37]" />
              Send Test Event
            </CardTitle>
            <CardDescription className="text-[#f5f5dc]/60">
              Send Conversions API event with ctwa_clid from referral.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-[#f5f5dc]/70">Event Name</Label>
                <select
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value as (typeof EVENT_OPTIONS)[number])}
                  className="mt-1 w-full rounded-md border border-[#d4af37]/20 bg-[#050a18] p-2 text-sm text-[#f5f5dc]"
                >
                  {EVENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-[#f5f5dc]/70">Value (optional)</Label>
                <Input
                  type="number"
                  placeholder="123.45"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="mt-1 bg-[#050a18] text-[#f5f5dc] border-[#d4af37]/20"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-[#f5f5dc]/70">Currency</Label>
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 bg-[#050a18] text-[#f5f5dc] border-[#d4af37]/20"
                />
              </div>
              <div>
                <Label className="text-xs text-[#f5f5dc]/70">ctwa_clid (required)</Label>
                <Input
                  value={ctwaClid}
                  onChange={(e) => setCtwaClid(e.target.value)}
                  placeholder="Paste from referral"
                  className="mt-1 bg-[#050a18] text-[#f5f5dc] border-[#d4af37]/20 font-mono text-xs"
                />
              </div>
            </div>
            <Button
              onClick={handleSendEvent}
              disabled={disabled || sending || !wabaId || !datasetId}
              className="w-full bg-[#d4af37]/20 text-[#f5f5dc] hover:bg-[#d4af37]/30"
            >
              {sending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Send Event</>
              )}
            </Button>
            <p className="text-[10px] text-[#f5f5dc]/40 flex items-center gap-1">
              <Shield className="h-3 w-3 shrink-0" />
              We never store raw ctwa_clid. Payloads are redacted and hashed before logging.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Recent Events ── */}
      <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70 text-[#f5f5dc]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#d4af37]" />
                Recent Events
              </CardTitle>
              <CardDescription className="text-[#f5f5dc]/60">
                meta_events_log (webhook + api) with hashed referral.
              </CardDescription>
            </div>
            {recentEvents.length > 0 && (
              <Badge variant="outline" className="border-[#d4af37]/30 text-[#d4af37] text-xs">
                {recentEvents.length} event{recentEvents.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[#f5f5dc]/70">Event</TableHead>
                <TableHead className="text-[#f5f5dc]/70">Source</TableHead>
                <TableHead className="text-[#f5f5dc]/70">Referral Hash</TableHead>
                <TableHead className="text-[#f5f5dc]/70">Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-[#f5f5dc]/40">
                      <Activity className="h-8 w-8" />
                      <p className="text-sm">No events yet</p>
                      <p className="text-xs">Events from webhooks and API will appear here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visibleEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge variant="outline" className="border-[#d4af37]/30 text-[#f5f5dc] text-xs">
                        {event.event_type ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5",
                          event.source === "webhook"
                            ? "border-blue-500/30 text-blue-300"
                            : "border-purple-500/30 text-purple-300"
                        )}
                      >
                        {event.source ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-[#f5f5dc]/60 max-w-[200px] truncate">
                      {event.referral_hash ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-[#f5f5dc]/50 whitespace-nowrap">
                      {event.received_at ? new Date(event.received_at).toLocaleString() : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {recentEvents.length > visibleEvents.length && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEventsPage((p) => p + 1)}
                className="border-[#d4af37]/30 text-[#f5f5dc]/70 hover:bg-[#d4af37]/10"
              >
                <ChevronDown className="mr-1 h-3 w-3" />
                Load more ({recentEvents.length - visibleEvents.length} remaining)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Row 4: CAPI Send Logs ── */}
      <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70 text-[#f5f5dc]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-[#d4af37]" />
                CAPI Send Logs
              </CardTitle>
              <CardDescription className="text-[#f5f5dc]/60">
                Conversions API send history (redacted payloads only).
              </CardDescription>
            </div>
            {logs.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
                  {logs.filter((l) => l.status === "success").length} success
                </Badge>
                {logs.some((l) => l.status === "failed") && (
                  <Badge variant="outline" className="border-rose-500/30 text-rose-300 text-xs">
                    {logs.filter((l) => l.status === "failed").length} failed
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[#f5f5dc]/70">Event</TableHead>
                <TableHead className="text-[#f5f5dc]/70">Dataset</TableHead>
                <TableHead className="text-[#f5f5dc]/70">Status</TableHead>
                <TableHead className="text-[#f5f5dc]/70">Error</TableHead>
                <TableHead className="text-[#f5f5dc]/70">Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-[#f5f5dc]/40">
                      <Send className="h-8 w-8" />
                      <p className="text-sm">No CAPI events sent yet</p>
                      <p className="text-xs">Send a test event above to see logs here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visibleLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline" className="border-[#d4af37]/30 text-[#f5f5dc] text-xs">
                        {log.event_name ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-[#f5f5dc]/60 max-w-[120px] truncate">
                      {log.dataset_id ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border px-2 py-0.5 text-xs",
                          log.status === "success"
                            ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                            : "border-rose-500/50 text-rose-300 bg-rose-500/10"
                        )}
                      >
                        {log.status === "success" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {log.status === "failed" && <XCircle className="mr-1 h-3 w-3" />}
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-rose-300/70 max-w-[180px] truncate">
                      {log.error_message ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-[#f5f5dc]/50 whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {logs.length > visibleLogs.length && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogsPage((p) => p + 1)}
                className="border-[#d4af37]/30 text-[#f5f5dc]/70 hover:bg-[#d4af37]/10"
              >
                <ChevronDown className="mr-1 h-3 w-3" />
                Load more ({logs.length - visibleLogs.length} remaining)
              </Button>
            </div>
          )}
          <Separator className="bg-[#d4af37]/10" />
          <p className="text-[10px] text-[#f5f5dc]/40 flex items-center gap-1">
            <Shield className="h-3 w-3 shrink-0" />
            ctwa_clid is SHA-256 hashed; only redacted payloads are stored server-side.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
