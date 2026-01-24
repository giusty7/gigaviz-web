"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  isConnected: boolean;
  docsHref?: string;
  onResult?: (result: "success" | "error") => void;
};

type FinishPayload = {
  wabaId: string;
  phoneNumberId: string;
  businessId?: string | null;
};

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M22.675 0h-21.35C.595 0 0 .593 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.691v-3.622h3.129V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.325-.592 1.325-1.326V1.326C24 .593 23.405 0 22.675 0z" />
    </svg>
  );
}

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

type StepStatus = "Waiting" | "In progress" | "Done" | "Failed";

interface StepState {
  authorize: StepStatus;
  setup: StepStatus;
  saving: StepStatus;
  done: StepStatus;
}

export function WhatsappEmbeddedSignup({ workspaceSlug, canEdit, isConnected, docsHref, onResult }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const appId = process.env.NEXT_PUBLIC_META_APP_ID ?? "";
  const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID ?? "";
  const solutionId = process.env.NEXT_PUBLIC_META_SOLUTION_ID ?? "";
  const [sdkReady, setSdkReady] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  const [stepStates, setStepStates] = useState<StepState>({
    authorize: "Waiting",
    setup: "Waiting",
    saving: "Waiting",
    done: "Waiting",
  });

  const authCodeRef = useRef<string | null>(null);
  const setupDataRef = useRef<FinishPayload | null>(null);

  const isConfigured = Boolean(appId && configId);
  const statusLabel = isConnected ? "Connected" : "Not connected";

  // Reset all states
  const resetFlow = useCallback(() => {
    setStepStates({
      authorize: "Waiting",
      setup: "Waiting",
      saving: "Waiting",
      done: "Waiting",
    });
    setErrorText(null);
    setIsRunning(false);
    authCodeRef.current = null;
    setupDataRef.current = null;
  }, []);

  // Main async runner function
  const runEmbeddedSignup = useCallback(async () => {
    // Dev-only HTTPS check
    if (typeof window !== "undefined" && window.location.protocol !== "https:") {
      setStepStates({
        authorize: "Failed",
        setup: "Waiting",
        saving: "Waiting",
        done: "Waiting",
      });
      setErrorText("Facebook Login requires HTTPS. Use your live/preview URL for testing.");
      setIsRunning(false);
      return;
    }

    if (!window.FB || !sdkReady) {
      toast({
        title: "SDK not ready",
        description: "Facebook SDK is not ready. Try again in a few seconds.",
        variant: "destructive",
      });
      return;
    }

    if (!configId) {
      toast({
        title: "Config ID missing",
        description: "Set NEXT_PUBLIC_META_CONFIG_ID before continuing.",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setErrorText(null);

    // Reset all to Waiting
    setStepStates({
      authorize: "Waiting",
      setup: "Waiting",
      saving: "Waiting",
      done: "Waiting",
    });

    try {
      // STEP 1: Authorize
      setStepStates(prev => ({ ...prev, authorize: "In progress" }));

      const authResult = await new Promise<string>((resolve, reject) => {
        const extras: Record<string, unknown> = { sessionInfoVersion: "3" };
        if (solutionId) {
          extras.setup = { solutionID: solutionId };
        }

        window.FB!.login(
          (response) => {
            const code = response?.authResponse?.code ?? null;
            if (!code) {
              reject(new Error("Authorization code not received."));
            } else {
              resolve(code);
            }
          },
          {
            config_id: configId,
            response_type: "code",
            override_default_response_type: true,
            extras,
          }
        );
      });

      authCodeRef.current = authResult;
      setStepStates(prev => ({ ...prev, authorize: "Done" }));

      // STEP 2: Set up WhatsApp (wait for postMessage from Facebook)
      setStepStates(prev => ({ ...prev, setup: "In progress" }));

      const setupResult = await new Promise<FinishPayload>((resolve, reject) => {
        let timeoutId: NodeJS.Timeout | null = null;
        
        function cleanup() {
          if (timeoutId) clearTimeout(timeoutId);
          window.removeEventListener("message", onMessage);
        }

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
            cleanup();
            const message = String(info.error_message ?? info.message ?? "Setup error");
            reject(new Error(message));
            return;
          }

          if (eventType === "CANCEL") {
            cleanup();
            reject(new Error("Setup was canceled."));
            return;
          }

          if (eventType === "FINISH") {
            cleanup();

            const wabaId = String(info.waba_id ?? info.wabaId ?? "");
            const phoneNumberId = String(info.phone_number_id ?? info.phoneNumberId ?? "");
            const businessId = info.business_id ?? info.businessId ?? null;

            if (!wabaId || !phoneNumberId) {
              reject(new Error("WABA ID or Phone Number ID not found."));
            } else {
              resolve({
                wabaId,
                phoneNumberId,
                businessId: businessId ? String(businessId) : null,
              });
            }
          }
        }

        window.addEventListener("message", onMessage);
        
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error("WhatsApp setup timed out. Please try again."));
        }, 120000); // 2 min timeout
      });

      setupDataRef.current = setupResult;
      setStepStates(prev => ({ ...prev, setup: "Done" }));

      // STEP 3: Save connection
      setStepStates(prev => ({ ...prev, saving: "In progress" }));

      const res = await fetch("/api/meta/whatsapp/connections/embedded-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceSlug,
          label: label.trim() || null,
          waba_id: setupResult.wabaId,
          phone_number_id: setupResult.phoneNumberId,
          businessId: setupResult.businessId ?? null,
          code: authResult,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || data?.reason || "Failed to save connection.");
      }

      setStepStates(prev => ({ ...prev, saving: "Done" }));

      // STEP 4: Done
      setStepStates(prev => ({ ...prev, done: "Done" }));

      if (onResult) {
        onResult("success");
      } else {
        toast({ title: "Embedded signup succeeded", description: "WhatsApp connection saved." });
        router.refresh();
      }

      setIsRunning(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error occurred.";
      setErrorText(msg);
      setIsRunning(false);

      // Map error to correct step
      setStepStates(prev => {
        if (!authCodeRef.current) {
          // Authorize failed
          return { ...prev, authorize: "Failed" };
        } else if (!setupDataRef.current) {
          // Setup failed
          return { ...prev, setup: "Failed" };
        } else {
          // Save failed
          return { ...prev, saving: "Failed" };
        }
      });

      toast({ title: "Signup failed", description: msg, variant: "destructive" });
      onResult?.("error");
    }
  }, [sdkReady, configId, solutionId, workspaceSlug, label, onResult, toast, router]);

  useEffect(() => {
    if (!appId) return;
    if (typeof window === "undefined") return;

    function markReady() {
      if (window.FB) {
        setSdkReady(true);
      }
    }

    markReady();
    window.addEventListener("fb-sdk-ready", markReady);

    return () => window.removeEventListener("fb-sdk-ready", markReady);
  }, [appId]);

  const steps = [
    { key: "authorize", label: "Authorize", status: stepStates.authorize },
    { key: "setup", label: "Set up WhatsApp", status: stepStates.setup },
    { key: "saving", label: "Save connection", status: stepStates.saving },
    { key: "done", label: "Done", status: stepStates.done },
  ];

  const hasFailedStep = Object.values(stepStates).some(s => s === "Failed");

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-[#1877F2] text-white shadow-[0_4px_12px_-2px_rgba(24,119,242,0.5),0_2px_6px_-2px_rgba(24,119,242,0.3),inset_0_-2px_0_0_rgba(0,0,0,0.15)] hover:shadow-[0_6px_16px_-2px_rgba(24,119,242,0.6),0_3px_8px_-2px_rgba(24,119,242,0.4),inset_0_-2px_0_0_rgba(0,0,0,0.15)] transition-shadow">
              <FacebookIcon className="h-6 w-6" />
            </span>
            <span>Embedded Sign Up (Recommended)</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect client&apos;s WhatsApp Business in minutes via Meta.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {docsHref ? (
            <Button asChild variant="ghost" size="sm" className="h-8 px-3 text-xs">
              <Link href={docsHref}>Learn</Link>
            </Button>
          ) : null}
          <Badge
            variant="outline"
            className={cn(
              "border-border bg-background text-xs",
              sdkReady ? "text-emerald-200" : "text-muted-foreground"
            )}
          >
            {sdkReady ? "SDK ready" : "SDK not ready"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge
            variant="outline"
            className={cn(
              "border-border bg-background text-xs",
              isConnected ? "text-emerald-200" : "text-muted-foreground"
            )}
          >
            Status: {statusLabel}
          </Badge>
          {!canEdit ? <span className="text-xs">Owner/Admin only</span> : null}
        </div>
        {!isConfigured ? (
          <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
            Add NEXT_PUBLIC_META_APP_ID & NEXT_PUBLIC_META_CONFIG_ID env vars to use Embedded Signup.
          </div>
        ) : null}
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="connectionLabel">Connection name (optional)</Label>
            <Input
              id="connectionLabel"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., WA Support, WA Sales"
              className="bg-background"
              disabled={!canEdit}
            />
            <p className="text-xs text-muted-foreground">
              Used only in your Gigaviz dashboard to identify this connection.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} disabled={!canEdit || !isConfigured}>
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-[0_0_8px_rgba(24,119,242,0.5)]">
              <FacebookIcon className="h-3 w-3" />
            </span>
            <span>Continue with Facebook</span>
          </Button>
        </div>
        {!canEdit ? (
          <p className="text-xs text-muted-foreground">
            Only owners/admins can add new connections.
          </p>
        ) : null}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Connect WhatsApp</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Continue in Facebook to complete setup (Embedded Signup).</p>
                <p className="text-xs">
                  A Facebook window will open to finish setup. Keep this window open. If nothing opens, allow pop-ups for this site.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-2 rounded-xl border border-border bg-background p-3 text-sm">
              {steps.map((step) => (
                <div key={step.key} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{step.label}</span>
                  <Badge
                    className={cn(
                      "border border-border",
                      step.status === "Done" && "bg-emerald-500/15 text-emerald-200",
                      step.status === "In progress" && "bg-gigaviz-surface text-foreground",
                      step.status === "Waiting" && "bg-background text-muted-foreground",
                      step.status === "Failed" && "bg-rose-500/15 text-rose-200"
                    )}
                  >
                    {step.status}
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
            {hasFailedStep ? (
              <Button type="button" variant="outline" onClick={resetFlow}>
                Retry
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isRunning}>
                Close
              </Button>
            )}
            <Button
              type="button"
              onClick={runEmbeddedSignup}
              disabled={!sdkReady || isRunning || stepStates.done === "Done"}
            >
              {isRunning ? "Processing..." : "Continue with Facebook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
