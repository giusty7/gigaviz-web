
"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const NAME_REGEX = /^[a-z0-9_]{3,512}$/;

type TemplateRow = {
  id: string;
  name: string;
  language: string | null;
  status: string | null;
  category: string | null;
  quality_score: string | null;
  rejection_reason: string | null;
  phone_number_id: string | null;
  meta_template_id?: string | null;
  body?: string | null;
  header?: string | null;
  footer?: string | null;
  buttons?: unknown;
  meta_payload?: unknown;
  meta_response?: unknown;
  last_synced_at?: string | null;
  updated_at?: string | null;
};

type Connection = {
  id: string;
  phone_number_id: string | null;
  waba_id: string | null;
  display_name: string | null;
  status: string | null;
};

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  canEdit: boolean;
  templates: TemplateRow[];
  connections: Connection[];
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

type WizardButton = {
  id: string;
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
  text: string;
  url?: string;
  phone_number?: string;
};

type WizardState = {
  name: string;
  language: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  headerEnabled: boolean;
  headerText: string;
  bodyText: string;
  footerText: string;
  buttons: WizardButton[];
  headerExample: string;
  bodyExamples: string[];
};

type WizardPreset = {
  key: string;
  name: string;
  description: string;
  data: Partial<WizardState>;
};

const TEMPLATE_LIBRARY: WizardPreset[] = [
  {
    key: "order_update",
    name: "order_update",
    description: "Update status pesanan dengan ringkas.",
    data: {
      category: "UTILITY",
      language: "id",
      bodyText:
        "Halo {{1}}, status pesanan {{2}} kamu sekarang {{3}}. Cek detail di dashboard kamu.",
      footerText: "Butuh bantuan? Balas pesan ini.",
    },
  },
  {
    key: "payment_confirmed",
    name: "payment_confirmed",
    description: "Konfirmasi pembayaran sukses.",
    data: {
      category: "UTILITY",
      language: "id",
      headerEnabled: true,
      headerText: "Pembayaran Berhasil",
      bodyText: "Hi {{1}}, pembayaran untuk invoice {{2}} sudah diterima. Total {{3}}.",
      footerText: "Terima kasih telah menggunakan Gigaviz.",
    },
  },
  {
    key: "appointment_reminder",
    name: "appointment_reminder",
    description: "Pengingat jadwal atau meeting.",
    data: {
      category: "UTILITY",
      language: "id",
      bodyText:
        "Halo {{1}}, ini pengingat jadwal {{2}} pada {{3}}. Mohon konfirmasi kehadiran.",
    },
  },
  {
    key: "otp_reset",
    name: "otp_reset",
    description: "Kode OTP untuk verifikasi.",
    data: {
      category: "AUTHENTICATION",
      language: "id",
      bodyText: "Kode verifikasi kamu adalah {{1}}. Jangan bagikan ke siapa pun.",
    },
  },
  {
    key: "promo_update",
    name: "promo_update",
    description: "Info promo singkat untuk pelanggan.",
    data: {
      category: "MARKETING",
      language: "id",
      headerEnabled: true,
      headerText: "Promo Baru",
      bodyText: "Hai {{1}}, dapatkan promo {{2}} berlaku sampai {{3}}.",
      footerText: "Ketik STOP untuk berhenti.",
    },
  },
];

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getConnectionLabel(conn: Connection) {
  if (conn.display_name) return `${conn.display_name} (${conn.phone_number_id ?? ""})`;
  return conn.phone_number_id ?? "Connection";
}

function extractVariableCount(text: string) {
  const matches = Array.from(text.matchAll(/{{(\d+)}}/g));
  if (matches.length === 0) return 0;
  const nums = matches.map((match) => Number(match[1]));
  return Math.max(0, ...nums);
}

function getDefaultWizardState(overrides?: Partial<WizardState>): WizardState {
  return {
    name: "",
    language: "id",
    category: "UTILITY",
    headerEnabled: false,
    headerText: "",
    bodyText: "",
    footerText: "",
    buttons: [],
    headerExample: "",
    bodyExamples: [],
    ...overrides,
  };
}

