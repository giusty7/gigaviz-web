"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { ActionGate } from "@/components/gates/action-gate";
import PreviewBanner from "@/components/modules/preview-banner";

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
  direction: "in" | "inbound" | "out" | "outbound" | "outgoing";
  payload_json?: Record<string, unknown>;
  content_json?: Record<string, unknown>; // backwards-compat mapping from API
  text_body?: string | null;
  status?: string | null;
  created_at?: string | null;
  external_message_id?: string | null;
  wa_message_id?: string | null;
  wa_timestamp?: string | null;
};

type Note = { id: string; author_id: string; body: string; created_at: string };

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  userId: string;
  canEdit: boolean;
  allowWrite: boolean;
  isPreview?: boolean;
  threads: Thread[];
  initialMessages: Message[];
  initialTags: string[];
  initialNotes: Note[];
  templates?: { name: string; language: string | null; status?: string | null }[];
};

const STATUS_OPTIONS = ["open", "pending", "closed"];

function makeTempId() {
  return `temp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function WhatsappInboxClient({
  workspaceId,
  workspaceSlug,
  userId,
  canEdit,
  allowWrite,
  isPreview = false,
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
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [templateOptions, setTemplateOptions] = useState(templates);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const templateSlugRef = useRef(workspaceSlug);
  const [replyTemplate, setReplyTemplate] = useState({ name: "", language: "id", vars: "" });
  const [composerText, setComposerText] = useState("");
  const [status, setStatus] = useState<string>(threads[0]?.status ?? "open");
  const [assignedTo, setAssignedTo] = useState<string | null>(threads[0]?.assigned_to ?? null);
  const [isPending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assignFilter, setAssignFilter] = useState<string>("all");
  const scrollRef = useRef<HTMLDivElement | null>(null);

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
        throw new Error(data?.reason || data?.error || "Failed to load threads");
      }
      setThreadList(data.threads ?? []);
      setLastRefreshed(new Date());
    } catch (err) {
      setThreadsError(err instanceof Error ? err.message : "Failed to load threads");
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
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

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
          throw new Error(data?.message || data?.error || "Failed to load templates");
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
          setTemplatesError(err instanceof Error ? err.message : "Failed to load templates");
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
        setMessagesLoading(true);
        const res = await fetch(
          `/api/meta/whatsapp/thread/messages?threadId=${encodeURIComponent(
            threadId
          )}&workspaceId=${encodeURIComponent(workspaceId)}`,
          { cache: "no-store", credentials: "include" }
        );
        const data = await res.json();
        if (!res.ok || data?.ok === false) {
          throw new Error(data?.reason || data?.error || "Failed to load messages");
        }
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
          title: "Failed to load",
          description: err instanceof Error ? err.message : "Cannot load thread",
          variant: "destructive",
        });
      } finally {
        setMessagesLoading(false);
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
      if (!res.ok) throw new Error(data?.reason || data?.error || "Failed to save tags");
      toast({ title: "Tags saved" });
    } catch (err) {
      toast({
        title: "Failed to save tags",
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
      if (!res.ok) throw new Error(data?.reason || data?.error || "Failed to add note");
      setNotes((prev) => [data.note, ...prev]);
    } catch (err) {
      toast({
        title: "Failed to add note",
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
      if (!res.ok) throw new Error(data?.reason || data?.error || "Failed to update thread");
      toast({ title: "Thread updated" });
      await fetchThreads();
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    }
  }

  async function handleSendText() {
    if (!selectedId || !composerText.trim()) return;
    const tempId = makeTempId();
    const nowIso = new Date().toISOString();
    const optimistic = {
      id: tempId,
      direction: "outbound" as const,
      text_body: composerText.trim(),
      wa_timestamp: nowIso,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await fetch("/api/meta/whatsapp/send-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, threadId: selectedId, text: composerText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.reason || data?.error || "Failed to send message");
      const inserted = data?.insertedMessage as Partial<Message> | undefined;
      const insertedId = typeof inserted?.id === "string" ? inserted.id : null;
      const insertedDirection =
        (inserted?.direction as Message["direction"]) ?? "outbound";
      const insertedText = inserted?.text_body ?? composerText.trim();
      const insertedTimestamp = inserted?.wa_timestamp ?? nowIso;
      const insertedWaMessageId = inserted?.wa_message_id ?? undefined;
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        if (!insertedId) return withoutTemp;
        return [
          ...withoutTemp,
          {
            id: insertedId,
            direction: insertedDirection,
            text_body: insertedText,
            wa_message_id: insertedWaMessageId,
            wa_timestamp: insertedTimestamp,
          },
        ];
      });
      setThreadList((prev) =>
        prev.map((thread) =>
          thread.id === selectedId
            ? {
                ...thread,
                last_message_preview: insertedText,
                last_message_at: insertedTimestamp,
              }
            : thread
        )
      );
      setComposerText("");
      if (!insertedId) {
        await loadThread(selectedId);
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast({
        title: "Send failed",
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
      if (!res.ok) throw new Error(data?.reason || data?.error || "Failed to send template");
      toast({ title: "Message sent", description: data?.messageId ? `ID: ${data.messageId}` : "" });
      const inserted = data?.insertedMessage as Partial<Message> | undefined;
      const nowIso = new Date().toISOString();
      const preview = `Template: ${replyTemplate.name}`;
      const insertedId = typeof inserted?.id === "string" ? inserted.id : null;
      const insertedDirection =
        (inserted?.direction as Message["direction"]) ?? "outbound";
      const insertedText = inserted?.text_body ?? preview;
      const insertedTimestamp = inserted?.wa_timestamp ?? nowIso;
      const insertedWaMessageId = inserted?.wa_message_id ?? undefined;
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== "__tpl_pending__");
        if (!insertedId) return withoutTemp;
        return [
          ...withoutTemp,
          {
            id: insertedId,
            direction: insertedDirection,
            text_body: insertedText,
            wa_message_id: insertedWaMessageId,
            wa_timestamp: insertedTimestamp,
          },
        ];
      });
      setThreadList((prev) =>
        prev.map((thread) =>
          thread.id === selectedId
            ? {
                ...thread,
                last_message_preview: insertedText,
                last_message_at: insertedTimestamp,
              }
            : thread
        )
      );
      if (!insertedId) {
        loadThread(selectedId!);
      }
    } catch (err) {
      toast({
        title: "Send failed",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    }
  }

  async function handleProcessEvents() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/meta/whatsapp/process-events?reconcile=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, reconcile: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed to process events");
      toast({
        title: "Inbox updated",
        description: `Processed ${data.processedEvents ?? data.processed ?? 0}, inserted ${data.insertedMessages ?? data.messagesCreated ?? 0}, reconciled ${data.reconciledMessages ?? 0}`,
      });
      await fetchThreads();
      setLastRefreshed(new Date());
      if (selectedId) {
        await loadThread(selectedId);
      }
    } catch (err) {
      toast({
        title: "Refresh failed",
        description: err instanceof Error ? err.message : "Cannot process events",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  }

  const renderMessageBody = (msg: Message) => {
    if (msg.text_body) return msg.text_body;
    const content = (msg.payload_json || msg.content_json || {}) as {
      text?: { body?: unknown };
      template?: { name?: unknown };
    };
    if (content.text?.body) return String(content.text.body);
    if (content.template?.name) return `Template: ${content.template.name}`;
    return "[non-text message]";
  };

  const isInbound = (direction?: string | null) =>
    direction === "in" || direction === "inbound";

  const canSend = canEdit && allowWrite;
  const hasFilters =
    statusFilter !== "all" || assignFilter !== "all" || search.trim().length > 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1.5fr_1fr]">
      {isPreview && <PreviewBanner />}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold text-foreground">Threads</CardTitle>
            <Button size="sm" variant="outline" onClick={handleProcessEvents} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh Inbox"}
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Use search, status, assignee to filter threads.</span>
            <span>{lastRefreshed ? `Last refresh: ${lastRefreshed.toLocaleTimeString()}` : ""}</span>
          </div>
          <div className="mt-2 grid gap-2">
            <Input
              placeholder="Search name/phone"
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
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
              <select
                className="rounded-lg border border-border bg-background px-2 py-1"
                value={assignFilter}
                onChange={(e) => setAssignFilter(e.target.value)}
              >
                <option value="all">Assign: all</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
            {hasFilters ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Filters:</span>
                {statusFilter !== "all" ? (
                  <Badge variant="outline" className="border-gigaviz-gold text-foreground">
                    Status: {statusFilter}
                  </Badge>
                ) : null}
                {assignFilter !== "all" ? (
                  <Badge variant="outline" className="border-gigaviz-gold text-foreground">
                    Assign: {assignFilter}
                  </Badge>
                ) : null}
                {search.trim() ? (
                  <Badge variant="outline" className="border-gigaviz-gold text-foreground">
                    Search: {search.trim()}
                  </Badge>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setAssignFilter("all");
                  }}
                >
                  Clear
                </Button>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {threadsLoading && visibleThreads.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={`th-skel-${idx}`} className="rounded-lg border border-border bg-background p-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-24" />
                  <Skeleton className="mt-1 h-3 w-full" />
                </div>
              ))}
            </div>
          ) : null}
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
            <p className="text-xs text-muted-foreground">Loading threads...</p>
          ) : null}
          {threadsError ? <p className="text-xs text-rose-300">{threadsError}</p> : null}
          {!threadsLoading && !threadsError && visibleThreads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No conversations yet. Click Refresh Inbox after receiving the test webhook.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Conversations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div
            ref={scrollRef}
            className="max-h-[460px] overflow-y-auto space-y-2 rounded-lg border border-border bg-background p-3"
          >
            {messagesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={`msg-skel-${idx}`} className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl bg-gigaviz-surface p-3">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="mt-2 h-4 w-60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {messages.map((msg) => {
              const inbound = isInbound(msg.direction);
              const time =
                msg.wa_timestamp || msg.created_at
                  ? new Date(msg.wa_timestamp || msg.created_at || "").toLocaleString()
                  : "";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-full",
                    inbound ? "justify-start" : "justify-end"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      inbound
                        ? "bg-gigaviz-surface text-foreground"
                        : "bg-gigaviz-gold/20 text-foreground"
                    )}
                  >
                    <div className="text-xs text-muted-foreground flex items-center justify-between gap-2">
                      <span>{inbound ? "Incoming" : "Outgoing"}</span>
                      <span>{time}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap">{renderMessageBody(msg)}</p>
                    {!inbound && msg.status ? (
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground text-right">
                        {msg.status}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {!messagesLoading && messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages in this thread.</p>
            ) : null}
          </div>

          <div className="rounded-lg border border-border bg-background p-3 space-y-3">
            <p className="text-sm font-semibold text-foreground">Send message</p>
            <Textarea
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              placeholder="Type a message..."
              className="bg-card"
              rows={3}
              disabled={!canSend}
            />
            <div className="flex items-center justify-between">
              <ActionGate allowed={canSend}>
                <Button onClick={handleSendText} disabled={!canSend || !composerText.trim()}>
                  Send text
                </Button>
              </ActionGate>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-3 space-y-3">
            <p className="text-sm font-semibold text-foreground">Reply with template</p>
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
                  <option value="::">Select template</option>
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
                  <p className="text-xs text-muted-foreground">Loading templates...</p>
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
                placeholder="example: John,12345"
              />
            </div>
            <ActionGate allowed={canSend}>
              <Button onClick={handleReplyTemplate} disabled={!canSend}>
                  Send template
              </Button>
            </ActionGate>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Status</Label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={!canSend}
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
              disabled={!canSend}
            >
              <option value="">Unassigned</option>
              <option value={userId}>Me</option>
            </select>
          </div>
          <ActionGate allowed={canSend}>
            <Button onClick={handleUpdateThread} disabled={!canSend}>
              Save status/assignee
            </Button>
          </ActionGate>

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
              disabled={!canSend}
            />
            <ActionGate allowed={canSend}>
              <Button onClick={handleTagsSave} disabled={!canSend}>
                Save tags
              </Button>
            </ActionGate>
          </div>

          <div className="space-y-2">
            <Label>Internal notes</Label>
            <NoteForm onSubmit={handleNoteAdd} disabled={!canSend} />
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
                <p className="text-xs text-muted-foreground">No notes yet.</p>
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
        placeholder="Add an internal note..."
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
        Save note
      </Button>
    </div>
  );
}
