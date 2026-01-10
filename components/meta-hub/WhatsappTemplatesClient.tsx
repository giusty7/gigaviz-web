"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type TemplateRow = {
  id: string;
  name: string;
  language: string | null;
  status: string | null;
  category: string | null;
  quality_score: string | null;
  rejection_reason: string | null;
  phone_number_id: string | null;
  body?: string | null;
  header?: string | null;
  footer?: string | null;
  buttons?: unknown;
  meta_payload?: unknown;
  meta_response?: unknown;
  last_synced_at?: string | null;
  updated_at?: string | null;
};

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  canEdit: boolean;
  templates: TemplateRow[];
  sandboxEnabled: boolean;
  whitelist: string[];
};

type ComponentBlock = {
  type?: string;
  text?: string;
};

type TemplatePieces = {
  header?: string | null;
  body?: string | null;
  footer?: string | null;
  buttons?: unknown;
};

function pickComponents(tpl: TemplateRow): TemplatePieces {
  const fromPayload = (() => {
    const meta = (tpl.meta_payload as { components?: unknown } | null)?.components;
    if (!Array.isArray(meta)) return null;
    const findText = (type: string) =>
      (meta.find((c: ComponentBlock) => c?.type === type) as ComponentBlock | undefined)?.text;
    const btns = meta.filter((c: ComponentBlock) => c?.type === "BUTTONS");
    return {
      header: findText("HEADER") ?? null,
      body: findText("BODY") ?? null,
      footer: findText("FOOTER") ?? null,
      buttons: btns.length ? btns : tpl.buttons,
    };
  })();

  return {
    header: fromPayload?.header ?? tpl.header ?? null,
    body: fromPayload?.body ?? tpl.body ?? null,
    footer: fromPayload?.footer ?? tpl.footer ?? null,
    buttons: fromPayload?.buttons ?? tpl.buttons ?? null,
  };
}

function extractVariables(tpl: TemplateRow): number {
  const pieces = pickComponents(tpl);
  const text = pieces.body ?? "";
  const matches = Array.from(text.matchAll(/{{\d+}}/g));
  return Math.max(matches.length, 0);
}

function renderTemplatePreview(tpl: TemplateRow, vars: string[]) {
  const pieces = pickComponents(tpl);
  const base = pieces.body ?? "";
  if (!base) return "Tidak ada konten body.";
  let rendered = base;
  vars.forEach((value, idx) => {
    const placeholder = new RegExp(`{{${idx + 1}}}`, "g");
    rendered = rendered.replace(placeholder, value || `{{${idx + 1}}}`);
  });
  const header = pieces.header ? `*${pieces.header}*\n` : "";
  const footer = pieces.footer ? `\n${pieces.footer}` : "";
  return `${header}${rendered}${footer}`;
}