function normalizeTemplateName(input: string) {
  const cleaned = input.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_");
  return cleaned.startsWith("_") ? cleaned.slice(1) : cleaned;
}

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

function normalizeButtons(input: unknown): WizardButton[] {
  if (!input) return [];
  let raw: unknown[] = [];

  if (Array.isArray(input)) {
    const block = input.find((item) => typeof item === "object" && item !== null && "buttons" in item);
    if (block && typeof block === "object" && block !== null) {
      raw = Array.isArray((block as { buttons?: unknown }).buttons)
        ? ((block as { buttons?: unknown[] }).buttons as unknown[])
        : [];
    } else {
      raw = input;
    }
  } else if (typeof input === "object" && input !== null && "buttons" in input) {
    raw = Array.isArray((input as { buttons?: unknown }).buttons)
      ? ((input as { buttons?: unknown[] }).buttons as unknown[])
      : [];
  }

  return raw
    .map((item) => {
      const button = item as { type?: string; text?: string; url?: string; phone_number?: string };
      if (!button?.type) return null;
      const type = button.type.toUpperCase();
      if (type !== "QUICK_REPLY" && type !== "URL" && type !== "PHONE_NUMBER") return null;
      return {
        id: makeId(),
        type,
        text: button.text ?? "",
        url: button.url,
        phone_number: button.phone_number,
      } as WizardButton;
    })
    .filter(Boolean) as WizardButton[];
}

