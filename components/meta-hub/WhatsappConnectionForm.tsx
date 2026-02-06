"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ShieldCheck, KeyRound, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

function buildSchema(tokenExists: boolean) {
  return z.object({
    phoneNumberId: z.string().min(6, "Phone number ID is required"),
    wabaId: z.string().optional(),
    accessToken: tokenExists
      ? z.string().optional() // Token already stored; only required if user wants to replace
      : z.string().min(8, "Access token is required"),
    displayName: z.string().optional(),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  canEdit: boolean;
  canRunTests?: boolean;
  connectionTestEnvMissing?: string[];
  initialPhoneNumberId?: string | null;
  initialWabaId?: string | null;
  initialDisplayName?: string | null;
  status?: string | null;
  lastTestedAt?: string | null;
  lastTestResult?: string | null;
  tokenSet?: boolean;
  /** Called after a successful save so the parent can refresh server data */
  onSaved?: () => void;
};

export function WhatsappConnectionForm({
  workspaceId,
  canEdit,
  canRunTests,
  connectionTestEnvMissing,
  initialDisplayName,
  initialPhoneNumberId,
  initialWabaId,
  status,
  lastTestedAt,
  lastTestResult,
  tokenSet,
  onSaved,
}: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status ?? "inactive");
  const [currentTestedAt, setCurrentTestedAt] = useState<string | null>(lastTestedAt ?? null);
  const [currentTestResult, setCurrentTestResult] = useState<string | null>(
    lastTestResult ?? null
  );
  const [hasToken, setHasToken] = useState(Boolean(tokenSet));
  const [showTokenReplace, setShowTokenReplace] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(buildSchema(hasToken && !showTokenReplace)),
    defaultValues: {
      phoneNumberId: initialPhoneNumberId ?? "",
      wabaId: initialWabaId ?? "",
      displayName: initialDisplayName ?? "",
      accessToken: "",
    },
  });

  const readOnly = !canEdit;
  const testPermission = typeof canRunTests === "boolean" ? canRunTests : canEdit;
  const missingEnvKeys = connectionTestEnvMissing ?? [];
  const hasMissingEnv = missingEnvKeys.length > 0;

  async function onSubmit(values: FormValues) {
    if (readOnly) return;
    setSaving(true);
    try {
      const trimmedToken = values.accessToken?.trim() || "";
      const res = await fetch("/api/meta/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          phoneNumberId: values.phoneNumberId.trim(),
          wabaId: values.wabaId?.trim() || null,
          displayName: values.displayName?.trim() || null,
          ...(trimmedToken ? { accessToken: trimmedToken } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.reason || data?.error || "Failed to save connection");
      }
      setCurrentStatus(data?.status ?? "active");
      setHasToken(Boolean(data?.tokenSet ?? true));
      setShowTokenReplace(false);
      setCurrentTestResult(data?.lastTestResult ?? null);
      setCurrentTestedAt(data?.lastTestedAt ?? null);
      form.reset({
        phoneNumberId: values.phoneNumberId.trim(),
        wabaId: values.wabaId?.trim() || "",
        displayName: values.displayName?.trim() || "",
        accessToken: "",
      });
      toast({
        title: "Connection saved",
        description: trimmedToken
          ? "Connection and new token saved securely."
          : "Connection details updated.",
      });
      // Trigger parent to refresh server data so all sections update
      onSaved?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save connection";
      toast({
        title: "Save failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function onTest() {
    if (hasMissingEnv) {
      toast({
        title: "Missing environment variables",
        description: `Set ${missingEnvKeys.join(", ")} to enable tests.`,
        variant: "destructive",
      });
      return;
    }
    if (!testPermission) {
      toast({
        title: "Access denied",
        description: "Admin access is required to run connection tests.",
        variant: "destructive",
      });
      return;
    }
    const phoneNumberId = form.getValues("phoneNumberId") || initialPhoneNumberId;
    if (!phoneNumberId) {
      toast({
        title: "Phone Number ID required",
        description: "Fill in the Phone Number ID before running a connection test.",
        variant: "destructive",
      });
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/meta/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, phoneNumberId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.result || data?.reason || "Connection test failed");
      }
      setCurrentStatus(data?.status ?? "active");
      setCurrentTestedAt(data?.lastTestedAt ?? null);
      setCurrentTestResult(data?.result ?? null);
      toast({
        title: "Test succeeded",
        description: data?.result === "validated" ? "Token is valid and connected." : data?.result,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection test failed";
      setCurrentStatus("inactive");
      setCurrentTestResult(message);
      setCurrentTestedAt(new Date().toISOString());
      toast({
        title: "Test failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">WhatsApp Connection</p>
          <p className="text-sm text-muted-foreground">
            Store the phone number ID and access token securely. The token will not be shown again.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={cn(
              "border px-3 py-1 text-xs font-semibold",
              currentStatus === "active"
                ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                : "border-amber-500/60 bg-amber-500/10 text-amber-100"
            )}
          >
            {currentStatus === "active" ? "Connected" : "Inactive"}
          </Badge>
          {hasToken ? (
            <Badge className="border border-border bg-gigaviz-surface px-3 py-1 text-xs">
              Token set
            </Badge>
          ) : (
            <Badge className="border border-border/80 bg-background px-3 py-1 text-xs text-muted-foreground">
              Token not set
            </Badge>
          )}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="phoneNumberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter phone number ID"
                    disabled={readOnly || saving}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="wabaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WABA ID (optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="WABA ID"
                    disabled={readOnly || saving}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display name (optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Display name"
                    disabled={readOnly || saving}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accessToken"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Access token</FormLabel>
                {hasToken && !showTokenReplace ? (
                  /* Token already secured — show badge + replace option */
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-300">
                        Token secured &amp; encrypted
                      </span>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setShowTokenReplace(true)}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Replace with a new token
                      </button>
                    )}
                  </div>
                ) : (
                  /* No token yet or user chose to replace */
                  <div className="space-y-2">
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder={hasToken ? "Enter new token to replace" : "Enter access token"}
                          className="pl-9"
                          disabled={readOnly || saving}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    {showTokenReplace && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowTokenReplace(false);
                          form.setValue("accessToken", "");
                        }}
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        ← Cancel, keep current token
                      </button>
                    )}
                    <FormMessage />
                  </div>
                )}
              </FormItem>
            )}
          />

          <div className="flex items-center gap-3 md:col-span-2">
            <Button type="submit" disabled={readOnly || saving}>
              {saving ? "Saving..." : "Save connection"}
            </Button>
            <div className="flex flex-col items-start gap-1">
              <Button
                type="button"
                variant="outline"
                onClick={onTest}
                disabled={testing || hasMissingEnv || !testPermission}
              >
                {testing ? "Testing..." : "Test connection"}
              </Button>
              {hasMissingEnv && (
                <p className="text-xs text-muted-foreground">
                  Missing env: {missingEnvKeys.join(", ")}
                </p>
              )}
              {!testPermission && (
                <p className="text-xs text-muted-foreground">Admin access required</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Saving requires owner/admin access.</p>
          </div>
        </form>
      </Form>

      <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Latest status</p>
        <p className="mt-1">
          {currentTestedAt
            ? `Last tested: ${new Date(currentTestedAt).toLocaleString()}`
            : "Never tested"}
        </p>
        <p className="mt-1">
          Result: {currentTestResult ? <span className="text-foreground">{currentTestResult}</span> : "--"}
        </p>
      </div>
    </div>
  );
}
