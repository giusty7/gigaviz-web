"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Props = {
  workspaceSlug: string;
  canEdit: boolean;
};

type FinishPayload = {
  wabaId: string;
  phoneNumberId: string;
  businessId?: string | null;
};

declare global {
  interface Window {
    FB?: {
      init: (config: Record<string, unknown>) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        params: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

const SDK_URL = "https://connect.facebook.net/en_US/sdk.js";
const DEFAULT_GRAPH_VERSION = "v22.0";

export function WhatsappEmbeddedSignup({ workspaceSlug, canEdit }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const appId = process.env.NEXT_PUBLIC_META_APP_ID ?? "";
  const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID ?? "";
  const solutionId = process.env.NEXT_PUBLIC_META_SOLUTION_ID ?? "";
  const [sdkReady, setSdkReady] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<"idle" | "authorizing" | "waiting" | "saving" | "done" | "error">(
    "idle"
  );
  const [errorText, setErrorText] = useState<string | null>(null);
  const pendingFinishRef = useRef<FinishPayload | null>(null);

  const isConfigured = Boolean(appId && configId);

  const saveConnection = useCallback(
    async (code: string, payload: FinishPayload) => {
      setStatus("saving");
      try {
        const res = await fetch("/api/meta/whatsapp/connections/embedded-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceSlug,
            label: label.trim() || null,
            waba_id: payload.wabaId,
            phone_number_id: payload.phoneNumberId,
            businessId: payload.businessId ?? null,
            code,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.ok === false) {
          throw new Error(data?.message || data?.reason || "Gagal menyimpan koneksi.");
        }
        setStatus("done");
        toast({ title: "Embedded Signup sukses", description: "Koneksi WhatsApp tersimpan." });
        router.refresh();
      } catch (err) {
        setStatus("error");
        const msg = err instanceof Error ? err.message : "Gagal menyimpan koneksi.";
        setErrorText(msg);
        toast({ title: "Signup gagal", description: msg, variant: "destructive" });
      }
    },
    [label, router, toast, workspaceSlug]
  );

  useEffect(() => {
    if (!appId) return;
    if (typeof window === "undefined") return;

    window.fbAsyncInit = () => {
      if (!window.FB) return;
      window.FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version: DEFAULT_GRAPH_VERSION,
      });
      setSdkReady(true);
    };

    if (window.FB) {
      window.fbAsyncInit?.();
    }
  }, [appId]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const origin = (event.origin || "").toLowerCase();
      if (!origin.includes("facebook.com")) return;

      let payload: unknown = event.data;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }

      const data = payload as { type?: string; event?: string; data?: Record<string, unknown> } | null;
      if (!data || data.type !== "WA_EMBEDDED_SIGNUP") return;

      const eventType = data.event ?? (data.data?.event as string | undefined);
      const info = (data.data ?? data) as Record<string, unknown>;

      if (eventType === "ERROR") {
        const message = String(info.error_message ?? info.message ?? "Signup error");
        setStatus("error");
        setErrorText(message);
        toast({ title: "Embedded Signup error", description: message, variant: "destructive" });
        return;
      }

      if (eventType === "CANCEL") {
        const step = String(info.current_step ?? "cancelled");
        setStatus("idle");
        toast({ title: "Signup dibatalkan", description: `Langkah terakhir: ${step}` });
        return;
      }

      if (eventType === "FINISH") {
        const wabaId = String(info.waba_id ?? info.wabaId ?? "");
        const phoneNumberId = String(info.phone_number_id ?? info.phoneNumberId ?? "");
        const businessId = info.business_id ?? info.businessId ?? null;
        if (!wabaId || !phoneNumberId) {
          setStatus("error");
          setErrorText("WABA ID atau Phone Number ID tidak ditemukan.");
          return;
        }
        const finishPayload = { wabaId, phoneNumberId, businessId: businessId ? String(businessId) : null };
        if (authCode) {
          void saveConnection(authCode, finishPayload);
        } else {
          pendingFinishRef.current = finishPayload;
          setStatus("waiting");
        }
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [authCode, saveConnection, toast]);

  const stepIndex = useMemo(() => {
    if (status === "authorizing") return 0;
    if (status === "waiting") return 1;
    if (status === "saving") return 2;
    if (status === "done") return 3;
    return -1;
  }, [status]);

  async function launchSignup() {
    if (!window.FB || !sdkReady) {
      toast({
        title: "SDK belum siap",
        description: "Facebook SDK belum siap. Coba beberapa detik lagi.",
        variant: "destructive",
      });
      return;
    }
    if (!configId) {
      toast({
        title: "Config ID kosong",
        description: "Isi NEXT_PUBLIC_META_CONFIG_ID terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    setErrorText(null);
    setStatus("authorizing");

    const extras: Record<string, unknown> = { sessionInfoVersion: "3" };
    if (solutionId) {
      extras.setup = { solutionID: solutionId };
    }

    window.FB.login(
      (response) => {
        const code = response?.authResponse?.code ?? null;
        if (!code) {
          setStatus("error");
          setErrorText("Authorization code tidak diterima.");
          return;
        }
        setAuthCode(code);
        setStatus("waiting");
        if (pendingFinishRef.current) {
          void saveConnection(code, pendingFinishRef.current);
          pendingFinishRef.current = null;
        }
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras,
      }
    );
  }

  function resetFlow() {
    setStatus("idle");
    setErrorText(null);
    setAuthCode(null);
    pendingFinishRef.current = null;
  }

  const steps = [
    { key: "authorize", label: "Authorize" },
    { key: "setup", label: "Setup WhatsApp" },
    { key: "saving", label: "Saving connection" },
    { key: "done", label: "Done" },
  ];

  return (
    <Card className="border-border bg-card">
      <Script src={SDK_URL} strategy="afterInteractive" />
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">
            Embedded Signup (WhatsApp)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Hubungkan WhatsApp pelanggan langsung melalui Embedded Signup.
          </p>
        </div>
        <Badge variant="outline" className={cn("border-border bg-background text-xs", sdkReady ? "text-emerald-200" : "text-muted-foreground")}>
          {sdkReady ? "SDK ready" : "SDK belum siap"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isConfigured ? (
          <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
            Lengkapi env: NEXT_PUBLIC_META_APP_ID & NEXT_PUBLIC_META_CONFIG_ID untuk memakai Embedded Signup.
          </div>
        ) : null}
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-1">
            <Label htmlFor="connectionLabel">Label koneksi (opsional)</Label>
            <Input
              id="connectionLabel"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Contoh: WA Support / WA Sales"
              className="bg-background"
              disabled={!canEdit}
            />
          </div>
          <Button onClick={() => setDialogOpen(true)} disabled={!canEdit || !isConfigured}>
            Connect via Embedded Signup
          </Button>
        </div>
        {!canEdit ? (
          <p className="text-xs text-muted-foreground">
            Hanya owner/admin yang dapat menambah koneksi baru.
          </p>
        ) : null}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Connect WhatsApp</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Ikuti langkah authorization sampai selesai di Facebook Embedded Signup.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-2 rounded-xl border border-border bg-background p-3 text-sm">
              {steps.map((step, idx) => (
                <div key={step.key} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{step.label}</span>
                  <Badge
                    className={cn(
                      "border border-border",
                      idx < stepIndex ? "bg-emerald-500/15 text-emerald-200" : idx === stepIndex ? "bg-gigaviz-surface text-foreground" : "bg-background text-muted-foreground"
                    )}
                  >
                    {idx < stepIndex ? "Done" : idx === stepIndex ? "Active" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>

            {errorText ? (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
                {errorText}
              </div>
            ) : null}
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={resetFlow} disabled={status === "saving"}>
              Retry
            </Button>
            <Button
              type="button"
              onClick={launchSignup}
              disabled={!sdkReady || status === "saving"}
            >
              {status === "saving" ? "Menyimpan..." : "Launch Embedded Signup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
