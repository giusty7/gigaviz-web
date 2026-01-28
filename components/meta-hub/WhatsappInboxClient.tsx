"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookmarkIcon, CheckIcon, MoreVerticalIcon, TagIcon, UserIcon, XIcon } from "lucide-react";

/** Saved view configuration */
type SavedView = {
  id: string;
  name: string;
  status: string;
  assigned: string;
  q: string;
};

/** Default preset views shipped out of the box */
const DEFAULT_VIEWS: SavedView[] = [
  { id: "preset-open", name: "Open", status: "open", assigned: "all", q: "" },
  { id: "preset-unassigned", name: "Unassigned", status: "all", assigned: "unassigned", q: "" },
  { id: "preset-assigned", name: "Assigned to me", status: "all", assigned: "assigned", q: "" },
  { id: "preset-vip", name: "VIP", status: "all", assigned: "all", q: "vip" },
];

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
  outbox_id?: string | null;
  idempotency_key?: string | null;
  error_message?: string | null;
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

const FILTER_PARAM_KEYS = { status: "status", assigned: "assigned", q: "q" } as const;

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
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedThreadIds, setSelectedThreadIds] = useState<Set<string>>(new Set());
  const [enterToSend, setEnterToSend] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const templateSelectRef = useRef<HTMLSelectElement | null>(null);
  const assignSelectRef = useRef<HTMLSelectElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Saved Views state
  const savedViewsKey = `gv:wa-inbox-views:${workspaceId}:${userId}`;
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [bulkActionInProgress, setBulkActionInProgress] = useState(false);

  // Load saved views from localStorage on mount
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(savedViewsKey) : null;
      if (raw) setSavedViews(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [savedViewsKey]);

  // Persist saved views to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && savedViews.length > 0) {
      window.localStorage.setItem(savedViewsKey, JSON.stringify(savedViews));
    }
  }, [savedViews, savedViewsKey]);

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
    const qpStatus = searchParams?.get(FILTER_PARAM_KEYS.status) ?? "all";
    const qpAssign = searchParams?.get(FILTER_PARAM_KEYS.assigned) ?? "all";
    const qpQ = searchParams?.get(FILTER_PARAM_KEYS.q) ?? "";
    setStatusFilter(qpStatus || "all");
    setAssignFilter(qpAssign || "all");
    setSearch(qpQ || "");
  }, [searchParams]);

  const pushFiltersToUrl = useCallback(
    (next: { status?: string; assigned?: string; q?: string }) => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      const current = new URLSearchParams(url.search);
      if (next.status !== undefined) current.set(FILTER_PARAM_KEYS.status, next.status);
      if (next.assigned !== undefined) current.set(FILTER_PARAM_KEYS.assigned, next.assigned);
      if (next.q !== undefined) current.set(FILTER_PARAM_KEYS.q, next.q);
      router.replace(`${url.pathname}?${current.toString()}`);
    },
    [router]
  );

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

  const loadThread = useCallback(
    async (threadId: string) => {
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
    },
    [workspaceId, fetchThreads, toast]
  );

  const refreshMessages = useCallback(
    async (threadId: string | null) => {
      if (!threadId) return;
      try {
        const res = await fetch(
          `/api/meta/whatsapp/thread/messages?threadId=${encodeURIComponent(
            threadId
          )}&workspaceId=${encodeURIComponent(workspaceId)}`,
          { cache: "no-store", credentials: "include" }
        );
        const data = await res.json();
        if (res.ok && data?.messages) {
          setMessages(data.messages ?? []);
        }
      } catch {
        // silent
      }
    },
    [workspaceId]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const hasQueued = messages.some(
      (m) =>
        !isInbound(m.direction) &&
        (!m.status || ["queued", "pending", "sending"].includes((m.status || "").toLowerCase()))
    );
    if (!selectedId || !hasQueued) return undefined;
    const timer = setInterval(() => {
      refreshMessages(selectedId);
    }, 2500);
    return () => clearInterval(timer);
  }, [messages, selectedId, refreshMessages]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key.toLowerCase() === "j") {
        event.preventDefault();
        const idx = visibleThreads.findIndex((t) => t.id === selectedId);
        const next = visibleThreads[Math.min(idx + 1, visibleThreads.length - 1)];
        if (next) loadThread(next.id);
      }
      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        const idx = visibleThreads.findIndex((t) => t.id === selectedId);
        const prev = visibleThreads[Math.max(idx - 1, 0)];
        if (prev) loadThread(prev.id);
      }
      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        composerRef.current?.focus();
      }
      if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        templateSelectRef.current?.focus();
      }
      if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        assignSelectRef.current?.focus();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visibleThreads, selectedId, loadThread]);

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

  useEffect(() => {
    const key = `wa-composer-${workspaceId}-${selectedThread?.id ?? "none"}`;
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (saved) setComposerText(saved);
    return () => {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
    };
  }, [workspaceId, selectedThread?.id]);

  useEffect(() => {
    if (!selectedThread?.id) return;
    const key = `wa-composer-${workspaceId}-${selectedThread.id}`;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, composerText);
    }
  }, [composerText, workspaceId, selectedThread?.id]);

  useEffect(() => {
    const key = `wa-enter-to-send-${workspaceId}`;
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (saved) setEnterToSend(saved === "1");
  }, [workspaceId]);

  useEffect(() => {
    const key = `wa-enter-to-send-${workspaceId}`;
    if (typeof window !== "undefined") window.localStorage.setItem(key, enterToSend ? "1" : "0");
  }, [enterToSend, workspaceId]);

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

  // --- Saved Views handlers ---
  function applyView(view: SavedView) {
    setStatusFilter(view.status);
    setAssignFilter(view.assigned);
    setSearch(view.q);
    setActiveViewId(view.id);
    pushFiltersToUrl({ status: view.status, assigned: view.assigned, q: view.q });
  }

  function saveCurrentView() {
    const name = prompt("Enter a name for this view:");
    if (!name?.trim()) return;
    const newView: SavedView = {
      id: `view-${Date.now().toString(36)}`,
      name: name.trim(),
      status: statusFilter,
      assigned: assignFilter,
      q: search,
    };
    setSavedViews((prev) => [...prev, newView]);
    setActiveViewId(newView.id);
    toast({ title: "View saved", description: `"${newView.name}" saved successfully.` });
  }

  function deleteView(viewId: string) {
    setSavedViews((prev) => prev.filter((v) => v.id !== viewId));
    if (activeViewId === viewId) setActiveViewId(null);
  }

  // --- Quick Actions (per-thread) ---
  async function quickAssignToMe(threadId: string) {
    try {
      const res = await fetch("/api/meta/whatsapp/thread/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, threadId, assignedTo: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.reason || data?.error || "Failed to assign");
      toast({ title: "Assigned to you" });
      await fetchThreads();
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  }

  async function quickMarkDone(threadId: string) {
    try {
      const res = await fetch("/api/meta/whatsapp/thread/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, threadId, status: "closed" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.reason || data?.error || "Failed to mark done");
      toast({ title: "Marked done" });
      await fetchThreads();
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  }

  async function quickAddTag(threadId: string) {
    const tagInput = prompt("Enter tag to add:");
    if (!tagInput?.trim()) return;
    try {
      const res = await fetch("/api/meta/whatsapp/thread/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, threadId, tags: [tagInput.trim()] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.reason || data?.error || "Failed to add tag");
      toast({ title: "Tag added", description: tagInput.trim() });
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  }

  // --- Bulk Quick Actions ---
  async function bulkAssignToMe() {
    if (selectedThreadIds.size === 0) return;
    setBulkActionInProgress(true);
    let successCount = 0;
    for (const tid of selectedThreadIds) {
      try {
        const res = await fetch("/api/meta/whatsapp/thread/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, threadId: tid, assignedTo: userId }),
        });
        if (res.ok) successCount++;
      } catch {
        // continue on error
      }
    }
    setBulkActionInProgress(false);
    toast({ title: "Bulk assign complete", description: `Assigned ${successCount} of ${selectedThreadIds.size} threads.` });
    setSelectedThreadIds(new Set());
    await fetchThreads();
  }

  async function bulkMarkDone() {
    if (selectedThreadIds.size === 0) return;
    setBulkActionInProgress(true);
    let successCount = 0;
    for (const tid of selectedThreadIds) {
      try {
        const res = await fetch("/api/meta/whatsapp/thread/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, threadId: tid, status: "closed" }),
        });
        if (res.ok) successCount++;
      } catch {
        // continue
      }
    }
    setBulkActionInProgress(false);
    toast({ title: "Bulk mark done", description: `Marked ${successCount} of ${selectedThreadIds.size} threads as done.` });
    setSelectedThreadIds(new Set());
    await fetchThreads();
  }

  async function bulkAddTag() {
    if (selectedThreadIds.size === 0) return;
    const tagInput = prompt("Enter tag to add to selected threads:");
    if (!tagInput?.trim()) return;
    setBulkActionInProgress(true);
    let successCount = 0;
    for (const tid of selectedThreadIds) {
      try {
        const res = await fetch("/api/meta/whatsapp/thread/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, threadId: tid, tags: [tagInput.trim()] }),
        });
        if (res.ok) successCount++;
      } catch {
        // continue
      }
    }
    setBulkActionInProgress(false);
    toast({ title: "Bulk tag complete", description: `Tagged ${successCount} of ${selectedThreadIds.size} threads.` });
    setSelectedThreadIds(new Set());
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
      status: "queued" as const,
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
      const inserted = (data?.message ?? data?.insertedMessage) as Partial<Message> | undefined;
      const insertedId = typeof inserted?.id === "string" ? inserted.id : null;
      const insertedDirection =
        (inserted?.direction as Message["direction"]) ?? "outbound";
      const insertedText = inserted?.text_body ?? composerText.trim();
      const insertedTimestamp = inserted?.wa_timestamp ?? nowIso;
      const insertedWaMessageId = inserted?.wa_message_id ?? undefined;
      const insertedStatus = inserted?.status ?? "queued";
      const outboxId = typeof data?.outboxId === "string" ? data.outboxId : (inserted as { outbox_id?: string })?.outbox_id ?? null;
      const idempotencyKey =
        typeof data?.idempotencyKey === "string"
          ? data.idempotencyKey
          : (inserted as { idempotency_key?: string })?.idempotency_key ?? null;
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
            status: insertedStatus,
            outbox_id: outboxId ?? null,
            idempotency_key: idempotencyKey ?? null,
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
      const inserted = (data?.message ?? data?.insertedMessage) as Partial<Message> | undefined;
      const nowIso = new Date().toISOString();
      const preview = `Template: ${replyTemplate.name}`;
      const insertedId = typeof inserted?.id === "string" ? inserted.id : null;
      const insertedDirection =
        (inserted?.direction as Message["direction"]) ?? "outbound";
      const insertedText = inserted?.text_body ?? preview;
      const insertedTimestamp = inserted?.wa_timestamp ?? nowIso;
      const insertedWaMessageId = inserted?.wa_message_id ?? undefined;
      const insertedStatus = inserted?.status ?? "queued";
      const outboxId = typeof data?.outboxId === "string" ? data.outboxId : (inserted as { outbox_id?: string })?.outbox_id ?? null;
      const idempotencyKey =
        typeof data?.idempotencyKey === "string"
          ? data.idempotencyKey
          : (inserted as { idempotency_key?: string })?.idempotency_key ?? null;
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
            status: insertedStatus,
            outbox_id: outboxId ?? null,
            idempotency_key: idempotencyKey ?? null,
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

  function toggleBulkSelection(threadId: string) {
    setSelectedThreadIds((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) next.delete(threadId);
      else next.add(threadId);
      return next;
    });
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setAssignFilter("all");
    pushFiltersToUrl({ status: "all", assigned: "all", q: "" });
  }

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
              onChange={(e) => {
                setSearch(e.target.value);
                pushFiltersToUrl({ q: e.target.value });
              }}
              className="bg-background"
            />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                className="rounded-lg border border-border bg-background px-2 py-1"
                value={statusFilter}
                title="Filter by status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  pushFiltersToUrl({ status: e.target.value });
                }}
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
              <select
                className="rounded-lg border border-border bg-background px-2 py-1"
                value={assignFilter}
                title="Filter by assignment"
                onChange={(e) => {
                  setAssignFilter(e.target.value);
                  pushFiltersToUrl({ assigned: e.target.value });
                }}
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
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 px-2 gap-1">
                    <BookmarkIcon className="h-3 w-3" />
                    {activeViewId
                      ? [...DEFAULT_VIEWS, ...savedViews].find((v) => v.id === activeViewId)?.name ?? "Views"
                      : "Views"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[160px]">
                  {DEFAULT_VIEWS.map((view) => (
                    <DropdownMenuItem
                      key={view.id}
                      onClick={() => applyView(view)}
                      className={cn(activeViewId === view.id && "bg-gigaviz-surface")}
                    >
                      {view.name}
                    </DropdownMenuItem>
                  ))}
                  {savedViews.length > 0 && <DropdownMenuSeparator />}
                  {savedViews.map((view) => (
                    <DropdownMenuItem
                      key={view.id}
                      className={cn("flex items-center justify-between gap-2", activeViewId === view.id && "bg-gigaviz-surface")}
                    >
                      <span onClick={() => applyView(view)} className="flex-1 cursor-pointer">
                        {view.name}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteView(view.id); }}
                        className="text-muted-foreground hover:text-destructive"
                        title="Delete saved view"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={saveCurrentView} className="text-gigaviz-gold">
                    Save current view...
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {DEFAULT_VIEWS.slice(0, 3).map((view) => (
                <Button
                  key={view.id}
                  size="sm"
                  variant="outline"
                  className={cn("h-7 px-2", activeViewId === view.id && "border-gigaviz-gold")}
                  onClick={() => applyView(view)}
                >
                  {view.name}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bulkMode}
                  onChange={(e) => {
                    setBulkMode(e.target.checked);
                    setSelectedThreadIds(new Set());
                  }}
                  className="h-4 w-4"
                />
                <span>Bulk select</span>
              </label>
              {bulkMode && selectedThreadIds.size > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkActionInProgress}
                    onClick={bulkAssignToMe}
                  >
                    <UserIcon className="mr-1 h-3 w-3" /> Assign to me
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkActionInProgress}
                    onClick={bulkAddTag}
                  >
                    <TagIcon className="mr-1 h-3 w-3" /> Add tag
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkActionInProgress}
                    onClick={bulkMarkDone}
                  >
                    <CheckIcon className="mr-1 h-3 w-3" /> Mark done
                  </Button>
                  <span className="text-muted-foreground">Selected: {selectedThreadIds.size}</span>
                </div>
              ) : null}
            </div>
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
            const selected = selectedThreadIds.has(thread.id);
            return (
              <div
                key={thread.id}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm",
                  active ? "border-gigaviz-gold bg-gigaviz-surface" : "border-border bg-background",
                  selected ? "ring-1 ring-gigaviz-gold/60" : "",
                  isPending ? "opacity-60" : "cursor-pointer hover:bg-gigaviz-surface/50"
                )}
                onClick={() => {
                  if (isPending) return;
                  if (bulkMode) {
                    toggleBulkSelection(thread.id);
                  } else {
                    loadThread(thread.id);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {bulkMode ? (
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selected}
                        title="Select conversation"
                        onChange={() => toggleBulkSelection(thread.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : null}
                    <span className="font-semibold text-foreground">
                      {thread.contact?.display_name || thread.contact?.phone || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {unread > 0 ? (
                      <Badge className="bg-amber-500/20 text-amber-100">{unread}</Badge>
                    ) : null}
                    {!bulkMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <button className="p-1 rounded hover:bg-gigaviz-surface" aria-label="Quick actions">
                            <MoreVerticalIcon className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => quickAssignToMe(thread.id)}>
                            <UserIcon className="mr-2 h-3 w-3" /> Assign to me
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => quickMarkDone(thread.id)}>
                            <CheckIcon className="mr-2 h-3 w-3" /> Mark done
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => quickAddTag(thread.id)}>
                            <TagIcon className="mr-2 h-3 w-3" /> Add tag
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {thread.status ?? "open"} - {thread.external_thread_id ?? "-"}
                </p>
                {thread.last_message_preview ? (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {thread.last_message_preview}
                  </p>
                ) : null}
              </div>
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
                    {!inbound ? (
                      <div className="mt-1 text-[11px] tracking-wide text-right text-muted-foreground space-y-0.5">
                        <div className="uppercase">{msg.status ?? "queued"}</div>
                        {msg.error_message ? (
                          <div className="text-amber-600 normal-case">{msg.error_message}</div>
                        ) : null}
                        {process.env.NODE_ENV !== "production" ? (
                          <div className="text-[10px] text-muted-foreground/70">
                            {msg.outbox_id ? `outbox:${msg.outbox_id}` : null}
                            {msg.wa_message_id ? ` wa:${msg.wa_message_id}` : null}
                          </div>
                        ) : null}
                      </div>
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
                  title="Select a message template"
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
              title="Set conversation status"
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
              title="Assign conversation"
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
