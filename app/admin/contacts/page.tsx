"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Contact = {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  last_seen_at: string | null;
};

type DuplicateContact = {
  id: string;
  name: string;
  phone: string;
  phone_norm: string | null;
};

type DuplicateGroup = {
  phone_norm: string;
  contacts: DuplicateContact[];
};

export default function ContactsPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mergeEnabled, setMergeEnabled] = useState(false);
  const [dupGroups, setDupGroups] = useState<DuplicateGroup[]>([]);
  const [dupLoading, setDupLoading] = useState(false);
  const [dupError, setDupError] = useState<string | null>(null);
  const [mergePlans, setMergePlans] = useState<
    Record<string, { primaryId: string; duplicateIds: string[] }>
  >({});
  const [mergeBusyKey, setMergeBusyKey] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/contacts", { cache: "no-store" });
        const js = await res.json();
        if (!res.ok) throw new Error(js?.error || "Gagal load contacts");
        if (!dead) setItems(js.items || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error";
        if (!dead) setError(message);
      } finally {
        if (!dead) setLoading(false);
      }
    }
    run();
    return () => {
      dead = true;
    };
  }, []);

  useEffect(() => {
    let dead = false;
    async function loadMergeFlag() {
      try {
        const res = await fetch("/api/admin/crm/merge-enabled", { cache: "no-store" });
        const js = (await res.json().catch(() => ({}))) as { enabled?: boolean };
        if (!res.ok) return;
        if (!dead) setMergeEnabled(Boolean(js.enabled));
      } catch {
        // ignore
      }
    }
    loadMergeFlag();
    return () => {
      dead = true;
    };
  }, []);

  async function loadDuplicates() {
    setDupLoading(true);
    setDupError(null);
    try {
      const res = await fetch("/api/admin/crm/duplicates", { cache: "no-store" });
      const js = (await res.json().catch(() => ({}))) as {
        groups?: DuplicateGroup[];
        error?: string;
      };
      if (!res.ok) {
        const errMsg = typeof js.error === "string" ? js.error : "Gagal load duplicates";
        throw new Error(errMsg);
      }
      const groups = js.groups ?? [];
      setDupGroups(groups);
      const nextPlans: Record<string, { primaryId: string; duplicateIds: string[] }> = {};
      groups.forEach((group) => {
        const primaryId = group.contacts[0]?.id ?? "";
        const duplicateIds = group.contacts
          .slice(1)
          .map((c) => c.id)
          .filter(Boolean);
        if (primaryId) {
          nextPlans[group.phone_norm] = { primaryId, duplicateIds };
        }
      });
      setMergePlans(nextPlans);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setDupError(msg);
    } finally {
      setDupLoading(false);
    }
  }

  useEffect(() => {
    if (!mergeEnabled) return;
    loadDuplicates();
  }, [mergeEnabled]);

  function setPrimary(groupKey: string, contactId: string) {
    setMergePlans((prev) => {
      const group = dupGroups.find((g) => g.phone_norm === groupKey);
      const allIds = group?.contacts.map((c) => c.id) ?? [];
      const nextDuplicates = allIds.filter((id) => id && id !== contactId);
      return { ...prev, [groupKey]: { primaryId: contactId, duplicateIds: nextDuplicates } };
    });
  }

  function toggleDuplicate(groupKey: string, contactId: string) {
    setMergePlans((prev) => {
      const current = prev[groupKey] ?? { primaryId: "", duplicateIds: [] };
      const set = new Set(current.duplicateIds);
      if (set.has(contactId)) set.delete(contactId);
      else set.add(contactId);
      return { ...prev, [groupKey]: { ...current, duplicateIds: Array.from(set) } };
    });
  }

  async function mergeGroup(groupKey: string) {
    const plan = mergePlans[groupKey];
    if (!plan?.primaryId || plan.duplicateIds.length === 0) {
      setDupError("Pilih primary dan minimal 1 duplicate.");
      return;
    }
    const confirmMsg = `Merge ${plan.duplicateIds.length} contact into primary? Tindakan ini akan soft-delete duplicates.`;
    if (!window.confirm(confirmMsg)) return;

    setMergeBusyKey(groupKey);
    setDupError(null);
    try {
      const res = await fetch("/api/admin/crm/contacts/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary_contact_id: plan.primaryId,
          duplicate_contact_ids: plan.duplicateIds,
        }),
      });
      const js = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        const errMsg = typeof js.error === "string" ? js.error : "Gagal merge";
        throw new Error(errMsg);
      }
      await loadDuplicates();
      await (async () => {
        setLoading(true);
        setError(null);
        try {
          const resContacts = await fetch("/api/admin/contacts", { cache: "no-store" });
          const jsContacts = await resContacts.json();
          if (!resContacts.ok) throw new Error(jsContacts?.error || "Gagal load contacts");
          setItems(jsContacts.items || []);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Error";
          setError(message);
        } finally {
          setLoading(false);
        }
      })();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setDupError(msg);
    } finally {
      setMergeBusyKey(null);
    }
  }

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter((c) => {
      const hay = `${c.name} ${c.phone} ${(c.tags || []).join(" ")}`.toLowerCase();
      return !qq || hay.includes(qq);
    });
  }, [q, items]);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Contacts</div>
          <div className="text-sm text-slate-400">CRM mini — data dari Supabase</div>
        </div>
        <Link
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
          href="/admin/inbox"
        >
          ← Inbox
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-950/40">
        <div className="border-b border-slate-800 p-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama/nomor/tag…"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-700"
          />
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr className="border-b border-slate-800">
                <th className="p-3">Nama</th>
                <th className="p-3">Nomor</th>
                <th className="p-3">Tags</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td className="p-6 text-slate-400" colSpan={3}>
                    Loading…
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((c) => (
                  <tr key={c.id} className="border-b border-slate-900 hover:bg-slate-900/30">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-slate-300">{c.phone}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.tags || []).map((t) => (
                          <span
                            key={t}
                            className="text-[11px] px-2 py-1 rounded-full border border-slate-800 text-slate-300"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td className="p-6 text-slate-400" colSpan={3}>
                    Tidak ada hasil.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 text-xs text-slate-500">
          Next: custom fields, dedup & merge, blacklist/whitelist.
        </div>
      </div>

      {mergeEnabled && (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40">
          <div className="border-b border-slate-800 p-3">
            <div className="text-sm font-semibold">Possible duplicates</div>
            <div className="text-xs text-slate-400">
              Merge is experimental. Use carefully.
            </div>
          </div>

          <div className="p-3">
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={loadDuplicates}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
                disabled={dupLoading}
              >
                {dupLoading ? "Loading..." : "Refresh duplicates"}
              </button>
              {dupError && <div className="text-xs text-rose-300">{dupError}</div>}
            </div>

            {dupLoading && (
              <div className="text-sm text-slate-400">Loading duplicates...</div>
            )}

            {!dupLoading && dupGroups.length === 0 && (
              <div className="text-sm text-slate-400">Tidak ada duplicate terdeteksi.</div>
            )}

            {!dupLoading && dupGroups.length > 0 && (
              <div className="space-y-4">
                {dupGroups.map((group) => {
                  const plan = mergePlans[group.phone_norm];
                  return (
                    <div
                      key={group.phone_norm}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                          phone_norm: {group.phone_norm}
                        </div>
                        <button
                          onClick={() => mergeGroup(group.phone_norm)}
                          className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-900"
                          disabled={mergeBusyKey === group.phone_norm}
                        >
                          {mergeBusyKey === group.phone_norm ? "Merging..." : "Merge"}
                        </button>
                      </div>

                      <div className="space-y-2">
                        {group.contacts.map((contact) => {
                          const isPrimary = plan?.primaryId === contact.id;
                          const isDuplicate = plan?.duplicateIds?.includes(contact.id);
                          return (
                            <div
                              key={contact.id}
                              className="flex items-center gap-3 text-sm"
                            >
                              <input
                                type="radio"
                                name={`primary_${group.phone_norm}`}
                                checked={isPrimary}
                                onChange={() => setPrimary(group.phone_norm, contact.id)}
                              />
                              <input
                                type="checkbox"
                                checked={Boolean(isDuplicate)}
                                disabled={isPrimary}
                                onChange={() => toggleDuplicate(group.phone_norm, contact.id)}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{contact.name}</div>
                                <div className="text-xs text-slate-400">
                                  {contact.phone || "-"}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
