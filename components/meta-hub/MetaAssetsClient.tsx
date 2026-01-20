"use client";

import { useCallback, useEffect, useState } from "react";
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
type Waba = { id?: string; name?: string };
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
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [wabas, setWabas] = useState<Waba[]>([]);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [businessId, setBusinessId] = useState<string>("");
  const [wabaId, setWabaId] = useState<string>(initialWabaId);
  const [loading, setLoading] = useState<string | null>(null);

  const fetchBusinesses = useCallback(
    async (opts?: { silent?: boolean }) => {
      setLoading("businesses");
      try {
        const res = await fetch(`/api/meta/assets/businesses?workspaceId=${workspaceId}`);
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.error) throw new Error(data?.reason || data?.error || "Failed to load businesses");
        const list = (data.data || []) as Business[];
        setBusinesses(list);
        if (list.length === 1 && list[0]?.id) {
          setBusinessId(list[0].id);
        }
        if (!opts?.silent) toast({ title: "Businesses loaded" });
      } catch (err) {
        toast({ title: "Error", description: err instanceof Error ? err.message : "Unknown", variant: "destructive" });
      } finally {
        setLoading(null);
      }
    },
    [toast, workspaceId]
  );

  const fetchWabas = useCallback(
    async (opts?: { silent?: boolean; businessOverride?: string }) => {
      const targetBusinessId = opts?.businessOverride ?? businessId;
      if (!targetBusinessId) {
        toast({ title: "Select a business", variant: "destructive" });
        return;
      }
      setLoading("wabas");
      try {
        const res = await fetch(
          `/api/meta/assets/wabas?workspaceId=${workspaceId}&businessId=${targetBusinessId}`
        );
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.error) throw new Error(data?.reason || data?.error || "Failed to load WABA");
        const list = (data.data || []) as Waba[];
        setWabas(list);
        if (list.length === 1 && list[0]?.id) {
          setWabaId(list[0].id);
        }
        if (!opts?.silent) toast({ title: "WABAs loaded" });
      } catch (err) {
        toast({ title: "Error", description: err instanceof Error ? err.message : "Unknown", variant: "destructive" });
      } finally {
        setLoading(null);
      }
    },
    [businessId, toast, workspaceId]
  );

  const fetchPhones = useCallback(
    async (opts?: { silent?: boolean; wabaOverride?: string }) => {
      const targetWabaId = opts?.wabaOverride ?? wabaId;
      if (!targetWabaId) {
        toast({ title: "Select a WABA", variant: "destructive" });
        return;
      }
      setLoading("phones");
      try {
        const res = await fetch(
          `/api/meta/assets/phone-numbers?workspaceId=${workspaceId}&wabaId=${targetWabaId}`
        );
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.error) throw new Error(data?.reason || data?.error || "Failed to load phone numbers");
        setPhones((data.data || []) as Phone[]);
        if (!opts?.silent) toast({ title: "Phones loaded" });
      } catch (err) {
        toast({ title: "Error", description: err instanceof Error ? err.message : "Unknown", variant: "destructive" });
      } finally {
        setLoading(null);
      }
    },
    [toast, wabaId, workspaceId]
  );

  useEffect(() => {
    fetchBusinesses({ silent: true });
  }, [fetchBusinesses]);

  useEffect(() => {
    if (!businessId) return;
    fetchWabas({ silent: true, businessOverride: businessId });
  }, [businessId, fetchWabas]);

  useEffect(() => {
    if (!wabaId) return;
    fetchPhones({ silent: true, wabaOverride: wabaId });
  }, [fetchPhones, wabaId]);

  return (
    <div className="space-y-6 text-[#f5f5dc]">
      <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70">
        <CardHeader>
          <CardTitle>Business Assets (server-side Graph)</CardTitle>
          <CardDescription className="text-[#f5f5dc]/60">
            Uses business_management to list businesses, WABAs, and phone numbers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="sm:flex-1">
              <Label>Business</Label>
              <select
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                disabled={!canEdit || loading === "businesses"}
                className="mt-1 w-full rounded-md border border-[#d4af37]/30 bg-[#050a18] p-2 text-[#f5f5dc] disabled:opacity-60"
              >
                <option value="">Choose business</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id ?? ""}>
                    {b.name || b.id}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[#f5f5dc]/60">Auto-selects when only one business exists.</p>
            </div>
            <Button onClick={() => fetchBusinesses()} disabled={!canEdit || loading === "businesses"}>
              {loading === "businesses" ? "Loading..." : "Refresh"}
            </Button>
          </div>

          <div className="rounded-lg border border-[#d4af37]/20 bg-[#050a18]/60 p-3">
            <p className="text-xs text-[#f5f5dc]/70">Known phone</p>
            <p className="text-sm font-semibold font-mono">{displayName || phoneNumberId || "-"}</p>
          </div>

          <Separator className="bg-[#d4af37]/20" />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="sm:flex-1">
              <Label>WABA</Label>
              <select
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                disabled={!canEdit || loading === "wabas"}
                className="mt-1 w-full rounded-md border border-[#d4af37]/30 bg-[#050a18] p-2 text-[#f5f5dc] disabled:opacity-60"
              >
                <option value="">Choose WABA</option>
                {wabas.map((w) => (
                  <option key={w.id} value={w.id ?? ""}>
                    {w.name || w.id}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[#f5f5dc]/60">Loaded from owned_whatsapp_business_accounts.</p>
            </div>
            <Button onClick={() => fetchWabas()} disabled={!canEdit || loading === "wabas"}>
              {loading === "wabas" ? "Loading..." : "Refresh WABAs"}
            </Button>
            <Button onClick={() => fetchPhones()} disabled={!canEdit || loading === "phones"}>
              {loading === "phones" ? "Loading..." : "Refresh Phones"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[#d4af37]/30 bg-[#0a1229]/70">
        <CardHeader>
          <CardTitle>Businesses</CardTitle>
          <CardDescription className="text-[#f5f5dc]/60">Results from /me/businesses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[#f5f5dc]/70">ID</TableHead>
                <TableHead className="text-[#f5f5dc]/70">Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-[#f5f5dc]/50">
                    No businesses loaded.
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
          <CardTitle>WABAs</CardTitle>
          <CardDescription className="text-[#f5f5dc]/60">From business owned_whatsapp_business_accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[#f5f5dc]/70">ID</TableHead>
                <TableHead className="text-[#f5f5dc]/70">Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wabas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-[#f5f5dc]/50">
                    No WABAs loaded.
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
          <CardTitle>Phone Numbers</CardTitle>
          <CardDescription className="text-[#f5f5dc]/60">From WABA phone_numbers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[#f5f5dc]/70">ID</TableHead>
                <TableHead className="text-[#f5f5dc]/70">Number</TableHead>
                <TableHead className="text-[#f5f5dc]/70">Verified Name</TableHead>
                <TableHead className="text-[#f5f5dc]/70">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-[#f5f5dc]/50">
                    No phone numbers loaded.
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
