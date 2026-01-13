"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type CampaignCounts = {
  total: number;
  queued: number;
  processing: number;
  sent: number;
  failed: number;
};

type CampaignRow = {
  id: string;
  name: string;
  template_name: string;
  language: string;
  status: string;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  counts?: CampaignCounts;
};

type CampaignDetail = {
  campaign: CampaignRow;
  counts: CampaignCounts;
  recentErrors: Array<{ to_phone?: string | null; error_reason?: string | null; attempted_at?: string | null }>;
};

type TemplateRow = {
  id: string;
  name: string;
  language?: string | null;
  status?: string | null;
};

function fmtTime(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("en-US");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function BlastPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [details, setDetails] = useState<CampaignDetail | null>(null);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [name, setName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [language, setLanguage] = useState("id");
  const [creating, setCreating] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);

  const approvedTemplates = useMemo(
    () => templates.filter((t) => (t.status || "").toUpperCase() === "APPROVED"),
    [templates]
  );

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch("/api/admin/wa/templates", { cache: "no-store" });
      const js = (await res.json().catch(() => ({}))) as { items?: TemplateRow[]; error?: string };
      if (!res.ok) {
        throw new Error(js.error || "Gagal load templates");
      }
      setTemplates(js.items ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/blast/status", { cache: "no-store" });
      const js = (await res.json().catch(() => ({}))) as { campaigns?: CampaignRow[]; error?: string };
      if (!res.ok) {
        throw new Error(js.error || "Gagal load campaigns");
      }
      const rows = js.campaigns ?? [];
      setCampaigns(rows);
      if (!selectedCampaignId && rows.length > 0) {
        setSelectedCampaignId(rows[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setCampaignsLoading(false);
    }
  }, [selectedCampaignId]);

  const loadCampaignDetail = useCallback(async (campaignId: string) => {
    try {
      const res = await fetch(`/api/admin/blast/status?campaign_id=${campaignId}`, {
        cache: "no-store",
      });
      const js = (await res.json().catch(() => ({}))) as
        | CampaignDetail
        | { error?: string };
      if (!res.ok || "error" in js) {
        const errMsg = "error" in js && js.error ? js.error : "Gagal load status";
        throw new Error(errMsg);
      }
      setDetails(js as CampaignDetail);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
    loadCampaigns();
  }, [loadTemplates, loadCampaigns]);

  useEffect(() => {
    if (!selectedCampaignId) return;
    loadCampaignDetail(selectedCampaignId);
  }, [selectedCampaignId, loadCampaignDetail]);

  useEffect(() => {
    if (!templateName && approvedTemplates.length > 0) {
      const first = approvedTemplates[0];
      setTemplateName(first.name);
      setLanguage(first.language || "id");
    }
  }, [approvedTemplates, templateName]);

  const selectedTemplate = useMemo(
    () => approvedTemplates.find((t) => t.name === templateName) ?? null,
    [approvedTemplates, templateName]
  );

  useEffect(() => {
    if (selectedTemplate?.language) {
      setLanguage(selectedTemplate.language);
    }
  }, [selectedTemplate?.language]);

  async function createCampaign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/blast/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, templateName, language }),
      });
      const js = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(js.error || "Gagal membuat campaign");
      }
      setName("");
      await loadCampaigns();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setCreating(false);
    }
  }

  async function runCampaign(campaignId: string) {
    setRunningId(campaignId);
    setError(null);
    try {
      while (true) {
        const res = await fetch(`/api/admin/blast/run?campaign_id=${campaignId}`, {
          method: "POST",
        });
        const js = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          queuedRemaining?: number;
          dryRun?: boolean;
          error?: string;
        };
        if (!res.ok || js.ok === false) {
          throw new Error(js.error || "Gagal menjalankan campaign");
        }

        await loadCampaigns();
        await loadCampaignDetail(campaignId);

        if (js.dryRun || (js.queuedRemaining ?? 0) === 0) break;
        await sleep(1000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    } finally {
      setRunningId(null);
    }
  }

  const progress = useMemo(() => {
    const counts = details?.counts;
    if (!counts || counts.total === 0) return 0;
    return Math.round(((counts.sent + counts.failed) / counts.total) * 100);
  }, [details?.counts]);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6">
      <div className="mb-4">
        <div className="text-xl font-semibold">Blast / Campaigns</div>
        <div className="text-sm text-slate-400">
          Send WhatsApp templates only to contacts that have opted in.
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <form
            onSubmit={createCampaign}
            className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
          >
            <div className="text-sm font-semibold">New Campaign</div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs text-slate-400">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  placeholder="Promo Januari"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Template (APPROVED)</label>
                <select
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  disabled={templatesLoading || approvedTemplates.length === 0}
                  required
                >
                  {approvedTemplates.length === 0 && (
                    <option value="">
                      {templatesLoading ? "Loading templates..." : "No approved templates"}
                    </option>
                  )}
                  {approvedTemplates.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} {t.language ? `(${t.language})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Language</label>
                <input
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  placeholder="id"
                  required
                />
              </div>
              <button
                disabled={creating || approvedTemplates.length === 0}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create Campaign"}
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-400">
            Note: contacts with <span className="text-slate-200">opted_out=true</span> will
            be blocked from all future campaigns.
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40">
            <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold">
              Campaigns
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-400">
                  <tr className="border-b border-slate-800">
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Template</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Progress</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignsLoading && (
                    <tr>
                      <td className="p-4 text-slate-400" colSpan={5}>
                        Loading...
                      </td>
                    </tr>
                  )}
                  {!campaignsLoading &&
                    campaigns.map((c) => {
                      const counts = c.counts || {
                        total: 0,
                        queued: 0,
                        processing: 0,
                        sent: 0,
                        failed: 0,
                      };
                      const pct = counts.total
                        ? Math.round(((counts.sent + counts.failed) / counts.total) * 100)
                        : 0;
                      return (
                        <tr
                          key={c.id}
                          className="border-b border-slate-900/50 hover:bg-slate-900/40"
                          onClick={() => setSelectedCampaignId(c.id)}
                        >
                          <td className="p-3 font-medium">{c.name}</td>
                          <td className="p-3">{c.template_name}</td>
                          <td className="p-3">{c.status}</td>
                          <td className="p-3">
                            {counts.sent + counts.failed}/{counts.total} ({pct}%)
                          </td>
                          <td className="p-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                runCampaign(c.id);
                              }}
                              disabled={runningId === c.id}
                              className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-900 disabled:opacity-60"
                            >
                              {runningId === c.id ? "Running..." : "Start/Resume"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {!campaignsLoading && campaigns.length === 0 && (
                    <tr>
                      <td className="p-4 text-slate-400" colSpan={5}>
                        No campaigns yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="mb-2 text-sm font-semibold">Progress</div>
            <div className="text-xs text-slate-400">
              {details?.campaign.name || "Select a campaign from the list."}
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-900">
              <div
                className="h-2 rounded-full bg-emerald-500/80"
                style={{ width: `${progress}%` }}
              />
            </div>
            {details && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div>Total: {details.counts.total}</div>
                <div>Queued: {details.counts.queued}</div>
                <div>Processing: {details.counts.processing}</div>
                <div>Sent: {details.counts.sent}</div>
                <div>Failed: {details.counts.failed}</div>
                <div>Started: {fmtTime(details.campaign.started_at)}</div>
                <div>Finished: {fmtTime(details.campaign.finished_at)}</div>
              </div>
            )}
            {details && details.recentErrors.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-300">Latest errors</div>
                <div className="mt-2 space-y-1 text-xs text-rose-300">
                  {details.recentErrors.map((e, idx) => (
                    <div key={`${e.to_phone}-${idx}`}>
                      {e.to_phone || "-"}: {e.error_reason || "unknown"} ({fmtTime(e.attempted_at)})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
