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
  phoneNumberId: z.string().min(6, "Phone number ID wajib diisi"),
  wabaId: z.string().optional(),
  accessToken: z.string().min(8, "Access token wajib diisi"),
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
        throw new Error(data?.reason || data?.error || "Gagal menyimpan koneksi");
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
        title: "Koneksi tersimpan",
        description: "Phone number ID dan token WhatsApp berhasil disimpan.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan koneksi";
      toast({
        title: "Gagal menyimpan",
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
        title: "Lengkapi Phone Number ID",
        description: "Isi Phone Number ID sebelum melakukan tes koneksi.",
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
        throw new Error(data?.result || data?.reason || "Tes koneksi gagal");
      }
      setCurrentStatus(data?.status ?? "active");
      setCurrentTestedAt(data?.lastTestedAt ?? null);
      setCurrentTestResult(data?.result ?? null);
      toast({
        title: "Tes berhasil",
        description: data?.result === "validated" ? "Token valid dan terhubung." : data?.result,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tes koneksi gagal";
      setCurrentStatus("inactive");
      setCurrentTestResult(message);
      setCurrentTestedAt(new Date().toISOString());
      toast({
        title: "Tes gagal",
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
            Simpan phone number ID dan access token secara aman. Token tidak akan ditampilkan
            kembali.
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
              Token belum diset
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
                    placeholder="Masukkan phone number ID"
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
                <FormLabel>WABA ID (opsional)</FormLabel>
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
                <FormLabel>Display name (opsional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nama tampil"
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
                    placeholder="Token rahasia"
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
              {saving ? "Menyimpan..." : "Simpan koneksi"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onTest}
              disabled={readOnly || testing}
            >
              {testing ? "Menguji..." : "Tes koneksi"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Hanya owner/admin yang dapat menyimpan atau menguji token.
            </p>
          </div>
        </form>
      </Form>

      <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Status terakhir</p>
        <p className="mt-1">
          {currentTestedAt
            ? `Terakhir dites: ${new Date(currentTestedAt).toLocaleString()}`
            : "Belum pernah dites"}
        </p>
        <p className="mt-1">
          Hasil: {currentTestResult ? <span className="text-foreground">{currentTestResult}</span> : "—"}
        </p>
      </div>
    </div>
  );
}
