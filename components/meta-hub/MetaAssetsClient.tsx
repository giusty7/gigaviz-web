"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

type Business = { id?: string; name?: string };
type Waba = { id?: string; name?: string; currency?: string; timezone_id?: string };
type Phone = {
  id?: string;
  display_phone_number?: string;
  verified_name?: string;
  status?: string;
  quality_rating?: string;
};

type Props = {
  workspaceId: string;
  canEdit: boolean;
  wabaId: string;
  phoneNumberId: string;
  displayName: string;
};

export function MetaAssetsClient({ workspaceId, canEdit, wabaId: initialWabaId, phoneNumberId, displayName }: Props) {
  const { toast } = useToast();
  const t = useTranslations("metaHubUI.metaAssets");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [wabas, setWabas] = useState<Waba[]>([]);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [businessId, setBusinessId] = useState<string>("");
  const [wabaId, setWabaId] = useState<string>(initialWabaId);
  const [loading, setLoading] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const bootstrapRef = useRef(false);

  /* ═══════════════════════════════════════════════════════════════════
     BOOTSTRAP: Use known WABA ID to resolve business + WABA details
     in one shot, bypassing the me/businesses cascade that fails with
     WhatsApp-only tokens.
     ═══════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (bootstrapRef.current || !initialWabaId) return;
    bootstrapRef.current = true;

    async function bootstrap() {
      setLoading("bootstrap");
      try {
        // 1. Fetch WABA info + owner business from the known WABA ID
        const wabaRes = await fetch(
          `/api/meta/assets/waba-info?workspaceId=${workspaceId}&wabaId=${initialWabaId}`
        );
        const wabaData = await wabaRes.json().catch(() => null);

        if (wabaRes.ok && wabaData) {
          // Set WABA data
          if (wabaData.waba) {
            setWabas([wabaData.waba]);
            setWabaId(wabaData.waba.id || initialWabaId);
          }

          // Set business data from the WABA's owner
          if (wabaData.business?.id) {
            setBusinesses([wabaData.business]);
            setBusinessId(wabaData.business.id);
          }
        }

        // 2. Also try me/businesses in parallel (may work if token has business_management)
        const bizRes = await fetch(
          `/api/meta/assets/businesses?workspaceId=${workspaceId}`
        );
        const bizData = await bizRes.json().catch(() => null);
        if (bizRes.ok && bizData?.data?.length > 0) {
          setBusinesses((prev) => {
            const existing = new Set(prev.map((b) => b.id));
            const merged = [...prev];
            for (const b of bizData.data as Business[]) {
              if (b.id && !existing.has(b.id)) {
                merged.push(b);
                existing.add(b.id);
              }
            }
            return merged;
          });
          // Auto-select if only one and none selected yet
          if (bizData.data.length === 1 && bizData.data[0]?.id) {
            setBusinessId((prev) => prev || bizData.data[0].id);
          }
        }

        // 3. Fetch phones using known WABA ID
        const phonesRes = await fetch(
          `/api/meta/assets/phone-numbers?workspaceId=${workspaceId}&wabaId=${initialWabaId}`
        );
        const phonesData = await phonesRes.json().catch(() => null);
        if (phonesRes.ok && phonesData?.data) {
          setPhones(phonesData.data as Phone[]);
        }
      } catch {
        // Bootstrap is best-effort; individual refreshes still work
      } finally {
        setLoading(null);
        setBootstrapped(true);
      }
    }

    bootstrap();
  }, [initialWabaId, workspaceId]);

  /* ═══════════════════════════════════════════════════════════════════
     FALLBACK: If no WABA ID known, try me/businesses on mount
     ═══════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (initialWabaId || bootstrapRef.current) return;
    bootstrapRef.current = true;
    fetchBusinesses({ silent: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBusinesses = useCallback(
    async (opts?: { silent?: boolean }) => {
      setLoading("businesses");
      try {
        const res = await fetch(`/api/meta/assets/businesses?workspaceId=${workspaceId}`);
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.error) throw new Error(data?.reason || data?.error || t("errorLoadBusinesses"));
        const list = (data.data || []) as Business[];
        setBusinesses(list);
        if (list.length === 1 && list[0]?.id) {
          setBusinessId(list[0].id);
        }
        if (!opts?.silent) toast({ title: t("businessesLoaded") });
      } catch (err) {
        if (!opts?.silent) {
          toast({ title: t("errorTitle"), description: err instanceof Error ? err.message : t("unknown"), variant: "destructive" });
        }
      } finally {
        setLoading(null);
      }
    },
    [t, toast, workspaceId]
  );

  const fetchWabas = useCallback(
    async (opts?: { silent?: boolean; businessOverride?: string }) => {
      const targetBusinessId = opts?.businessOverride ?? businessId;
      if (!targetBusinessId) {
        if (!opts?.silent) toast({ title: t("selectBusiness"), variant: "destructive" });
        return;
      }
      setLoading("wabas");
      try {
        const res = await fetch(
          `/api/meta/assets/wabas?workspaceId=${workspaceId}&businessId=${targetBusinessId}`
        );
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.error) throw new Error(data?.reason || data?.error || t("errorLoadWaba"));
        const list = (data.data || []) as Waba[];
        setWabas((prev) => {
          // Merge with bootstrap data to avoid losing WABA details
          const existing = new Map(prev.map((w) => [w.id, w]));
          for (const w of list) {
            if (w.id) existing.set(w.id, { ...existing.get(w.id), ...w });
          }
          return Array.from(existing.values());
        });
        if (list.length === 1 && list[0]?.id) {
          setWabaId(list[0].id);
        }
        if (!opts?.silent) toast({ title: t("wabasLoaded") });
      } catch (err) {
        if (!opts?.silent) {
          toast({ title: t("errorTitle"), description: err instanceof Error ? err.message : t("unknown"), variant: "destructive" });
        }
      } finally {
        setLoading(null);
      }
    },
    [businessId, t, toast, workspaceId]
  );

  const fetchPhones = useCallback(
    async (opts?: { silent?: boolean; wabaOverride?: string }) => {
      const targetWabaId = opts?.wabaOverride ?? wabaId;
      if (!targetWabaId) {
        if (!opts?.silent) toast({ title: t("selectWaba"), variant: "destructive" });
        return;
      }
      setLoading("phones");
      try {
        const res = await fetch(
          `/api/meta/assets/phone-numbers?workspaceId=${workspaceId}&wabaId=${targetWabaId}`
        );
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.error) throw new Error(data?.reason || data?.error || t("errorLoadPhones"));
        setPhones((data.data || []) as Phone[]);
        if (!opts?.silent) toast({ title: t("phonesLoaded") });
      } catch (err) {
        if (!opts?.silent) {
          toast({ title: t("errorTitle"), description: err instanceof Error ? err.message : t("unknown"), variant: "destructive" });
        }
      } finally {
        setLoading(null);
      }
    },
    [t, toast, wabaId, workspaceId]
  );

  // When user changes business dropdown, fetch WABAs for that business
  useEffect(() => {
    if (!bootstrapped || !businessId) return;
    fetchWabas({ silent: true, businessOverride: businessId });
  }, [businessId, fetchWabas, bootstrapped]);

  // When user changes WABA dropdown, fetch phones for that WABA
  useEffect(() => {
    if (!bootstrapped || !wabaId) return;
    fetchPhones({ silent: true, wabaOverride: wabaId });
  }, [wabaId, fetchPhones, bootstrapped]);

  const isBootstrapping = loading === "bootstrap";

  return (
    <div className="space-y-6 text-[#f5f5dc]">
      {/* Loading overlay during bootstrap */}
      {isBootstrapping && (
        <Card className="border border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
            <p className="text-sm text-emerald-300">{t("loadingAssets")}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription className="text-[#f5f5dc]/60">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="sm:flex-1">
              <Label>{t("business")}</Label>
              <select
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                disabled={!canEdit || loading === "businesses" || isBootstrapping}
                className="mt-1 w-full rounded-md border border-[#d4af37]/30 bg-[#050a18] p-2 text-[#f5f5dc] disabled:opacity-60"
              >
                <option value="">{t("chooseBusiness")}</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id ?? ""}>
                    {b.name || b.id}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[#f5f5dc]/60">{t("autoSelectHint")}</p>
            </div>
            <Button onClick={() => fetchBusinesses()} disabled={!canEdit || loading === "businesses" || isBootstrapping}>
              {loading === "businesses" ? t("loading") : t("refresh")}
            </Button>
          </div>

          <div className="rounded-lg border border-[#d4af37]/20 bg-[#050a18]/60 p-3">
            <p className="text-xs text-[#f5f5dc]/70">{t("knownPhone")}</p>
            <p className="text-sm font-semibold font-mono">{displayName || phoneNumberId || "-"}</p>
          </div>

          <Separator className="bg-[#d4af37]/20" />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="sm:flex-1">
              <Label>{t("waba")}</Label>
              <select
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                disabled={!canEdit || loading === "wabas" || isBootstrapping}
                className="mt-1 w-full rounded-md border border-[#d4af37]/30 bg-[#050a18] p-2 text-[#f5f5dc] disabled:opacity-60"
              >
                <option value="">{t("chooseWaba")}</option>
                {wabas.map((w) => (
                  <option key={w.id} value={w.id ?? ""}>
                    {w.name || w.id}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[#f5f5dc]/60">{t("wabaHint")}</p>
            </div>
            <Button onClick={() => fetchWabas()} disabled={!canEdit || loading === "wabas" || isBootstrapping}>
              {loading === "wabas" ? t("loading") : t("refreshWabas")}
            </Button>
            <Button onClick={() => fetchPhones()} disabled={!canEdit || loading === "phones" || isBootstrapping}>
              {loading === "phones" ? t("loading") : t("refreshPhones")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70">
        <CardHeader>
          <CardTitle>{t("businesses")}</CardTitle>
          <CardDescription className="text-[#f5f5dc]/60">{t("businessesDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[#f5f5dc]/70">{t("idHeader")}</TableHead>
                <TableHead className="text-[#f5f5dc]/70">{t("nameHeader")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-[#f5f5dc]/50">
                    {isBootstrapping ? t("loading") : t("noBusinesses")}
                  </TableCell>
                </TableRow>
              ) : (
                businesses.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs text-[#f5f5dc]/80">{b.id}</TableCell>
                    <TableCell>{b.name}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70">
        <CardHeader>
          <CardTitle>{t("wabas")}</CardTitle>
          <CardDescription className="text-[#f5f5dc]/60">{t("wabasDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[#f5f5dc]/70">{t("idHeader")}</TableHead>
                <TableHead className="text-[#f5f5dc]/70">{t("nameHeader")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wabas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-[#f5f5dc]/50">
                    {isBootstrapping ? t("loading") : t("noWabas")}
                  </TableCell>
                </TableRow>
              ) : (
                wabas.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-mono text-xs text-[#f5f5dc]/80">{w.id}</TableCell>
                    <TableCell>{w.name}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70">
        <CardHeader>
          <CardTitle>{t("phoneNumbers")}</CardTitle>
          <CardDescription className="text-[#f5f5dc]/60">{t("phoneNumbersDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[#f5f5dc]/70">{t("idHeader")}</TableHead>
                <TableHead className="text-[#f5f5dc]/70">{t("numberHeader")}</TableHead>
                <TableHead className="text-[#f5f5dc]/70">{t("verifiedNameHeader")}</TableHead>
                <TableHead className="text-[#f5f5dc]/70">{t("statusHeader")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-[#f5f5dc]/50">
                    {isBootstrapping ? t("loading") : t("noPhones")}
                  </TableCell>
                </TableRow>
              ) : (
                phones.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs text-[#f5f5dc]/80">{p.id}</TableCell>
                    <TableCell className="font-mono">{p.display_phone_number}</TableCell>
                    <TableCell>{p.verified_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[#d4af37]/30 text-[#d4af37]">
                        {p.status || "-"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
