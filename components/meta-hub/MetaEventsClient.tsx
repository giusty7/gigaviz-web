"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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

function tokenProviderLabel(provider: string | null, t: (key: string) => string) {
  if (provider === "meta_oauth") return t("tokenMetaOAuth");
  if (provider === "meta_system_user") return t("tokenSystemUser");
  if (provider === "meta_whatsapp") return t("tokenEmbeddedSignup");
  if (provider === "env_system_user") return t("tokenEnvSystemUser");
  return provider || t("tokenNotSet");
}

function tokenExpiryInfo(expiresAt: string | null, t: (key: string, values?: Record<string, string | number | Date>) => string): { label: string; warn: boolean; expired: boolean } {
  if (!expiresAt) return { label: t("noExpiry"), warn: false, expired: false };
  const expDate = new Date(expiresAt);
  const now = new Date();
  const daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / 86_400_000);
  if (daysLeft < 0) return { label: t("expiredAgo", { days: Math.abs(daysLeft) }), warn: true, expired: true };
  if (daysLeft <= 7) return { label: t("expiresInDays", { days: daysLeft }), warn: true, expired: false };
  return { label: t("expiresOn", { date: expDate.toLocaleDateString() }), warn: false, expired: false };
}

const PAGE_SIZE = 20;

export function MetaEventsClient({ workspaceId, canEdit, connection, logs, tokenStatus, recentEvents }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("metaHubUI.metaEvents");

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
  const expiry = tokenExpiryInfo(tokenStatus.expiresAt, t);

  const checkSubscription = useCallback(
    async (silent = false) => {
      if (!wabaId) return;
      setCheckingSubscription(true);
      try {
        const res = await fetch(
          `/api/meta/events/subscribed-apps?workspaceId=${workspaceId}&wabaId=${wabaId}`
        );
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.error) throw new Error(data?.reason || data?.error || t("checkFailed"));
        setSubscriptionStatus(data.subscribed ? "yes" : "no");
        if (!silent) {
          toast({ title: data.subscribed ? t("appSubscribed") : t("notSubscribed"), description: `App ID: ${data.appId}` });
        }
      } catch (err) {
        setSubscriptionStatus("unknown");
        if (!silent) {
          toast({
            title: t("subscriptionCheckFailed"),
            description: err instanceof Error ? err.message : t("unknownLabel"),
            variant: "destructive",
          });
        }
      } finally {
        setCheckingSubscription(false);
      }
    },
    [t, toast, wabaId, workspaceId]
  );

  useEffect(() => {
    if (!wabaId) return;
    checkSubscription(true).catch(() => undefined);
  }, [checkSubscription, wabaId]);

  async function handleCreateDataset() {
    if (!wabaId) {
      toast({ title: t("enterWabaIdFirst"), variant: "destructive" });
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
        throw new Error(data?.reason || data?.error || t("errorCreateDataset"));
      }
      setDatasetId(data.datasetId);
      toast({ title: t("datasetReady"), description: `ID: ${data.datasetId}` });
      router.refresh();
    } catch (err) {
      toast({
        title: t("datasetError"),
        description: err instanceof Error ? err.message : t("unknownError"),
        variant: "destructive",
      });
    } finally {
      setCreatingDataset(false);
    }
  }

  async function handleSendEvent() {
    if (!wabaId) {
      toast({ title: t("enterWabaIdFirst"), variant: "destructive" });
      return;
    }
    if (!datasetId) {
      toast({ title: t("datasetMissing"), description: t("createDatasetFirst"), variant: "destructive" });
      return;
    }
    if (!ctwaClid.trim()) {
      toast({ title: t("ctwaClidRequired"), description: t("ctwaClidHint"), variant: "destructive" });
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
        throw new Error(data?.reason || data?.error || t("errorSendEvent"));
      }
      toast({ title: t("eventSentSuccess"), description: data.fbtrace_id ? `fbtrace_id: ${data.fbtrace_id}` : t("eventLogged") });
      setCtwaClid("");
      setValue("");
      router.refresh();
    } catch (err) {
      toast({
        title: t("sendFailed"),
        description: err instanceof Error ? err.message : t("unknownError"),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  async function subscribeApp() {
    if (!wabaId) {
      toast({ title: t("enterWabaIdFirst"), variant: "destructive" });
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
      if (!res.ok || data?.error) throw new Error(data?.reason || data?.error || t("subscribeFailed"));
      setSubscriptionStatus("yes");
      toast({ title: t("subscribedSuccess"), description: data.appId ? `App ${data.appId} subscribed to WABA` : undefined });
    } catch (err) {
      setSubscriptionStatus("unknown");
      toast({
        title: t("subscribeFailed"),
        description: err instanceof Error ? err.message : t("unknownLabel"),
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
                  {t("connectionStatus")}
                </CardTitle>
                <CardDescription className="text-[#f5f5dc]/60">
                  {t("connectionStatusDesc")}
                </CardDescription>
              </div>
              {hasConnection && hasToken ? (
                <Badge className="border-emerald-500/50 bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> {t("connected")}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-rose-500/50 text-rose-300">
                  <Unplug className="mr-1 h-3 w-3" /> {t("notConnected")}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-[#f5f5dc]/70">{t("wabaId")}</Label>
              <Input
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                placeholder={t("enterWabaId")}
                disabled={disabled}
                className="mt-1 bg-[#050a18] text-[#f5f5dc] border-[#d4af37]/20 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-[#f5f5dc]/40">{t("wabaIdHint")}</p>
            </div>
            <div>
              <Label className="text-xs text-[#f5f5dc]/70">{t("phoneNumber")}</Label>
              <div className="mt-1 flex items-center gap-2 rounded-md border border-[#d4af37]/20 bg-[#050a18] p-2.5 text-sm text-[#f5f5dc]/80 font-mono">
                {connection.displayPhoneNumber ?? connection.phoneNumberId ?? (
                  <span className="text-[#f5f5dc]/40 font-sans">{t("noPhoneConnected")}</span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#f5f5dc]/40">
                {t("verified")}: {connection.verifiedName ? (
                  <span className="text-emerald-400">{connection.verifiedName}</span>
                ) : (
                  <span className="text-[#f5f5dc]/40">—</span>
                )}
              </p>
            </div>
            <div>
              <Label className="text-xs text-[#f5f5dc]/70">{t("token")}</Label>
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
                  <p className="font-semibold">{tokenProviderLabel(tokenStatus.provider, t)}</p>
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
              <Label className="text-xs text-[#f5f5dc]/70">{t("subscription")}</Label>
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
                    {subscriptionStatus === "yes" ? t("subscribed") : subscriptionStatus === "no" ? t("notSubscribed") : t("unknownLabel")}
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
                    {t("check")}
                  </Button>
                  {subscriptionStatus !== "yes" && (
                    <Button
                      size="sm"
                      onClick={subscribeApp}
                      disabled={checkingSubscription || !wabaId || disabled}
                      className="text-xs bg-[#d4af37]/20 text-[#f5f5dc] hover:bg-[#d4af37]/30"
                    >
                      {checkingSubscription ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Zap className="mr-1 h-3 w-3" />}
                      {t("subscribe")}
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
              {t("checklistDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <ChecklistStep step={1} label={t("step1")} done={canEdit} />
            <ChecklistStep step={2} label={t("step2")} done={hasConnection && hasToken} />
            <ChecklistStep step={3} label={t("step3")} done={hasDataset} />
            <ChecklistStep step={4} label={t("step4")} done={subscriptionStatus === "yes"} />
            <ChecklistStep step={5} label={t("step5")} done={hasSentEvent} />
            <ChecklistStep step={6} label={t("step6")} done={hasLogs} />
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
                {[canEdit, hasConnection && hasToken, hasDataset, subscriptionStatus === "yes", hasSentEvent, hasLogs].filter(Boolean).length}/6 {t("complete")}
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
              {t("dataset")}
            </CardTitle>
            <CardDescription className="text-[#f5f5dc]/60">
              {t("datasetDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#f5f5dc]/50">{t("datasetIdLabel")}</p>
                {datasetId ? (
                  <p className="text-sm font-semibold text-[#f5f5dc] font-mono">{datasetId}</p>
                ) : (
                  <p className="text-sm text-rose-300/70 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> {t("notSet")}
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
                  <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> {t("working")}</>
                ) : datasetId ? (
                  <><RefreshCw className="mr-1 h-3 w-3" /> {t("refresh")}</>
                ) : (
                  <><Database className="mr-1 h-3 w-3" /> {t("create")}</>
                )}
              </Button>
            </div>
            <Separator className="bg-[#d4af37]/10" />
            <p className="text-xs text-[#f5f5dc]/40 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {t("graphCallsServerSide")}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70 text-[#f5f5dc]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-[#d4af37]" />
              {t("sendTestEvent")}
            </CardTitle>
            <CardDescription className="text-[#f5f5dc]/60">
              {t("sendTestEventDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-[#f5f5dc]/70">{t("eventName")}</Label>
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
                <Label className="text-xs text-[#f5f5dc]/70">{t("valueOptional")}</Label>
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
                <Label className="text-xs text-[#f5f5dc]/70">{t("currency")}</Label>
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 bg-[#050a18] text-[#f5f5dc] border-[#d4af37]/20"
                />
              </div>
              <div>
                <Label className="text-xs text-[#f5f5dc]/70">{t("ctwaClidLabel")}</Label>
                <Input
                  value={ctwaClid}
                  onChange={(e) => setCtwaClid(e.target.value)}
                  placeholder={t("pasteFromReferral")}
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
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("sending")}</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> {t("sendEvent")}</>
              )}
            </Button>
            <p className="text-[10px] text-[#f5f5dc]/40 flex items-center gap-1">
              <Shield className="h-3 w-3 shrink-0" />
              {t("neverStoreCtwaClidNote")}
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
                {t("recentEvents")}
              </CardTitle>
              <CardDescription className="text-[#f5f5dc]/60">
                {t("recentEventsDesc")}
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
                <TableHead className="text-[#f5f5dc]/70">{t("eventHeader")}</TableHead>
                <TableHead className="text-[#f5f5dc]/70">{t("sourceHeader")}</TableHead>
                <TableHead className="text-[#f5f5dc]/70">{t("referralHashHeader")}</TableHead>
                <TableHead className="text-[#f5f5dc]/70">{t("receivedHeader")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-[#f5f5dc]/40">
                      <Activity className="h-8 w-8" />
                      <p className="text-sm">{t("noEventsYet")}</p>
                      <p className="text-xs">{t("eventsWillAppear")}</p>
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
                Load more ({recentEvents.length - visibleEvents.length} {t("remaining")})
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
                {t("capiSendLogs")}
              </CardTitle>
              <CardDescription className="text-[#f5f5dc]/60">
                {t("capiSendLogsDesc")}
              </CardDescription>
            </div>
            {logs.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
                  {logs.filter((l) => l.status === "success").length} {t("success")}
                </Badge>
                {logs.some((l) => l.status === "failed") && (
                  <Badge variant="outline" className="border-rose-500/30 text-rose-300 text-xs">
                    {logs.filter((l) => l.status === "failed").length} {t("failed")}
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
                <TableHead className="text-[#f5f5dc]/70">{t("eventHeader")}</TableHead>
                <TableHead className="text-[#f5f5dc]/70">{t("datasetHeader")}</TableHead>
                <TableHead className="text-[#f5f5dc]/70">{t("statusHeader")}</TableHead>
                <TableHead className="text-[#f5f5dc]/70">{t("errorHeader")}</TableHead>
                <TableHead className="text-[#f5f5dc]/70">{t("sentHeader")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-[#f5f5dc]/40">
                      <Send className="h-8 w-8" />
                      <p className="text-sm">{t("noCapiEvents")}</p>
                      <p className="text-xs">{t("sendTestAbove")}</p>
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
                Load more ({logs.length - visibleLogs.length} {t("remaining")})
              </Button>
            </div>
          )}
          <Separator className="bg-[#d4af37]/10" />
          <p className="text-[10px] text-[#f5f5dc]/40 flex items-center gap-1">
            <Shield className="h-3 w-3 shrink-0" />
              {t("ctwaClidHashedNote")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
