"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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

const schema = z.object({
  phoneNumberId: z.string().min(6, "Phone number ID is required"),
  wabaId: z.string().optional(),
  accessToken: z.string().min(8, "Access token is required"),
  displayName: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  canEdit: boolean;
  initialPhoneNumberId?: string | null;
  initialWabaId?: string | null;
  initialDisplayName?: string | null;
  status?: string | null;
  lastTestedAt?: string | null;
  lastTestResult?: string | null;
  tokenSet?: boolean;
};

export function WhatsappConnectionForm({
  workspaceId,
  canEdit,
  initialDisplayName,
  initialPhoneNumberId,
  initialWabaId,
  status,
  lastTestedAt,
  lastTestResult,
  tokenSet,
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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phoneNumberId: initialPhoneNumberId ?? "",
      wabaId: initialWabaId ?? "",
      displayName: initialDisplayName ?? "",
      accessToken: "",
    },
  });

  const readOnly = !canEdit;

  async function onSubmit(values: FormValues) {
    if (readOnly) return;
    setSaving(true);
    try {
      const res = await fetch("/api/meta/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          phoneNumberId: values.phoneNumberId.trim(),
          wabaId: values.wabaId?.trim() || null,
          displayName: values.displayName?.trim() || null,
          accessToken: values.accessToken.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.reason || data?.error || "Failed to save connection");
      }
      setCurrentStatus(data?.status ?? "active");
      setHasToken(Boolean(data?.tokenSet ?? true));
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
        description: "Phone number ID and WhatsApp token saved.",
      });
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
    if (readOnly) return;
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
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Secret token"
                    disabled={readOnly || saving}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-3 md:col-span-2">
            <Button type="submit" disabled={readOnly || saving}>
              {saving ? "Saving..." : "Save connection"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onTest}
              disabled={readOnly || testing}
            >
              {testing ? "Testing..." : "Test connection"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Only owners/admins can save or test the token.
            </p>
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
          Result: {currentTestResult ? <span className="text-foreground">{currentTestResult}</span> : "—"}
        </p>
      </div>
    </div>
  );
}
