"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mockAgents, mockContacts, mockConversations, mockMessages, mockNotes } from "@/lib/inbox/mock";
import { Conversation, Message, Note, TicketStatus, Priority, MessageStatus } from "@/lib/inbox/types";
import { badgeColor, clsx, fmtTime } from "@/lib/inbox/utils";
import { useRouter } from "next/navigation";

type Props = { selectedId?: string };

export default function InboxApp({ selectedId }: Props) {
  const router = useRouter();

  // local state (MVP mock)
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("all");
  const [filterAssignee, setFilterAssignee] = useState<string | "all">("all");

  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [notes, setNotes] = useState<Note[]>(mockNotes);

  const [composer, setComposer] = useState("");

  const contactsById = useMemo(() => Object.fromEntries(mockContacts.map(c => [c.id, c])), []);
  const convById = useMemo(() => Object.fromEntries(conversations.map(c => [c.id, c])), [conversations]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return conversations
      .slice()
      .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1))
      .filter((t) => {
        const c = contactsById[t.contactId];
        const hay = `${c?.name ?? ""} ${c?.phone ?? ""} ${(c?.tags ?? []).join(" ")}`.toLowerCase();
        const okQ = !qq || hay.includes(qq);
        const okStatus = filterStatus === "all" ? true : t.ticketStatus === filterStatus;
        const okAsg = filterAssignee === "all" ? true : (t.assignedTo ?? "") === filterAssignee;
        return okQ && okStatus && okAsg;
      });
  }, [q, conversations, contactsById, filterStatus, filterAssignee]);

  const activeId = useMemo(() => {
    if (selectedId && convById[selectedId]) return selectedId;
    return filtered[0]?.id ?? conversations[0]?.id;
  }, [selectedId, convById, filtered, conversations]);

  const activeConv = activeId ? convById[activeId] : undefined;
  const activeContact = activeConv ? contactsById[activeConv.contactId] : undefined;

  const activeMessages = useMemo(
    () => messages.filter(m => m.conversationId === activeId).sort((a, b) => (a.ts < b.ts ? -1 : 1)),
    [messages, activeId]
  );

  const activeNotes = useMemo(
    () => notes.filter(n => n.conversationId === activeId).sort((a, b) => (a.ts < b.ts ? 1 : -1)),
    [notes, activeId]
  );

  function navigateTo(id: string) {
    router.push(`/inbox/${id}`);
    setConversations(prev =>
      prev.map(t => (t.id === id ? { ...t, unreadCount: 0 } : t))
    );
  }

  function setTicketStatus(id: string, st: TicketStatus) {
    setConversations(prev => prev.map(t => (t.id === id ? { ...t, ticketStatus: st } : t)));
  }

  function setPriority(id: string, p: Priority) {
    setConversations(prev => prev.map(t => (t.id === id ? { ...t, priority: p } : t)));
  }

  function setAssignee(id: string, asg?: string) {
    setConversations(prev => prev.map(t => (t.id === id ? { ...t, assignedTo: asg } : t)));
  }

  function pushOutboundMessage(conversationId: string, text: string) {
    const ts = new Date().toISOString();
    const outId = `out_${Math.random().toString(16).slice(2)}`;

    const newMsg: Message = {
      id: outId,
      conversationId,
      direction: "out",
      text,
      ts,
      status: "queued",
    };

    setMessages(prev => [...prev, newMsg]);
    setConversations(prev =>
      prev.map(t => (t.id === conversationId ? { ...t, lastMessageAt: ts } : t))
    );

    // simulate delivery pipeline
    const bump = (status: MessageStatus, delay: number) =>
      setTimeout(() => {
        setMessages(prev =>
          prev.map(m => (m.id === outId ? { ...m, status } : m))
        );
      }, delay);

    bump("sent", 600);
    bump("delivered", 1400);
    bump("read", 3200);
  }

  function send() {
    if (!activeId) return;
    const text = composer.trim();
    if (!text) return;
    setComposer("");
    pushOutboundMessage(activeId, text);
  }

  function addNote(text: string) {
    if (!activeId) return;
    const t = text.trim();
    if (!t) return;
    const ts = new Date().toISOString();
    const n: Note = {
      id: `n_${Math.random().toString(16).slice(2)}`,
      conversationId: activeId,
      text: t,
      ts,
      author: "Giusty",
    };
    setNotes(prev => [n, ...prev]);
  }

  return (
    <div className="min-h-[calc(100vh-0px)] w-full">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold tracking-tight">Inbox</div>
            <div className="text-sm text-slate-400">Shared Team Inbox (MVP mock) — siap disambung API kagek</div>
          </div>
          <div className="flex items-center gap-2">
            <Link className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800" href="/contacts">
              Contacts
            </Link>
            <span className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300">
              Workspace: Gigaviz
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* LEFT: sidebar */}
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
                    {mockAgents.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                    <option value="">(Unassigned)</option>
                  </select>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-auto">
                {filtered.map((t) => {
                  const c = contactsById[t.contactId];
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
                          <div className="truncate font-medium">{c?.name ?? "Unknown"}</div>
                          <div className="truncate text-xs text-slate-400">{c?.phone}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={clsx("text-[11px] px-2 py-1 rounded-full border", badgeColor(t.ticketStatus))}>
                            {t.ticketStatus}
                          </span>
                          {t.unreadCount > 0 && (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-[2px] text-[11px] text-emerald-300 border border-emerald-500/30">
                              {t.unreadCount} new
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span className={clsx("px-2 py-1 rounded-full border", badgeColor(t.priority))}>{t.priority}</span>
                        <span>{fmtTime(t.lastMessageAt)}</span>
                      </div>
                    </button>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="p-6 text-sm text-slate-400">Dak ado hasil. Coba ganti filter/carian.</div>
                )}
              </div>
            </div>
          </aside>

          {/* CENTER: chat */}
          <main className="col-span-12 lg:col-span-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40">
              <div className="border-b border-slate-800 p-3">
                {activeConv && activeContact ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-base font-semibold">{activeContact.name}</div>
                        <span className={clsx("text-[11px] px-2 py-1 rounded-full border", badgeColor(activeConv.ticketStatus))}>
                          {activeConv.ticketStatus}
                        </span>
                        <span className={clsx("text-[11px] px-2 py-1 rounded-full border", badgeColor(activeConv.priority))}>
                          {activeConv.priority}
                        </span>
                      </div>
                      <div className="truncate text-sm text-slate-400">{activeContact.phone}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {activeContact.tags.map(t => (
                          <span key={t} className="text-[11px] px-2 py-1 rounded-full border border-slate-800 text-slate-300">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <select
                        value={activeConv.assignedTo ?? ""}
                        onChange={(e) => setAssignee(activeConv.id, e.target.value || undefined)}
                        className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                      >
                        <option value="">Unassigned</option>
                        {mockAgents.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <select
                          value={activeConv.ticketStatus}
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
                {activeMessages.map((m) => {
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
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</div>
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

                {activeMessages.length === 0 && (
                  <div className="text-sm text-slate-400">Belom ado pesan.</div>
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
                  *Ini simulasi UI. Kagek tombol “Kirim” nyambung ke Cloud API via backend.
                </div>
              </div>
            </div>
          </main>

          {/* RIGHT: contact + notes */}
          <section className="col-span-12 lg:col-span-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40">
              <div className="border-b border-slate-800 p-3">
                <div className="text-sm font-semibold">Info & Notes</div>
                <div className="text-xs text-slate-400">Internal (dak keliatan user)</div>
              </div>

              <div className="p-3 space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="text-xs text-slate-400">Assigned</div>
                  <div className="mt-1 text-sm">{activeConv?.assignedTo ?? "Unassigned"}</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="text-xs text-slate-400">Last seen</div>
                  <div className="mt-1 text-sm">{activeContact?.lastSeenAt ? fmtTime(activeContact.lastSeenAt) : "-"}</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold">Notes</div>
                    <button
                      onClick={() => {
                        const t = prompt("Tulis note internal:");
                        if (t) addNote(t);
                      }}
                      className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-900"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {activeNotes.map(n => (
                      <div key={n.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
                        <div className="text-xs text-slate-400 flex items-center justify-between">
                          <span>{n.author}</span>
                          <span>{fmtTime(n.ts)}</span>
                        </div>
                        <div className="mt-1 text-sm">{n.text}</div>
                      </div>
                    ))}
                    {activeNotes.length === 0 && (
                      <div className="text-sm text-slate-400">Belom ado note.</div>
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
          Shortcut: buka langsung <code className="rounded border border-slate-800 px-2 py-1 bg-slate-950">/inbox/t1</code>
        </div>
      </div>
    </div>
  );
}
