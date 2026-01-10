"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Thread = {
  id: string;
  external_thread_id: string | null;
  status: string | null;
  unread_count: number | null;
  assigned_to: string | null;
  last_message_at: string | null;
  last_message_preview?: string | null;
  contact?: { id: string; display_name?: string | null; phone?: string | null } | null;
};

type Message = {
  id: string;
  direction: "in" | "out";
  content_json: Record<string, unknown>;
  status?: string | null;
  created_at?: string | null;
  received_at?: string | null;
  external_message_id?: string | null;
};

type Note = { id: string; author_id: string; body: string; created_at: string };

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  userId: string;
  canEdit: boolean;
  threads: Thread[];
  initialMessages: Message[];
  initialTags: string[];
  initialNotes: Note[];
  templates?: { name: string; language: string | null; status?: string | null }[];
};

const STATUS_OPTIONS = ["open", "pending", "closed"];

export function WhatsappInboxClient({
  workspaceId,
  workspaceSlug,
  userId,
  canEdit,
  threads,
  initialMessages,
  initialTags,
  initialNotes,
  templates = [],
}: Props) {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(threads[0]?.id ?? null);
  const [threadList, setThreadList] = useState<Thread[]>(threads);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [templateOptions, setTemplateOptions] = useState(templates);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const templateSlugRef = useRef(workspaceSlug);
  const [replyTemplate, setReplyTemplate] = useState({ name: "", language: "id", vars: "" });
  const [status, setStatus] = useState<string>(threads[0]?.status ?? "open");
  const [assignedTo, setAssignedTo] = useState<string | null>(threads[0]?.assigned_to ?? null);
  const [isPending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assignFilter, setAssignFilter] = useState<string>("all");

  const visibleThreads = useMemo(() => threadList, [threadList]);

  const selectedThread = useMemo(
    () => visibleThreads.find((t) => t.id === selectedId) ?? visibleThreads[0] ?? null,
    [visibleThreads, selectedId]
  );

  useEffect(() => {
    setStatus(selectedThread?.status ?? "open");
    setAssignedTo(selectedThread?.assigned_to ?? null);
  }, [selectedThread]);

  useEffect(() => {
    setThreadList(threads);
  }, [threads]);

  useEffect(() => {
    if (threadList.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !threadList.some((t) => t.id === selectedId)) {
      setSelectedId(threadList[0]?.id ?? null);
    }
  }, [threadList, selectedId]);

  const fetchThreads = useCallback(async () => {
    setThreadsLoading(true);
    setThreadsError(null);
    try {
      const params = new URLSearchParams({ workspaceId });
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (assignFilter !== "all") params.set("assigned", assignFilter);

      const res = await fetch(`/api/meta/whatsapp/threads?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.reason || data?.error || "Gagal memuat threads");
      }
      setThreadList(data.threads ?? []);
    } catch (err) {
      setThreadsError(err instanceof Error ? err.message : "Gagal memuat threads");
    } finally {
      setThreadsLoading(false);
    }
  }, [workspaceId, search, statusFilter, assignFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchThreads();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchThreads]);

  useEffect(() => {
    let active = true;
    const slug = templateSlugRef.current;
    if (!slug) return;
    setTemplatesLoading(true);
    setTemplatesError(null);
    async function run() {
      try {
        const params = new URLSearchParams({ workspaceSlug: slug });
        const res = await fetch(`/api/meta/whatsapp/templates?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.ok === false) {
          throw new Error(data?.message || data?.error || "Gagal memuat templates");
        }
        const items = Array.isArray(data.templates) ? data.templates : [];
        const normalized = items.map((tpl: Record<string, unknown>) => ({
          name: String(tpl.name ?? ""),
          language: (tpl.language as string | null) ?? "id",
          status: (tpl.status as string | null) ?? null,
        }));
        if (active) setTemplateOptions(normalized);
      } catch (err) {
        if (active) {
          setTemplatesError(err instanceof Error ? err.message : "Gagal memuat templates");
        }
      } finally {
        if (active) setTemplatesLoading(false);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, []);

  const approvedTemplates = useMemo(() => {
    return templateOptions.filter((tpl) => (tpl.status ?? "").toUpperCase() === "APPROVED");
  }, [templateOptions]);

  useEffect(() => {
    if (approvedTemplates.length === 0 || replyTemplate.name) return;
    const first = approvedTemplates[0];
    setReplyTemplate((prev) => ({
      ...prev,
      name: first.name,
      language: first.language ?? "id",
    }));
  }, [approvedTemplates, replyTemplate.name]);

  async function loadThread(threadId: string) {
    setSelectedId(threadId);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/meta/whatsapp/thread/messages?threadId=${threadId}&workspaceId=${workspaceId}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.reason || data?.error || "Gagal memuat pesan");
        setMessages(data.messages ?? []);
        setTags(data.tags ?? []);
        setNotes(data.notes ?? []);
        await fetch("/api/meta/whatsapp/thread/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, threadId }),
        });
        await fetchThreads();
      } catch (err) {
        toast({
          title: "Gagal memuat",
          description: err instanceof Error ? err.message : "Tidak bisa memuat thread",
          variant: "destructive",
        });
      }
    });
  }

  async function handleTagsSave() {
    try {
      const res = await fetch("/api/meta/whatsapp/thread/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, threadId: selectedId, tags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.reason || data?.error || "Gagal simpan tag");
      toast({ title: "Tags disimpan" });
    } catch (err) {
      toast({
        title: "Gagal simpan tags",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    }
  }

  async function handleNoteAdd(body: string) {
    try {
      const res = await fetch("/api/meta/whatsapp/thread/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, threadId: selectedId, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.reason || data?.error || "Gagal tambah catatan");
      setNotes((prev) => [data.note, ...prev]);
    } catch (err) {
      toast({
        title: "Gagal tambah catatan",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    }
  }

  async function handleUpdateThread() {
    try {
      const res = await fetch("/api/meta/whatsapp/thread/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, threadId: selectedId, assignedTo, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.reason || data?.error || "Gagal update thread");
      toast({ title: "Thread diperbarui" });
      await fetchThreads();
    } catch (err) {
      toast({
        title: "Gagal update",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    }
  }

  async function handleReplyTemplate() {
    try {
      const variables = replyTemplate.vars
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const res = await fetch("/api/meta/whatsapp/reply-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          threadId: selectedId,
          templateName: replyTemplate.name,
          language: replyTemplate.language,
          variables,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.reason || data?.error || "Gagal kirim template");
      toast({ title: "Pesan dikirim", description: data?.messageId ? `ID: ${data.messageId}` : "" });
      loadThread(selectedId!);
    } catch (err) {
      toast({
        title: "Kirim gagal",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    }
  }

  async function handleProcessEvents() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/meta/whatsapp/process-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || "Proses events gagal");
      toast({
        title: "Inbox diperbarui",
        description: `Processed ${data.processed ?? 0}, messages ${data.messagesCreated ?? 0}, threads ${data.threadsCreated ?? 0}`,
      });
      await fetchThreads();
    } catch (err) {
      toast({
        title: "Refresh gagal",
        description: err instanceof Error ? err.message : "Tidak bisa memproses events",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  }

  const renderMessageBody = (msg: Message) => {
    const content = msg.content_json as {
      text?: { body?: unknown };
      template?: { name?: unknown };
    };
    if (content.text?.body) return String(content.text.body);
    if (content.template?.name) return `Template: ${content.template.name}`;
    return JSON.stringify(content);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1.5fr_1fr]">
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold text-foreground">Threads</CardTitle>
            <Button size="sm" variant="outline" onClick={handleProcessEvents} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh Inbox"}
            </Button>
          </div>
          <div className="mt-2 grid gap-2">
            <Input
              placeholder="Cari nama/phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background"
            />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                className="rounded-lg border border-border bg-background px-2 py-1"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Semua status</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
              <select
                className="rounded-lg border border-border bg-background px-2 py-1"
                value={assignFilter}
                onChange={(e) => setAssignFilter(e.target.value)}
              >
                <option value="all">Assign: semua</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {visibleThreads.map((thread) => {
            const active = thread.id === selectedId;
            const unread = thread.unread_count ?? 0;
            return (
              <button
                key={thread.id}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm",
                  active ? "border-gigaviz-gold bg-gigaviz-surface" : "border-border bg-background"
                )}
                onClick={() => loadThread(thread.id)}
                disabled={isPending}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    {thread.contact?.display_name || thread.contact?.phone || "Unknown"}
                  </span>
                  {unread > 0 ? (
                    <Badge className="bg-amber-500/20 text-amber-100">{unread}</Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {thread.status ?? "open"} - {thread.external_thread_id ?? "-"}
                </p>
                {thread.last_message_preview ? (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {thread.last_message_preview}
                  </p>
                ) : null}
              </button>
            );
          })}
          {threadsLoading ? (
            <p className="text-xs text-muted-foreground">Memuat threads...</p>
          ) : null}
          {threadsError ? <p className="text-xs text-rose-300">{threadsError}</p> : null}
          {!threadsLoading && !threadsError && visibleThreads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada percakapan. Klik Refresh Inbox setelah menerima webhook tes.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Percakapan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="max-h-[420px] overflow-y-auto space-y-2 rounded-lg border border-border bg-background p-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm",
                  msg.direction === "in"
                    ? "bg-gigaviz-surface text-foreground"
                    : "bg-gigaviz-gold/20 text-foreground"
                )}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{msg.direction === "in" ? "Incoming" : "Outgoing"}</span>
                  <span>{msg.created_at ? new Date(msg.created_at).toLocaleString() : ""}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap">{renderMessageBody(msg)}</p>
                {msg.status ? (
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {msg.status}
                  </p>
                ) : null}
              </div>
            ))}
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada pesan.</p>
            ) : null}
          </div>

          <div className="rounded-lg border border-border bg-background p-3 space-y-3">
            <p className="text-sm font-semibold text-foreground">Balas dengan template</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="tpl-name">Template</Label>
                <select
                  id="tpl-name"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  value={`${replyTemplate.name}::${replyTemplate.language}`}
                  onChange={(e) => {
                    const [name, lang] = e.target.value.split("::");
                    setReplyTemplate({ ...replyTemplate, name, language: lang || "id" });
                  }}
                >
                  <option value="::">Pilih template</option>
                  {approvedTemplates.map((tpl) => (
                    <option
                      key={`${tpl.name}-${tpl.language ?? "id"}`}
                      value={`${tpl.name}::${tpl.language ?? "id"}`}
                    >
                      {tpl.name} ({tpl.language ?? "id"})
                    </option>
                  ))}
                </select>
                {templatesLoading ? (
                  <p className="text-xs text-muted-foreground">Memuat templates...</p>
                ) : null}
                {templatesError ? (
                  <p className="text-xs text-rose-300">{templatesError}</p>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label htmlFor="tpl-lang">Language</Label>
                <Input
                  id="tpl-lang"
                  value={replyTemplate.language}
                  onChange={(e) => setReplyTemplate({ ...replyTemplate, language: e.target.value })}
                  className="bg-card"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="tpl-vars">Variables (comma)</Label>
              <Input
                id="tpl-vars"
                value={replyTemplate.vars}
                onChange={(e) => setReplyTemplate({ ...replyTemplate, vars: e.target.value })}
                className="bg-card"
                placeholder="contoh: John,12345"
              />
            </div>
            <Button onClick={handleReplyTemplate} disabled={!canEdit}>
              Kirim template
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Detail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Status</Label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={!canEdit}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Assign</Label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={assignedTo || ""}
              onChange={(e) => setAssignedTo(e.target.value || null)}
              disabled={!canEdit}
            >
              <option value="">Unassigned</option>
              <option value={userId}>Saya</option>
            </select>
          </div>
          <Button onClick={handleUpdateThread} disabled={!canEdit}>
            Simpan status/assign
          </Button>

          <div className="space-y-2">
            <Label>Tags</Label>
            <Input
              value={tags.join(", ")}
              onChange={(e) =>
                setTags(
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                )
              }
              className="bg-background"
              placeholder="priority, vip"
              disabled={!canEdit}
            />
            <Button onClick={handleTagsSave} disabled={!canEdit}>
              Simpan tags
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Catatan internal</Label>
            <NoteForm onSubmit={handleNoteAdd} disabled={!canEdit} />
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="rounded-lg border border-border bg-background p-2 text-sm">
                  <p className="text-foreground">{note.body}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
              {notes.length === 0 ? (
                <p className="text-xs text-muted-foreground">Belum ada catatan.</p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NoteForm({ onSubmit, disabled }: { onSubmit: (body: string) => void; disabled: boolean }) {
  const [value, setValue] = useState("");
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tambahkan catatan internal..."
        className="bg-background"
        disabled={disabled}
      />
      <Button
        type="button"
        onClick={() => {
          if (!value.trim()) return;
          onSubmit(value.trim());
          setValue("");
        }}
        disabled={disabled}
      >
        Simpan catatan
      </Button>
    </div>
  );
}
