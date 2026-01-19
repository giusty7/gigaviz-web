"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type BusinessInfo = {
  id: string | null;
  name: string | null;
  verification_status: string | null;
};

type WabaRow = {
  id: string;
  name: string;
  account_review_status: string | null;
};

type PhoneRow = {
  id: string;
  display_phone_number: string;
  verified_name: string;
  code_verification_status: string | null;
};

type TemplateRow = {
  id: string;
  name: string;
  language?: string | null;
  status?: string | null;
};

type ContactRow = {
  id: string;
  name: string;
  phone: string;
};

type AuditRow = {
  id: string;
  action: string;
  ok: boolean;
  error: string | null;
  created_at: string;
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID");
}

export default function MetaConnectPage() {
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [wabas, setWabas] = useState<WabaRow[]>([]);
  const [selectedWaba, setSelectedWaba] = useState<string>("");
  const [phones, setPhones] = useState<PhoneRow[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [syncInfo, setSyncInfo] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [sendingEnabled, setSendingEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");

  const approvedTemplates = useMemo(
    () => templates.filter((t) => (t.status || "").toUpperCase() === "APPROVED"),
    [templates]
  );

  const loadAudit = useCallback(async () => {
    const res = await fetch("/api/admin/meta/audit?limit=20", { cache: "no-store" });
    const js = (await res.json().catch(() => ({}))) as { items?: AuditRow[] };
    if (res.ok) setAudit(js.items ?? []);
  }, []);

  async function verifyConfig() {
    setBusy("verify");
    setError(null);
    try {
      const res = await fetch("/api/admin/meta/connect/verify", { method: "POST" });
      const js = (await res.json().catch(() => ({}))) as { business?: BusinessInfo; error?: string };
      if (!res.ok) throw new Error(js.error || "Failed to verify config");
      setBusiness(js.business ?? null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setBusy(null);
      loadAudit();
    }
  }

  async function loadWabas() {
    setBusy("wabas");
    setError(null);
    try {
      const res = await fetch("/api/admin/meta/connect/wabas", { cache: "no-store" });
      const js = (await res.json().catch(() => ({}))) as { items?: WabaRow[]; error?: string };
      if (!res.ok) throw new Error(js.error || "Failed to load WABAs");
      setWabas(js.items ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setBusy(null);
      loadAudit();
    }
  }

  const loadPhones = useCallback(async (wabaId: string) => {
    setBusy("phones");
    setError(null);
    try {
      const res = await fetch(`/api/admin/meta/connect/phones?waba_id=${wabaId}`, {
        cache: "no-store",
      });
      const js = (await res.json().catch(() => ({}))) as { items?: PhoneRow[]; error?: string };
      if (!res.ok) throw new Error(js.error || "Failed to load phone numbers");
      setPhones(js.items ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setBusy(null);
      loadAudit();
    }
  }, [loadAudit]);

  const loadTemplates = useCallback(async () => {
    const res = await fetch("/api/admin/wa/templates", { cache: "no-store" });
    const js = (await res.json().catch(() => ({}))) as {
      items?: TemplateRow[];
    };
    if (res.ok) {
      setTemplates(js.items ?? []);
    }
  }, []);

  const loadMetaSettings = useCallback(async () => {
    const res = await fetch("/api/admin/meta/events?limit=1", { cache: "no-store" });
    const js = (await res.json().catch(() => ({}))) as { sendingEnabled?: boolean };
    if (res.ok) {
      setSendingEnabled(Boolean(js.sendingEnabled));
    }
  }, []);

  const loadContacts = useCallback(async () => {
    const res = await fetch("/api/admin/meta/connect/contacts", { cache: "no-store" });
    const js = (await res.json().catch(() => ({}))) as { items?: ContactRow[] };
    if (res.ok) setContacts(js.items ?? []);
  }, []);

  async function syncTemplates() {
    if (!selectedWaba) {
      setError("Select a WABA first.");
      return;
    }
    setBusy("sync");
    setError(null);
    setSyncInfo(null);
    try {
      const res = await fetch("/api/admin/meta/connect/sync-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wabaId: selectedWaba }),
      });
      const js = (await res.json().catch(() => ({}))) as {
        total?: number;
        approved?: number;
        updated?: number;
        inserted?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(js.error || "Failed to sync templates");
      setSyncInfo(
        `Total ${js.total ?? 0}, approved ${js.approved ?? 0}, updated ${js.updated ?? 0}, inserted ${js.inserted ?? 0}`
      );
      await loadTemplates();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setBusy(null);
      loadAudit();
    }
  }

  async function sendTestTemplate() {
    if (!selectedContact || !selectedTemplate) {
      setError("Select a contact and template.");
      return;
    }
    setBusy("send_test");
    setError(null);
    try {
      const template = approvedTemplates.find((t) => t.name === selectedTemplate);
      const language = template?.language || "id";
      const res = await fetch("/api/admin/meta/connect/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedContact,
          templateName: selectedTemplate,
          language,
          phoneNumberId: selectedPhone || undefined,
        }),
      });
      const js = (await res.json().catch(() => ({}))) as { error?: string; status?: string };
      if (!res.ok) throw new Error(js.error || "Failed to send template");
      setSyncInfo(js.status ? `Send test: ${js.status}` : "Send test ok");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setBusy(null);
      loadAudit();
    }
  }

  async function testManageAppSolution() {
    setBusy("test_app");
    setError(null);
    try {
      const res = await fetch("/api/admin/meta/test/manage-app-solution", { method: "POST" });
      const js = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(js.error || "Test failed");
      setSyncInfo("manage_app_solution OK");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setBusy(null);
      loadAudit();
    }
  }

  async function testManageEvents() {
    if (!testPhone.trim()) {
      setError("Isi phone untuk test events.");
      return;
    }
    setBusy("test_events");
    setError(null);
    try {
      const res = await fetch("/api/admin/meta/test/manage-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneE164: testPhone }),
      });
      const js = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(js.error || "Test failed");
      setSyncInfo("manage_events OK");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setBusy(null);
      loadAudit();
    }
  }

  useEffect(() => {
    loadTemplates();
    loadContacts();
    loadMetaSettings();
    loadAudit();
  }, [loadTemplates, loadContacts, loadMetaSettings, loadAudit]);

  useEffect(() => {
    if (wabas.length > 0 && !selectedWaba) {
      setSelectedWaba(wabas[0].id);
    }
  }, [wabas, selectedWaba]);

  useEffect(() => {
    if (selectedWaba) loadPhones(selectedWaba);
  }, [selectedWaba, loadPhones]);

  useEffect(() => {
    if (approvedTemplates.length > 0 && !selectedTemplate) {
      setSelectedTemplate(approvedTemplates[0].name);
    }
  }, [approvedTemplates, selectedTemplate]);

  useEffect(() => {
    if (contacts.length > 0 && !selectedContact) {
      setSelectedContact(contacts[0].id);
    }
  }, [contacts, selectedContact]);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6">
      <div className="mb-4">
        <div className="text-xl font-semibold">Meta Connect</div>
        <div className="text-sm text-slate-400">
          Events are recorded for measurement/reporting. Sending to Meta is disabled by default
          (dry-run).
        </div>
        {sendingEnabled && (
          <div className="mt-2 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
            Sending enabled
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {syncInfo && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {syncInfo}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-sm font-semibold">Configuration</div>
            <div className="mt-2 text-xs text-slate-400">
              Verify your Meta Business connection and list owned WABAs.
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={verifyConfig}
                disabled={busy === "verify"}
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-900"
              >
                {busy === "verify" ? "Verifying..." : "Verify Config"}
              </button>
              <button
                onClick={loadWabas}
                disabled={busy === "wabas"}
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-900"
              >
                {busy === "wabas" ? "Loading..." : "Load WABAs"}
              </button>
            </div>
            {business && (
              <div className="mt-3 text-xs text-slate-300">
                Business: {business.name || "-"} ({business.verification_status || "unknown"})
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-sm font-semibold">WABA & Phone Numbers</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={selectedWaba}
                onChange={(e) => setSelectedWaba(e.target.value)}
                title="Select WhatsApp Business Account"
                className="min-w-[240px] rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
              >
                {wabas.length === 0 && <option value="">No WABA loaded</option>}
                {wabas.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name || w.id} {w.account_review_status ? `(${w.account_review_status})` : ""}
                  </option>
                ))}
              </select>
              <select
                value={selectedPhone}
                onChange={(e) => setSelectedPhone(e.target.value)}
                title="Select phone number"
                className="min-w-[240px] rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
              >
                {phones.length === 0 && <option value="">No phone numbers</option>}
                {phones.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_phone_number || p.id} {p.verified_name ? `(${p.verified_name})` : ""}
                  </option>
                ))}
              </select>
              <button
                onClick={() => selectedWaba && loadPhones(selectedWaba)}
                disabled={busy === "phones" || !selectedWaba}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-900"
              >
                {busy === "phones" ? "Loading..." : "Refresh Phones"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-sm font-semibold">Templates</div>
            <div className="mt-2 text-xs text-slate-400">
              Sync approved templates and send a test message.
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={syncTemplates}
                disabled={busy === "sync"}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-900"
              >
                {busy === "sync" ? "Syncing..." : "Sync Templates"}
              </button>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                title="Select template"
                className="min-w-[220px] rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
              >
                {approvedTemplates.length === 0 && <option value="">No approved templates</option>}
                {approvedTemplates.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} {t.language ? `(${t.language})` : ""}
                  </option>
                ))}
              </select>
              <select
                value={selectedContact}
                onChange={(e) => setSelectedContact(e.target.value)}
                title="Select contact"
                className="min-w-[220px] rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
              >
                {contacts.length === 0 && <option value="">No opted-in contacts</option>}
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.phone}
                  </option>
                ))}
              </select>
              <button
                onClick={sendTestTemplate}
                disabled={busy === "send_test"}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-900"
              >
                {busy === "send_test" ? "Sending..." : "Send Test Template"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-sm font-semibold">Permission Tests</div>
            <div className="mt-2 text-xs text-slate-400">
              Use these buttons during app review screen recording.
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={testManageAppSolution}
                disabled={busy === "test_app"}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-900"
              >
                {busy === "test_app" ? "Testing..." : "Test manage_app_solution"}
              </button>
              <input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Phone (E.164)"
                className="min-w-[200px] flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
              />
              <button
                onClick={testManageEvents}
                disabled={busy === "test_events"}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-900"
              >
                {busy === "test_events" ? "Testing..." : "Test manage_events"}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40">
            <div className="border-b border-slate-800 p-3 text-sm font-semibold">
              Meta Audit Log
            </div>
            <div className="p-3 space-y-2 text-xs text-slate-400">
              {audit.length === 0 && <div>No audit records.</div>}
              {audit.map((row) => (
                <div key={row.id} className="rounded-lg border border-slate-900 p-2">
                  <div className="flex items-center justify-between">
                    <span>{row.action}</span>
                    <span className={row.ok ? "text-emerald-300" : "text-rose-300"}>
                      {row.ok ? "ok" : "error"}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">{fmtTime(row.created_at)}</div>
                  {row.error && <div className="mt-1 text-rose-300">{row.error}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