export function WhatsappTemplatesClient({
  workspaceId,
  workspaceSlug,
  canEdit,
  templates,
  sandboxEnabled: initialSandbox,
  whitelist: initialWhitelist,
}: Props) {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [templateList, setTemplateList] = useState<TemplateRow[]>(templates ?? []);
  const [sandboxEnabled, setSandboxEnabled] = useState(initialSandbox);
  const [whitelist, setWhitelist] = useState(initialWhitelist.join(", "));
  const [savingSettings, setSavingSettings] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      templateList.filter((tpl) =>
        `${tpl.name} ${tpl.language} ${tpl.status ?? ""}`.toLowerCase().includes(search.toLowerCase())
      ),
    [templateList, search]
  );

  const [selected, setSelected] = useState<TemplateRow | null>(filtered[0] ?? null);
  useEffect(() => {
    if (filtered.length === 0) {
      setSelected(null);
      return;
    }
    if (!selected || !filtered.find((tpl) => tpl.name === selected.name && tpl.language === selected.language)) {
      setSelected(filtered[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  const variableCount = useMemo(() => extractVariables(selected ?? ({} as TemplateRow)), [selected]);
  const [variables, setVariables] = useState<string[]>([]);
  useEffect(() => {
    setVariables((prev) => {
      const target = Math.max(variableCount, 1);
      if (prev.length === target) return prev;
      return Array.from({ length: target }, (_, idx) => prev[idx] ?? "");
    });
  }, [variableCount]);
  const [toPhone, setToPhone] = useState(initialWhitelist[0] ?? "");

  const statusBadge = (status: string | null | undefined) => {
    const normalized = (status ?? "").toUpperCase();
    if (normalized === "APPROVED") return "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40";
    if (normalized === "REJECTED") return "bg-rose-500/15 text-rose-200 border border-rose-500/40";
    return "bg-amber-500/15 text-amber-100 border border-amber-500/40";
  };

  const qualityBadge = (score: string | null | undefined) => {
    if (!score) return "bg-muted text-foreground";
    if (score.toLowerCase() === "green") return "bg-emerald-500/20 text-emerald-100";
    if (score.toLowerCase() === "yellow") return "bg-amber-500/20 text-amber-100";
    return "bg-rose-500/20 text-rose-100";
  };

  async function fetchTemplates() {
    setLoading(true);
    setErrorText(null);
    try {
      const res = await fetch(
        `/api/meta/whatsapp/templates?workspaceSlug=${encodeURIComponent(workspaceSlug)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || data?.code || "Gagal memuat template");
      }
      setTemplateList(data.templates ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memuat template";
      setErrorText(msg);
      toast({
        title: "Gagal memuat templates",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  async function handleSync() {
    if (!canEdit) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/meta/whatsapp/templates/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok === false) {
        const code = data?.code ? `(${data.code}) ` : "";
        const msg = data?.message || data?.reason || "Sync gagal";
        throw new Error(`${code}${msg}`);
      }
      toast({
        title: "Sync selesai",
        description: `Inserted ${data?.inserted ?? 0}, updated ${data?.updated ?? 0}`,
      });
      await fetchTemplates();
    } catch (err) {
      toast({
        title: "Sync gagal",
        description: err instanceof Error ? err.message : "Gagal sync template",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  }

  async function handleSendTest() {
    if (!selected) return;
    setSending(true);
    try {
      const res = await fetch("/api/meta/whatsapp/templates/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          templateName: selected.name,
          language: selected.language ?? "id",
          toPhone,
          variables,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.reason || data?.error || "Gagal kirim pesan");
      }
      toast({
        title: "Pesan terkirim",
        description: data?.messageId ? `Message ID: ${data.messageId}` : "Berhasil mengirim tes.",
      });
    } catch (err) {
      toast({
        title: "Kirim tes gagal",
        description: err instanceof Error ? err.message : "Tidak dapat mengirim pesan",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  async function handleSaveSettings() {
    if (!canEdit) return;
    setSavingSettings(true);
    try {
      const parsed = whitelist
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean);
      const res = await fetch("/api/meta/whatsapp/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          whitelist: parsed,
          sandboxEnabled,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.reason || data?.error || "Gagal simpan whitelist");
      }
      toast({
        title: "Pengaturan tersimpan",
        description: "Whitelist dan sandbox diperbarui.",
      });
    } catch (err) {
      toast({
        title: "Gagal simpan",
        description: err instanceof Error ? err.message : "Tidak dapat menyimpan pengaturan",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">Templates</CardTitle>
            <p className="text-xs text-muted-foreground">
              Sinkronkan template WA dari Meta.{" "}
              {selected?.last_synced_at
                ? `Last sync: ${new Date(selected.last_synced_at).toLocaleString()}`
                : "Belum pernah sync"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Cari template..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-40 bg-background"
            />
            <Button size="sm" variant="outline" onClick={fetchTemplates} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
            <Button size="sm" onClick={handleSync} disabled={!canEdit || syncing}>
              {syncing ? "Syncing..." : "Sync now"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {errorText ? (
            <div className="p-4 text-sm text-amber-200">Error: {errorText}</div>
          ) : null}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Lang</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quality</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tpl) => {
                  const active = selected?.id === tpl.id;
                  return (
                    <TableRow
                      key={tpl.id}
                      className={cn(
                        "cursor-pointer hover:bg-gigaviz-surface",
                        active ? "bg-gigaviz-surface/80" : ""
                      )}
                      onClick={() => setSelected(tpl)}
                    >
                      <TableCell className="font-semibold text-foreground">{tpl.name}</TableCell>
                      <TableCell className="text-muted-foreground">{tpl.language ?? "-"}</TableCell>
                      <TableCell>
                        <Badge className={statusBadge(tpl.status)}>
                          {(tpl.status ?? "UNKNOWN").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={qualityBadge(tpl.quality_score)}>
                          {tpl.quality_score ?? "n/a"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Tidak ada template. Hubungkan WhatsApp di{" "}
                      <a
                        href={`/app/${workspaceSlug}/meta-hub/connections`}
                        className="text-gigaviz-gold underline"
                      >
                        Connections
                      </a>
                      .
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Preview & Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusBadge(selected.status)}>
                    {(selected.status ?? "UNKNOWN").toUpperCase()}
                  </Badge>
                  {selected.category ? (
                    <Badge variant="outline" className="border-border bg-gigaviz-surface">
                      {selected.category}
                    </Badge>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    Last sync:{" "}
                    {selected.last_synced_at
                      ? new Date(selected.last_synced_at).toLocaleString()
                      : "Belum pernah"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Variable tester</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {variables.map((val, idx) => (
                      <div key={idx} className="space-y-1">
                        <Label htmlFor={`var-${idx}`}>{`{{${idx + 1}}}`}</Label>
                        <Input
                          id={`var-${idx}`}
                          value={val}
                          onChange={(e) => {
                            const next = [...variables];
                            next[idx] = e.target.value;
                            setVariables(next);
                          }}
                          placeholder={`Nilai untuk {{${idx + 1}}}`}
                          className="bg-background"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Preview</p>
                  <div className="rounded-xl border border-border bg-background p-3 text-sm text-foreground">
                    {renderTemplatePreview(selected, variables)}
                  </div>
                  {selected.rejection_reason ? (
                    <p className="text-xs text-rose-200">
                      Rejection: {selected.rejection_reason}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Kirim pesan tes</p>
                  <div className="space-y-1">
                    <Label htmlFor="toPhone">Tujuan (whitelist)</Label>
                    <Input
                      id="toPhone"
                      value={toPhone}
                      onChange={(e) => setToPhone(e.target.value)}
                      placeholder="62xxx"
                      className="bg-background"
                    />
                  </div>
                  <Button onClick={handleSendTest} disabled={sending || !canEdit}>
                    {sending ? "Mengirim..." : "Kirim tes"}
                  </Button>
                  {!canEdit ? (
                    <p className="text-xs text-muted-foreground">
                      Hanya owner/admin yang dapat mengirim pesan tes.
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Pilih template untuk melihat preview.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Sandbox & Whitelist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="sandbox">Sandbox aktif</Label>
              <input
                id="sandbox"
                type="checkbox"
                className="h-4 w-4 accent-gigaviz-gold"
                checked={sandboxEnabled}
                disabled={!canEdit}
                onChange={(e) => setSandboxEnabled(e.target.checked)}
              />
              <p className="text-xs text-muted-foreground">
                Jika aktif, kirim tes hanya ke nomor whitelist.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="whitelist">Whitelist (comma-separated)</Label>
              <Textarea
                id="whitelist"
                value={whitelist}
                onChange={(e) => setWhitelist(e.target.value)}
                className="min-h-[80px] bg-background"
                placeholder="62xxx, 62yyy"
                disabled={!canEdit}
              />
            </div>
            <Button onClick={handleSaveSettings} disabled={!canEdit || savingSettings}>
              {savingSettings ? "Menyimpan..." : "Simpan pengaturan"}
            </Button>
            {!canEdit ? (
              <p className="text-xs text-muted-foreground">
                Hanya owner/admin yang dapat mengubah pengaturan sandbox.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