function extractVariables(tpl: TemplateRow): number {
  const pieces = pickComponents(tpl);
  const text = pieces.body ?? "";
  return extractVariableCount(text);
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

function renderWizardPreview(state: WizardState, variables: string[]) {
  const base = state.bodyText || "";
  if (!base) return "Belum ada body template.";
  let rendered = base;
  variables.forEach((value, idx) => {
    const placeholder = new RegExp(`{{${idx + 1}}}`, "g");
    rendered = rendered.replace(placeholder, value || `{{${idx + 1}}}`);
  });
  const header = state.headerEnabled && state.headerText ? `*${state.headerText}*\n` : "";
  const footer = state.footerText ? `\n${state.footerText}` : "";
  return `${header}${rendered}${footer}`;
}
export function WhatsappTemplatesClient({
  workspaceId,
  workspaceSlug,
  canEdit,
  templates,
  connections,
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
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const initialConnectionId =
    connections.find((conn) => (conn.status ?? "").toLowerCase() === "active")?.id ??
    connections[0]?.id ??
    "";
  const [connectionId, setConnectionId] = useState(initialConnectionId);
  useEffect(() => {
    if (connections.length === 0) {
      setConnectionId("");
      return;
    }
    if (!connectionId || !connections.some((conn) => conn.id === connectionId)) {
      setConnectionId(connections[0]?.id ?? "");
    }
  }, [connections, connectionId]);
  const activeConnection = connections.find((conn) => conn.id === connectionId) ?? null;
  const canManage = canEdit && Boolean(activeConnection);

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
    if (!selected || !filtered.find((tpl) => tpl.id === selected.id)) {
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

  const [wizardOpen, setWizardOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardMode, setWizardMode] = useState<"create" | "clone" | "library">("create");
  const [wizardState, setWizardState] = useState<WizardState>(() => getDefaultWizardState());
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const bodyVariableCount = useMemo(
    () => extractVariableCount(wizardState.bodyText),
    [wizardState.bodyText]
  );

  useEffect(() => {
    setWizardState((prev) => {
      if (bodyVariableCount === 0 && prev.bodyExamples.length === 0) return prev;
      if (bodyVariableCount === 0) {
        return { ...prev, bodyExamples: [] };
      }
      if (prev.bodyExamples.length === bodyVariableCount) return prev;
      const next = Array.from({ length: bodyVariableCount }, (_, idx) => prev.bodyExamples[idx] ?? "");
      return { ...prev, bodyExamples: next };
    });
  }, [bodyVariableCount]);

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
    if (!activeConnection) {
      setTemplateList([]);
      return [] as TemplateRow[];
    }
    setLoading(true);
    setErrorText(null);
    try {
      const params = new URLSearchParams({ workspaceSlug });
      params.set("connectionId", activeConnection.id);
      const res = await fetch(`/api/meta/whatsapp/templates?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || data?.code || "Gagal memuat template");
      }
      const list = (data.templates ?? []) as TemplateRow[];
      setTemplateList(list);
      return list;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memuat template";
      setErrorText(msg);
      toast({
        title: "Gagal memuat templates",
        description: msg,
        variant: "destructive",
      });
      return [] as TemplateRow[];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, connectionId]);

  async function handleSync() {
    if (!canManage) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/meta/whatsapp/templates/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, connectionId: activeConnection?.id ?? null }),
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

  async function handleRefreshStatus(tpl: TemplateRow) {
    if (!canManage) return;
    const templateId = tpl.meta_template_id ?? tpl.id;
    setRefreshingId(tpl.id);
    try {
      const res = await fetch(`/api/meta/whatsapp/templates/${templateId}/refresh-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceSlug,
          connectionId: activeConnection?.id ?? null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || data?.code || "Refresh gagal");
      }
      const updated = data?.template as TemplateRow | undefined;
      if (updated) {
        setTemplateList((prev) =>
          prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row))
        );
        setSelected((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
      }
      toast({ title: "Status diperbarui", description: `Template ${tpl.name} refreshed.` });
    } catch (err) {
      toast({
        title: "Refresh gagal",
        description: err instanceof Error ? err.message : "Tidak dapat refresh status",
        variant: "destructive",
      });
    } finally {
      setRefreshingId(null);
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
          connectionId: activeConnection?.id ?? undefined,
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

  function openCreateWizard() {
    setWizardMode("create");
    setWizardStep(1);
    setWizardError(null);
    setWizardState(getDefaultWizardState({ language: "id" }));
    setWizardOpen(true);
  }

  function openLibraryDialog() {
    setLibraryOpen(true);
  }

  function openWizardFromPreset(preset: WizardPreset) {
    setWizardMode("library");
    setWizardStep(1);
    setWizardError(null);
    setWizardState(
      getDefaultWizardState({
        ...preset.data,
        name: preset.data.name ?? preset.name,
        language: preset.data.language ?? "id",
        category: preset.data.category ?? "UTILITY",
      })
    );
    setLibraryOpen(false);
    setWizardOpen(true);
  }

  function openCloneWizard(tpl: TemplateRow) {
    const pieces = pickComponents(tpl);
    const normalizedName = normalizeTemplateName(`${tpl.name}_copy` || "template_copy");
    setWizardMode("clone");
    setWizardStep(1);
    setWizardError(null);
    setWizardState(
      getDefaultWizardState({
        name: normalizedName || "template_copy",
        language: tpl.language ?? "id",
        category: (tpl.category as WizardState["category"]) ?? "UTILITY",
        headerEnabled: Boolean(pieces.header),
        headerText: pieces.header ?? "",
        bodyText: pieces.body ?? "",
        footerText: pieces.footer ?? "",
        buttons: normalizeButtons(pieces.buttons),
      })
    );
    setWizardOpen(true);
  }

  function validateWizardStep(step: number) {
    if (step === 1) {
      if (!wizardState.name.trim()) {
        setWizardError("Nama template wajib diisi.");
        return false;
      }
      if (!NAME_REGEX.test(wizardState.name.trim())) {
        setWizardError("Nama harus lowercase + underscore (min 3 karakter).");
        return false;
      }
      if (!wizardState.language.trim()) {
        setWizardError("Language wajib diisi.");
        return false;
      }
      setWizardError(null);
      return true;
    }

    if (step === 2) {
      if (!wizardState.bodyText.trim()) {
        setWizardError("Body template wajib diisi.");
        return false;
      }
      if (wizardState.headerEnabled && !wizardState.headerText.trim()) {
        setWizardError("Header text wajib diisi jika header aktif.");
        return false;
      }
      for (const btn of wizardState.buttons) {
        if (!btn.text.trim()) {
          setWizardError("Semua tombol wajib memiliki label.");
          return false;
        }
        if (btn.type === "URL" && !btn.url?.trim()) {
          setWizardError("URL wajib diisi untuk tombol URL.");
          return false;
        }
        if (btn.type === "PHONE_NUMBER" && !btn.phone_number?.trim()) {
          setWizardError("Nomor telepon wajib diisi untuk tombol phone.");
          return false;
        }
      }
      setWizardError(null);
      return true;
    }

    if (step === 3) {
      if (bodyVariableCount > 0) {
        const hasEmpty = wizardState.bodyExamples.some((value) => !value.trim());
        if (hasEmpty) {
          setWizardError("Isi contoh untuk semua variabel yang terdeteksi.");
          return false;
        }
      }
      setWizardError(null);
      return true;
    }

    return true;
  }

  function nextStep() {
    if (!validateWizardStep(wizardStep)) return;
    setWizardStep((prev) => Math.min(4, prev + 1));
  }

  function prevStep() {
    setWizardError(null);
    setWizardStep((prev) => Math.max(1, prev - 1));
  }

  function appendVariable() {
    setWizardState((prev) => {
      const nextIndex = extractVariableCount(prev.bodyText) + 1;
      const suffix = prev.bodyText.endsWith(" ") || prev.bodyText === "" ? "" : " ";
      return { ...prev, bodyText: `${prev.bodyText}${suffix}{{${nextIndex}}}` };
    });
  }

  function buildCreatePayload() {
    const buttonsPayload = wizardState.buttons.length
      ? wizardState.buttons.map((btn) => ({
          type: btn.type,
          text: btn.text.trim(),
          url: btn.type === "URL" ? btn.url?.trim() : undefined,
          phone_number: btn.type === "PHONE_NUMBER" ? btn.phone_number?.trim() : undefined,
        }))
      : undefined;

    return {
      workspaceSlug,
      connectionId: activeConnection?.id ?? undefined,
      name: wizardState.name.trim(),
      language: wizardState.language.trim(),
      category: wizardState.category,
      components: {
        header:
          wizardState.headerEnabled && wizardState.headerText.trim()
            ? { text: wizardState.headerText.trim() }
            : undefined,
        body: { text: wizardState.bodyText.trim() },
        footer: wizardState.footerText.trim() ? { text: wizardState.footerText.trim() } : undefined,
        buttons: buttonsPayload,
      },
      examples: {
        header: wizardState.headerExample.trim() ? [wizardState.headerExample.trim()] : undefined,
        body: wizardState.bodyExamples.length ? wizardState.bodyExamples : undefined,
      },
    };
  }

  async function handleCreateTemplate() {
    if (!activeConnection) {
      toast({
        title: "Connection belum ada",
        description: "Hubungkan WhatsApp terlebih dahulu di halaman Connections.",
        variant: "destructive",
      });
      return;
    }
    if (!validateWizardStep(3)) return;
    setCreating(true);
    try {
      const payload = buildCreatePayload();
      const res = await fetch("/api/meta/whatsapp/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || data?.reason || "Gagal membuat template");
      }
      toast({
        title: "Template dibuat",
        description: data?.status ? `Status: ${data.status}` : "Berhasil mengirim ke Meta.",
      });
      setWizardOpen(false);
      setWizardStep(1);
      const refreshed = await fetchTemplates();
      const target = refreshed.find(
        (tpl) =>
          tpl.id === data?.template?.id || (tpl.name === payload.name && tpl.language === payload.language)
      );
      if (target) {
        setSelected(target);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Tidak dapat membuat template";
      toast({
        title: "Gagal membuat template",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  const previewVariables = useMemo(() => {
    if (wizardState.bodyExamples.length) return wizardState.bodyExamples;
    if (bodyVariableCount === 0) return [];
    return Array.from({ length: bodyVariableCount }, () => "");
  }, [wizardState.bodyExamples, bodyVariableCount]);
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Templates</CardTitle>
              <p className="text-xs text-muted-foreground">
                Sinkronkan template WA dari Meta.{" "}
                {selected?.last_synced_at
                  ? `Last sync: ${new Date(selected.last_synced_at).toLocaleString()}`
                  : "Belum pernah sync"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {connections.length > 0 ? (
                <div className="min-w-[180px] space-y-1">
                  <Label className="text-xs text-muted-foreground">Connection</Label>
                  <select
                    className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
                    value={connectionId}
                    onChange={(e) => setConnectionId(e.target.value)}
                  >
                    {connections.map((conn) => (
                      <option key={conn.id} value={conn.id}>
                        {getConnectionLabel(conn)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Belum ada connection. Hubungkan WhatsApp di Connections.
                </p>
              )}
              <Input
                placeholder="Cari template..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-40 bg-background"
              />
              <Button size="sm" variant="outline" onClick={fetchTemplates} disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </Button>
              <Button size="sm" onClick={handleSync} disabled={!canManage || syncing}>
                {syncing ? "Syncing..." : "Sync now"}
              </Button>
              <Button size="sm" variant="secondary" onClick={openCreateWizard} disabled={!canManage}>
                Create template
              </Button>
              <Button size="sm" variant="outline" onClick={openLibraryDialog} disabled={!canManage}>
                Clone from library
              </Button>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          {!activeConnection ? (
            <div className="border-b border-border bg-background px-4 py-3 text-sm text-muted-foreground">
              Connection WhatsApp belum dipilih.{" "}
              <a href={`/${workspaceSlug}/meta-hub/connections`} className="text-gigaviz-gold underline">
                Buka Connections
              </a>
              .
            </div>
          ) : null}
          {errorText ? <div className="p-4 text-sm text-amber-200">Error: {errorText}</div> : null}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Lang</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelected(tpl);
                                setDetailsOpen(true);
                              }}
                            >
                              Detail
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRefreshStatus(tpl);
                              }}
                              disabled={!canManage || refreshingId === tpl.id}
                            >
                              {refreshingId === tpl.id ? "Refreshing" : "Refresh"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(event) => {
                                event.stopPropagation();
                                openCloneWizard(tpl);
                              }}
                              disabled={!canManage}
                            >
                              Clone
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Belum ada template. Buat template pertama atau sync dari Meta.
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Preview & Test</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Connection: {activeConnection ? getConnectionLabel(activeConnection) : "Belum ada"}
                </p>
              </div>
              {selected ? (
                <Button size="sm" variant="outline" onClick={() => setDetailsOpen((prev) => !prev)}>
                  {detailsOpen ? "Tutup detail" : "Lihat detail"}
                </Button>
              ) : null}
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
                    <Badge className={qualityBadge(selected.quality_score)}>
                      {selected.quality_score ?? "n/a"}
                    </Badge>
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
                      <p className="text-xs text-rose-200">Rejection: {selected.rejection_reason}</p>
                    ) : null}
                  </div>

                  {detailsOpen ? (
                    <div className="space-y-2 rounded-xl border border-border bg-background p-3 text-sm">
                      <p className="font-semibold text-foreground">Detail template</p>
                      <dl className="grid gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <dt>Template ID</dt>
                          <dd className="text-foreground">{selected.meta_template_id ?? selected.id}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt>Phone Number ID</dt>
                          <dd className="text-foreground">{selected.phone_number_id ?? "-"}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt>Updated</dt>
                          <dd className="text-foreground">
                            {selected.updated_at ? new Date(selected.updated_at).toLocaleString() : "-"}
                          </dd>
                        </div>
                      </dl>
                      {selected.meta_response || selected.meta_payload ? (
                        <details className="rounded-lg border border-border bg-card p-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground">
                            Lihat payload Meta
                          </summary>
                          <pre className="mt-2 whitespace-pre-wrap text-[11px] text-foreground">
                            {JSON.stringify(selected.meta_response ?? selected.meta_payload, null, 2)}
                          </pre>
                        </details>
                      ) : null}
                    </div>
                  ) : null}

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
              <CardTitle className="text-base font-semibold text-foreground">Sandbox & Whitelist</CardTitle>
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
                <p className="text-xs text-muted-foreground">Jika aktif, kirim tes hanya ke nomor whitelist.</p>
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

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-3xl bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {wizardMode === "create"
                ? "Create template"
                : wizardMode === "clone"
                ? "Clone template"
                : "Create from library"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Bangun template baru tanpa meninggalkan halaman ini.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
            <span>Step {wizardStep} / 4</span>
            <span>Connection: {activeConnection ? getConnectionLabel(activeConnection) : "Belum ada"}</span>
          </div>

          {wizardError ? <p className="text-sm text-rose-200">{wizardError}</p> : null}

          {wizardStep === 1 ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="tpl-name">Nama template</Label>
                <Input
                  id="tpl-name"
                  value={wizardState.name}
                  onChange={(e) =>
                    setWizardState({ ...wizardState, name: normalizeTemplateName(e.target.value) })
                  }
                  placeholder="contoh: order_update"
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Gunakan huruf kecil + underscore. Minimal 3 karakter.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label>Category</Label>
                  <select
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={wizardState.category}
                    onChange={(e) =>
                      setWizardState({
                        ...wizardState,
                        category: e.target.value as WizardState["category"],
                      })
                    }
                  >
                    <option value="MARKETING">MARKETING</option>
                    <option value="UTILITY">UTILITY</option>
                    <option value="AUTHENTICATION">AUTHENTICATION</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Language</Label>
                  <Input
                    value={wizardState.language}
                    onChange={(e) => setWizardState({ ...wizardState, language: e.target.value })}
                    className="bg-background"
                    placeholder="id"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Header</Label>
                  <select
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={wizardState.headerEnabled ? "text" : "none"}
                    onChange={(e) =>
                      setWizardState({
                        ...wizardState,
                        headerEnabled: e.target.value === "text",
                      })
                    }
                  >
                    <option value="none">None</option>
                    <option value="text">Text</option>
                  </select>
                </div>
              </div>
            </div>
          ) : null}

          {wizardStep === 2 ? (
            <div className="space-y-4">
              {wizardState.headerEnabled ? (
                <div className="space-y-1">
                  <Label htmlFor="tpl-header">Header text</Label>
                  <Input
                    id="tpl-header"
                    value={wizardState.headerText}
                    onChange={(e) => setWizardState({ ...wizardState, headerText: e.target.value })}
                    className="bg-background"
                  />
                </div>
              ) : null}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tpl-body">Body</Label>
                  <Button type="button" size="sm" variant="outline" onClick={appendVariable}>
                    Tambah {"{{n}}"}
                  </Button>
                </div>
                <Textarea
                  id="tpl-body"
                  value={wizardState.bodyText}
                  onChange={(e) => setWizardState({ ...wizardState, bodyText: e.target.value })}
                  className="min-h-[120px] bg-background"
                  placeholder="Isi pesan utama template..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tpl-footer">Footer (opsional)</Label>
                <Input
                  id="tpl-footer"
                  value={wizardState.footerText}
                  onChange={(e) => setWizardState({ ...wizardState, footerText: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Buttons</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setWizardState((prev) => ({
                        ...prev,
                        buttons: [...prev.buttons, { id: makeId(), type: "QUICK_REPLY", text: "" }],
                      }))
                    }
                  >
                    Tambah tombol
                  </Button>
                </div>
                {wizardState.buttons.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Tidak ada tombol.</p>
                ) : null}
                <div className="space-y-2">
                  {wizardState.buttons.map((btn, idx) => (
                    <div key={btn.id} className="rounded-lg border border-border bg-background p-3">
                      <div className="grid gap-2 md:grid-cols-3">
                        <div className="space-y-1">
                          <Label>Type</Label>
                          <select
                            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm"
                            value={btn.type}
                            onChange={(e) => {
                              const value = e.target.value as WizardButton["type"];
                              setWizardState((prev) => {
                                const next = [...prev.buttons];
                                next[idx] = { ...next[idx], type: value };
                                return { ...prev, buttons: next };
                              });
                            }}
                          >
                            <option value="QUICK_REPLY">Quick Reply</option>
                            <option value="URL">URL</option>
                            <option value="PHONE_NUMBER">Phone</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label>Label</Label>
                          <Input
                            value={btn.text}
                            onChange={(e) => {
                              const value = e.target.value;
                              setWizardState((prev) => {
                                const next = [...prev.buttons];
                                next[idx] = { ...next[idx], text: value };
                                return { ...prev, buttons: next };
                              });
                            }}
                            className="bg-background"
                          />
                        </div>
                        {btn.type === "URL" ? (
                          <div className="space-y-1">
                            <Label>URL</Label>
                            <Input
                              value={btn.url ?? ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setWizardState((prev) => {
                                  const next = [...prev.buttons];
                                  next[idx] = { ...next[idx], url: value };
                                  return { ...prev, buttons: next };
                                });
                              }}
                              className="bg-background"
                            />
                          </div>
                        ) : null}
                        {btn.type === "PHONE_NUMBER" ? (
                          <div className="space-y-1">
                            <Label>Phone</Label>
                            <Input
                              value={btn.phone_number ?? ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setWizardState((prev) => {
                                  const next = [...prev.buttons];
                                  next[idx] = { ...next[idx], phone_number: value };
                                  return { ...prev, buttons: next };
                                });
                              }}
                              className="bg-background"
                            />
                          </div>
                        ) : null}
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setWizardState((prev) => ({
                              ...prev,
                              buttons: prev.buttons.filter((item) => item.id !== btn.id),
                            }))
                          }
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background p-3 text-sm">
                <p className="text-xs font-semibold text-muted-foreground">Preview</p>
                <p className="mt-2 whitespace-pre-wrap text-foreground">
                  {renderWizardPreview(wizardState, previewVariables)}
                </p>
              </div>
            </div>
          ) : null}

          {wizardStep === 3 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Contoh variabel</p>
                {bodyVariableCount === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Tidak ada variabel terdeteksi pada body template.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {wizardState.bodyExamples.map((value, idx) => (
                      <div key={idx} className="space-y-1">
                        <Label>{`Contoh {{${idx + 1}}}`}</Label>
                        <Input
                          value={value}
                          onChange={(e) => {
                            const next = [...wizardState.bodyExamples];
                            next[idx] = e.target.value;
                            setWizardState({ ...wizardState, bodyExamples: next });
                          }}
                          className="bg-background"
                          placeholder={`Nilai untuk {{${idx + 1}}}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {wizardState.headerEnabled ? (
                <div className="space-y-1">
                  <Label>Contoh header (opsional)</Label>
                  <Input
                    value={wizardState.headerExample}
                    onChange={(e) => setWizardState({ ...wizardState, headerExample: e.target.value })}
                    className="bg-background"
                    placeholder="Isi contoh header"
                  />
                </div>
              ) : null}
              <details className="rounded-xl border border-border bg-background p-3 text-xs">
                <summary className="cursor-pointer text-muted-foreground">Lihat payload (preview)</summary>
                <pre className="mt-2 whitespace-pre-wrap text-foreground">
                  {JSON.stringify(buildCreatePayload(), null, 2)}
                </pre>
              </details>
            </div>
          ) : null}

          {wizardStep === 4 ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-background p-3 text-sm">
                <p className="font-semibold text-foreground">Ringkasan</p>
                <p className="text-xs text-muted-foreground">Nama: {wizardState.name}</p>
                <p className="text-xs text-muted-foreground">Category: {wizardState.category}</p>
                <p className="text-xs text-muted-foreground">Language: {wizardState.language}</p>
                <p className="text-xs text-muted-foreground">Buttons: {wizardState.buttons.length}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Setelah dikirim, status template akan mengikuti review Meta.
              </p>
            </div>
          ) : null}

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={prevStep} disabled={wizardStep === 1}>
                Kembali
              </Button>
              <Button type="button" variant="outline" onClick={nextStep} disabled={wizardStep >= 4}>
                Lanjut
              </Button>
            </div>
            <Button
              type="button"
              onClick={handleCreateTemplate}
              disabled={!canManage || wizardStep !== 4 || creating}
            >
              {creating ? "Mengirim..." : "Submit ke Meta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="max-w-2xl bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Clone from library</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Pilih template siap pakai lalu sesuaikan sebelum submit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {TEMPLATE_LIBRARY.map((item) => (
              <div key={item.key} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Button size="sm" onClick={() => openWizardFromPreset(item)}>
                    Gunakan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
