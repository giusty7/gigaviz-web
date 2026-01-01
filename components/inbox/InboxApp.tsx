"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TicketStatus = "open" | "pending" | "solved" | "spam";
type Priority = "low" | "med" | "high" | "urgent";
type Direction = "in" | "out";

type Contact = {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  last_seen_at: string | null;
};

type ConversationRow = {
  id: string;
  contact_id: string;
  assigned_to: string | null;
  ticket_status: TicketStatus;
  priority: Priority;
  unread_count: number;
  last_message_at: string;
  contact: Contact;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  direction: Direction;
  text: string;
  ts: string;
  status: string | null;
};

type NoteRow = {
  id: string;
  conversation_id: string;
  text: string;
  ts: string;
  author: string;
};

type Props = { selectedId?: string };

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function fmtTime(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function badgeColor(x: string) {
  if (x === "open") return "border-emerald-500/30 text-emerald-300 bg-emerald-500/10";
  if (x === "pending") return "border-amber-500/30 text-amber-300 bg-amber-500/10";
  if (x === "solved") return "border-sky-500/30 text-sky-300 bg-sky-500/10";
  if (x === "spam") return "border-rose-500/30 text-rose-300 bg-rose-500/10";

  if (x === "low") return "border-slate-700 text-slate-300 bg-slate-900/30";
  if (x === "med") return "border-sky-500/30 text-sky-300 bg-sky-500/10";
  if (x === "high") return "border-amber-500/30 text-amber-300 bg-amber-500/10";
  if (x === "urgent") return "border-rose-500/30 text-rose-300 bg-rose-500/10";

  return "border-slate-800 text-slate-300 bg-slate-950/40";
}

export default function InboxApp({ selectedId }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("all");
  const [filterAssignee, setFilterAssignee] = useState<string | "all">("all");

  // data
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [composer, setComposer] = useState("");

  // load list
  useEffect(() => {
    let dead = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/inbox/threads", { cache: "no-store" });
        const js = await res.json();
        if (!res.ok) throw new Error(js?.error || "Gagal load threads");
        if (!dead) setConversations(js.items || []);
      } catch (e: any) {
        if (!dead) setError(e.message || "Error");
      } finally {
        if (!dead) setLoading(false);
      }
    }
    run();
    return () => {
      dead = true;
    };
  }, []);

  const convById = useMemo(
    () => Object.fromEntries(conversations.map((c) => [c.id, c])),
    [conversations]
  );

  const agents = useMemo(() => {
    const s = new Set<string>();
    conversations.forEach((c) => {
      if (c.assigned_to) s.add(c.assigned_to);
    });
    // kalau kosong, tetap ada opsi umum
    return Array.from(s).sort();
  }, [conversations]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return conversations
      .slice()
      .sort((a, b) => (a.last_message_at < b.last_message_at ? 1 : -1))
      .filter((t) => {
        const c = t.contact;
        const hay = `${c?.name ?? ""} ${c?.phone ?? ""} ${(c?.tags ?? []).join(" ")}`.toLowerCase();
        const okQ = !qq || hay.includes(qq);
        const okStatus = filterStatus === "all" ? true : t.ticket_status === filterStatus;
        const okAsg =
          filterAssignee === "all" ? true : (t.assigned_to ?? "") === filterAssignee;
        return okQ && okStatus && okAsg;
      });
  }, [q, conversations, filterStatus, filterAssignee]);

  const activeId = useMemo(() => {
    if (selectedId && convById[selectedId]) return selectedId;
    return filtered[0]?.id ?? conversations[0]?.id ?? null;
  }, [selectedId, convById, filtered, conversations]);

  const activeConv = activeId ? convById[activeId] : null;
  const activeContact = activeConv?.contact ?? null;

  // load thread detail
  useEffect(() => {
    let dead = false;
    async function run() {
      if (!activeId) return;
      setLoadingThread(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/inbox/threads/${activeId}`, { cache: "no-store" });
        const js = await res.json();
        if (!res.ok) throw new Error(js?.error || "Gagal load thread");
        if (dead) return;
        setMessages(js.messages || []);
        setNotes(js.notes || []);
      } catch (e: any) {
        if (!dead) setError(e.message || "Error");
      } finally {
        if (!dead) setLoadingThread(false);
      }
    }
    run();
    return () => {
      dead = true;
    };
  }, [activeId]);

  function navigateTo(id: string) {
    router.push(`/admin/inbox/${id}`);
    // clear unread local + persist
    setConversations((prev) => prev.map((t) => (t.id === id ? { ...t, unread_count: 0 } : t)));
    fetch(`/api/admin/inbox/threads/${id}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unread_count: 0 }),
    }).catch(() => {});
  }

  function patchConv(id: string, patch: Partial<ConversationRow>) {
    setConversations((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function setTicketStatus(id: string, st: TicketStatus) {
    patchConv(id, { ticket_status: st } as any);
    await fetch(`/api/admin/inbox/threads/${id}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket_status: st }),
    }).catch(() => {});
  }

  async function setPriority(id: string, p: Priority) {
    patchConv(id, { priority: p } as any);
    await fetch(`/api/admin/inbox/threads/${id}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: p }),
    }).catch(() => {});
  }

  async function setAssignee(id: string, asg?: string) {
    patchConv(id, { assigned_to: asg ?? null } as any);
    await fetch(`/api/admin/inbox/threads/${id}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_to: asg ?? null }),
    }).catch(() => {});
  }

  async function send() {
    if (!activeId) return;
    const text = composer.trim();
    if (!text) return;

    setComposer("");
    const optimistic: MessageRow = {
      id: `tmp_${Math.random().toString(16).slice(2)}`,
      conversation_id: activeId,
      direction: "out",
      text,
      ts: new Date().toISOString(),
      status: "queued",
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/admin/inbox/threads/${activeId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Gagal kirim");

      // replace optimistic with real
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? js.message : m)));
      patchConv(activeId, { last_message_at: js.message.ts } as any);
    } catch (e: any) {
      setError(e.message || "Error");
      // mark failed
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...m, status: "failed" } : m))
      );
    }
  }

  async function addNote() {
    if (!activeId) return;
    const t = prompt("Tulis catatan internal:");
    const text = String(t || "").trim();
    if (!text) return;

    try {
      const res = await fetch(`/api/admin/inbox/threads/${activeId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Gagal tambah note");
      setNotes((prev) => [js.note, ...prev]);
    } catch (e: any) {
      setError(e.message || "Error");
    }
  }

  const activeMessages = useMemo(() => {
    return messages.slice().sort((a, b) => (a.ts < b.ts ? -1 : 1));
  }, [messages]);

  const activeNotes = useMemo(() => {
    return notes.slice().sort((a, b) => (a.ts < b.ts ? 1 : -1));
  }, [notes]);

  return (
    <div className="min-h-[calc(100vh-0px)] w-full">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold tracking-tight">Inbox</div>
            <div className="text-sm text-slate-400">
              Shared Team Inbox (MVP) — data dari Supabase
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
              href="/admin/contacts"
            >
              Contacts
            </Link>
            <span className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300">
              Workspace: Gigaviz
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-12 gap-4">
          {/* LEFT */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40">
              <div className="border-b border-slate-800 p-3">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari nomor/nama/tag…"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-700"
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="all">Semua status</option>
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="solved">Solved</option>
                    <option value="spam">Spam</option>
                  </select>

                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="all">Semua agent</option>
                    {agents.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                    <option value="">(Unassigned)</option>
                  </select>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-auto">
                {loading && (
                  <div className="p-6 text-sm text-slate-400">Loading…</div>
                )}

                {!loading &&
                  filtered.map((t) => {
                    const isActive = t.id === activeId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => navigateTo(t.id)}
                        className={clsx(
                          "w-full text-left px-3 py-3 border-b border-slate-900 hover:bg-slate-900/40",
                          isActive && "bg-slate-900/50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {t.contact?.name ?? "Unknown"}
                            </div>
                            <div className="truncate text-xs text-slate-400">
                              {t.contact?.phone ?? "-"}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={clsx(
                                "text-[11px] px-2 py-1 rounded-full border",
                                badgeColor(t.ticket_status)
                              )}
                            >
                              {t.ticket_status}
                            </span>
                            {t.unread_count > 0 && (
                              <span className="rounded-full bg-emerald-500/20 px-2 py-[2px] text-[11px] text-emerald-300 border border-emerald-500/30">
                                {t.unread_count} new
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                          <span
                            className={clsx(
                              "px-2 py-1 rounded-full border",
                              badgeColor(t.priority)
                            )}
                          >
                            {t.priority}
                          </span>
                          <span>{fmtTime(t.last_message_at)}</span>
                        </div>
                      </button>
                    );
                  })}

                {!loading && filtered.length === 0 && (
                  <div className="p-6 text-sm text-slate-400">
                    Tidak ada hasil. Coba ubah filter/kata kunci.
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* CENTER */}
          <main className="col-span-12 lg:col-span-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40">
              <div className="border-b border-slate-800 p-3">
                {activeConv && activeContact ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-base font-semibold">
                          {activeContact.name}
                        </div>
                        <span
                          className={clsx(
                            "text-[11px] px-2 py-1 rounded-full border",
                            badgeColor(activeConv.ticket_status)
                          )}
                        >
                          {activeConv.ticket_status}
                        </span>
                        <span
                          className={clsx(
                            "text-[11px] px-2 py-1 rounded-full border",
                            badgeColor(activeConv.priority)
                          )}
                        >
                          {activeConv.priority}
                        </span>
                      </div>
                      <div className="truncate text-sm text-slate-400">
                        {activeContact.phone}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(activeContact.tags || []).map((t) => (
                          <span
                            key={t}
                            className="text-[11px] px-2 py-1 rounded-full border border-slate-800 text-slate-300"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <select
                        value={activeConv.assigned_to ?? ""}
                        onChange={(e) => setAssignee(activeConv.id, e.target.value || undefined)}
                        className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                      >
                        <option value="">Unassigned</option>
                        {agents.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <select
                          value={activeConv.ticket_status}
                          onChange={(e) => setTicketStatus(activeConv.id, e.target.value as TicketStatus)}
                          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                        >
                          <option value="open">Open</option>
                          <option value="pending">Pending</option>
                          <option value="solved">Solved</option>
                          <option value="spam">Spam</option>
                        </select>

                        <select
                          value={activeConv.priority}
                          onChange={(e) => setPriority(activeConv.id, e.target.value as Priority)}
                          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                        >
                          <option value="low">low</option>
                          <option value="med">med</option>
                          <option value="high">high</option>
                          <option value="urgent">urgent</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">Pilih percakapan di kiri.</div>
                )}
              </div>

              <div className="h-[52vh] overflow-auto p-3 space-y-3">
                {loadingThread && (
                  <div className="text-sm text-slate-400">Loading chat…</div>
                )}

                {!loadingThread &&
                  activeMessages.map((m) => {
                    const isOut = m.direction === "out";
                    return (
                      <div key={m.id} className={clsx("flex", isOut ? "justify-end" : "justify-start")}>
                        <div
                          className={clsx(
                            "max-w-[85%] rounded-2xl border px-3 py-2",
                            isOut
                              ? "bg-sky-500/10 border-sky-500/30 text-slate-100"
                              : "bg-slate-900/40 border-slate-800 text-slate-100"
                          )}
                        >
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {m.text}
                          </div>
                          <div className="mt-1 flex items-center justify-end gap-2 text-[11px] text-slate-400">
                            <span>{fmtTime(m.ts)}</span>
                            {isOut && (
                              <span className="rounded-full border border-slate-700 px-2 py-[1px]">
                                {m.status ?? "sent"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {!loadingThread && activeMessages.length === 0 && (
                  <div className="text-sm text-slate-400">Belum ada pesan.</div>
                )}
              </div>

              <div className="border-t border-slate-800 p-3">
                <div className="flex gap-2">
                  <input
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    placeholder="Ketik balasan…"
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-700"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                  <button
                    onClick={send}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm hover:bg-slate-800"
                  >
                    Kirim
                  </button>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  *Saat ini: insert ke DB. Poin C nanti: kirim benar via WhatsApp Cloud API.
                </div>
              </div>
            </div>
          </main>

          {/* RIGHT */}
          <section className="col-span-12 lg:col-span-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40">
              <div className="border-b border-slate-800 p-3">
                <div className="text-sm font-semibold">Info & Notes</div>
                <div className="text-xs text-slate-400">Internal (tidak terlihat user)</div>
              </div>

              <div className="p-3 space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="text-xs text-slate-400">Assigned</div>
                  <div className="mt-1 text-sm">{activeConv?.assigned_to ?? "Unassigned"}</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="text-xs text-slate-400">Last seen</div>
                  <div className="mt-1 text-sm">{fmtTime(activeContact?.last_seen_at)}</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold">Notes</div>
                    <button
                      onClick={addNote}
                      className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-900"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {activeNotes.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"
                      >
                        <div className="text-xs text-slate-400 flex items-center justify-between">
                          <span>{n.author}</span>
                          <span>{fmtTime(n.ts)}</span>
                        </div>
                        <div className="mt-1 text-sm">{n.text}</div>
                      </div>
                    ))}

                    {activeNotes.length === 0 && (
                      <div className="text-sm text-slate-400">Belum ada note.</div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Next: snooze, attachment viewer, SLA timer, routing/round-robin.
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 text-xs text-slate-500">
          Shortcut: buka langsung{" "}
          <code className="rounded border border-slate-800 px-2 py-1 bg-slate-950">
            /admin/inbox/&lt;conversation_id&gt;
          </code>
        </div>
      </div>
    </div>
  );
}
