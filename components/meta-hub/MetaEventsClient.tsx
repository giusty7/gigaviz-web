"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  const disabled = !canEdit;

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
          toast({ title: data.subscribed ? "App subscribed" : "Not subscribed", description: data.appId });
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

  function tokenProviderLabel() {
    if (tokenStatus.provider === "meta_oauth") return "Meta OAuth";
    if (tokenStatus.provider === "meta_system_user") return "System User";
    if (tokenStatus.provider === "meta_whatsapp") return "Embedded Signup";
    if (tokenStatus.provider === "env_system_user") return "Env System User";
    return tokenStatus.provider || "Not set";
  }

  async function handleCreateDataset() {
    if (!wabaId) {
      toast({ title: "Enter WABA ID", variant: "destructive" });
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
      toast({ title: "Dataset ready", description: `Dataset ID: ${data.datasetId}` });
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
      toast({ title: "Enter WABA ID", variant: "destructive" });
      return;
    }
    if (!datasetId) {
      toast({ title: "Dataset missing", description: "Create dataset first." });
      return;
    }
    if (!ctwaClid.trim()) {
      toast({ title: "ctwa_clid required", description: "Paste ctwa_clid from referral." });
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
      toast({ title: "Event sent", description: data.fbtrace_id ? `fbtrace_id: ${data.fbtrace_id}` : undefined });
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
      toast({ title: "Enter WABA ID", variant: "destructive" });
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
      toast({ title: "Subscribed", description: data.appId ? `App ${data.appId}` : undefined });
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 border border-[#d4af37]/30 bg-[#0a1229]/70 text-[#f5f5dc]">
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription className="text-[#f5f5dc]/60">
              WABA and phone details for this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>WABA ID</Label>
              <Input
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                placeholder="Enter WABA ID"
                disabled={disabled}
                className="mt-1 bg-[#050a18] text-[#f5f5dc]"
              />
              <p className="mt-1 text-xs text-[#f5f5dc]/50">Required for dataset & events.</p>
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={connection.displayPhoneNumber ?? connection.phoneNumberId ?? ""}
                disabled
                className="mt-1 bg-[#050a18] text-[#f5f5dc]/70"
              />
              <p className="mt-1 text-xs text-[#f5f5dc]/50">Verified: {connection.verifiedName ?? "-"}</p>
            </div>
            <div>
              <Label>Token</Label>
              <div className="mt-1 rounded-md border border-[#d4af37]/30 bg-[#050a18]/70 p-3 text-sm">
                <p className="font-semibold">{tokenProviderLabel()}</p>
                <p className="text-xs text-[#f5f5dc]/60">
                  {tokenStatus.expiresAt ? `Expires ${new Date(tokenStatus.expiresAt).toLocaleString()}` : "No expiry"}
                </p>
              </div>
            </div>
            <div>
              <Label>Subscription</Label>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className="border-[#d4af37]/40 text-[#d4af37]">
                  {subscriptionStatus === "yes" ? "Subscribed" : subscriptionStatus === "no" ? "Not subscribed" : "Unknown"}
                </Badge>
                <Button size="sm" onClick={() => checkSubscription()} disabled={checkingSubscription || !wabaId}>
                  {checkingSubscription ? "Checking..." : "Check"}
                </Button>
                <Button size="sm" onClick={subscribeApp} disabled={checkingSubscription || !wabaId || disabled}>
                  {checkingSubscription ? "Working..." : "Subscribe"}
                </Button>
              </div>
              <p className="mt-1 text-xs text-[#f5f5dc]/60">POST /subscribed_apps with whatsapp_business_manage_events.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70 text-[#f5f5dc]">
          <CardHeader>
            <CardTitle>App Review Checklist</CardTitle>
            <CardDescription className="text-[#f5f5dc]/60">
              Steps to record for Meta review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[#f5f5dc]/70">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#d4af37]/40 text-[#d4af37]">1</Badge>
              Login as owner/admin
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#d4af37]/40 text-[#d4af37]">2</Badge>
              Connect via Embedded Signup
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#d4af37]/40 text-[#d4af37]">3</Badge>
              Create dataset
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#d4af37]/40 text-[#d4af37]">4</Badge>
              Subscribe app to WABA
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#d4af37]/40 text-[#d4af37]">5</Badge>
              Send Conversions API event with ctwa_clid
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#d4af37]/40 text-[#d4af37]">6</Badge>
              Show event logs
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70 text-[#f5f5dc]">
          <CardHeader>
            <CardTitle>Dataset</CardTitle>
            <CardDescription className="text-[#f5f5dc]/60">
              Required for Conversions API (business_messaging).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#f5f5dc]/70">Dataset ID</p>
                <p className="text-base font-semibold text-[#f5f5dc]">{datasetId || "Not set"}</p>
              </div>
              <Button
                size="sm"
                onClick={handleCreateDataset}
                disabled={disabled || creatingDataset || !wabaId}
                className="bg-[#d4af37]/20 text-[#f5f5dc] hover:bg-[#d4af37]/30"
              >
                {creatingDataset ? "Working..." : datasetId ? "Refresh" : "Create"}
              </Button>
            </div>
            <p className="text-xs text-[#f5f5dc]/50">Graph calls stay server-side; no tokens in client.</p>
          </CardContent>
        </Card>

        <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70 text-[#f5f5dc]">
          <CardHeader>
            <CardTitle>Send Test Event</CardTitle>
            <CardDescription className="text-[#f5f5dc]/60">
              Send Conversions API event with ctwa_clid from referral.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Event Name</Label>
                <select
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value as (typeof EVENT_OPTIONS)[number])}
                  className="mt-1 w-full rounded-md border border-[#d4af37]/30 bg-[#050a18] p-2 text-[#f5f5dc]"
                >
                  {EVENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Value (optional)</Label>
                <Input
                  type="number"
                  placeholder="123.45"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="mt-1 bg-[#050a18] text-[#f5f5dc]"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Currency</Label>
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 bg-[#050a18] text-[#f5f5dc]"
                />
              </div>
              <div>
                <Label>ctwa_clid (required)</Label>
                <Input
                  value={ctwaClid}
                  onChange={(e) => setCtwaClid(e.target.value)}
                  placeholder="Paste from referral"
                  className="mt-1 bg-[#050a18] text-[#f5f5dc]"
                />
              </div>
            </div>
            <Button
              onClick={handleSendEvent}
              disabled={disabled || sending}
              className="w-full bg-[#d4af37]/20 text-[#f5f5dc] hover:bg-[#d4af37]/30"
            >
              {sending ? "Sending..." : "Send Event"}
            </Button>
            <p className="text-xs text-[#f5f5dc]/50">
              We never store raw ctwa_clid. Payloads are redacted and hashed before logging.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70 text-[#f5f5dc]">
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription className="text-[#f5f5dc]/60">
            meta_events_log (webhook + api) with hashed referral.
          </CardDescription>
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
                  <TableCell colSpan={4} className="text-center text-[#f5f5dc]/50">
                    No events yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.event_type ?? "-"}</TableCell>
                    <TableCell className="text-xs text-[#f5f5dc]/70">{event.source ?? "-"}</TableCell>
                    <TableCell className="text-xs font-mono text-[#f5f5dc]/70">
                      {event.referral_hash ?? "-"}
                    </TableCell>
                    <TableCell className="text-xs text-[#f5f5dc]/60">
                      {event.received_at ? new Date(event.received_at).toLocaleString() : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70 text-[#f5f5dc]">
        <CardHeader>
          <CardTitle>CAPI Send Logs</CardTitle>
          <CardDescription className="text-[#f5f5dc]/60">
            meta_capi_event_logs (redacted payloads only).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[#f5f5dc]/70">Event</TableHead>
                <TableHead className="text-[#f5f5dc]/70">Dataset</TableHead>
                <TableHead className="text-[#f5f5dc]/70">Status</TableHead>
                <TableHead className="text-[#f5f5dc]/70">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-[#f5f5dc]/50">
                    No logs yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.event_name ?? "-"}</TableCell>
                    <TableCell className="text-xs text-[#f5f5dc]/70">{log.dataset_id ?? "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border px-2 py-1",
                          log.status === "success"
                            ? "border-emerald-500/50 text-emerald-400"
                            : "border-rose-500/50 text-rose-300"
                        )}
                      >
                        {log.status}
                      </Badge>
                      {log.error_message ? (
                        <p className="text-xs text-rose-300">{log.error_message}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-xs text-[#f5f5dc]/60">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Separator className="bg-[#d4af37]/20" />
          <p className="text-xs text-[#f5f5dc]/50">
            ctwa_clid is hashed; only redacted payloads are stored server-side.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
