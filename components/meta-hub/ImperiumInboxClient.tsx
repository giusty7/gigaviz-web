"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion, type Variants } from "framer-motion";
import { PanelRightClose, PanelRightOpen, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  InboxHeader,
  ContactList,
  ChatTerminal,
  CRMSidebar,
  TemplateShortcutModal,
  TemplateVariableModal,
  ImperiumInboxFooter,
  DemoChecklistPanel,
  type Thread,
  type Message,
  type Note,
  type ContactDetails,
  type ApprovedTemplate,
  type FilterState,
  type ConnectionStatus,
  type CannedResponse,
  type MediaItem,
  type SessionInfo,
  type SavedView,
  type WorkspaceMember,
} from "./ImperiumInboxComponents";

/* ═══════════════════════════════════════════════════════════════════════════
   HYDRATION-SAFE MOUNT CHECK
   ═══════════════════════════════════════════════════════════════════════════ */

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

const placeholderRegex = /{{\s*(\d+)\s*}}/g;

function getPlaceholderCount(body?: string | null) {
  if (!body) return 0;
  const regex = new RegExp(placeholderRegex.source, "g");
  const matches = Array.from(body.matchAll(regex));
  if (!matches.length) return 0;
  return matches.reduce((max, match) => {
    const idx = Number(match[1]);
    return Number.isFinite(idx) ? Math.max(max, idx) : max;
  }, 0);
}

function renderTemplateBody(body: string | null | undefined, variables: string[]) {
  if (!body) return "";
  const regex = new RegExp(placeholderRegex.source, "g");
  return body.replace(regex, (_, rawIdx) => {
    const idx = Number(rawIdx) - 1;
    const value = variables[idx];
    return typeof value === "string" && value.trim().length > 0 ? value : `{{${rawIdx}}}`;
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface ImperiumInboxClientProps {
  workspaceId: string;
  workspaceSlug: string;
  userId: string;
  canEdit: boolean;
  allowWrite: boolean;
  demoMode?: boolean;
  initialThreads: Thread[];
  initialMessages: Message[];
  initialSession: SessionInfo;
  initialTags: string[];
  initialNotes: Note[];
  templates: ApprovedTemplate[];
  fullMode?: boolean;
  overviewMode?: boolean;
}

type TelemetrySnapshot = {
  incomingToday: number;
  avgResponseMs: number | null;
  automationRate: number;
  throughput: { hour: string; count: number }[];
  slaHours: number;
  generatedAt: string;
};

type SentimentResult = {
  score: number;
  label: string;
  source?: string;
};

function fallbackSentiment(text?: string | null): SentimentResult {
  if (!text) return { score: 50, label: "Neutral", source: "client_fallback" };
  const normalized = text.toLowerCase();
  const positiveWords = ["thank", "great", "good", "love", "appreciate", "yes", "helpful", "nice", "well done"];
  const negativeWords = ["bad", "angry", "upset", "frustrated", "hate", "no", "problem", "issue", "terrible", "worst"];

  let score = 50;
  positiveWords.forEach((word) => {
    if (normalized.includes(word)) score += 8;
  });
  negativeWords.forEach((word) => {
    if (normalized.includes(word)) score -= 10;
  });
  score = Math.max(5, Math.min(95, score));

  let label: string;
  if (score >= 70) label = "Calm";
  else if (score >= 45) label = "Neutral";
  else label = "Alert";

  return { score, label, source: "client_fallback" };
}

type CapabilityReasonCode =
  | "PLAN_LOCKED"
  | "NO_CONNECTION"
  | "CONNECTION_INACTIVE"
  | "PHONE_NUMBER_MISSING"
  | "TOKEN_MISSING"
  | "TOKEN_EXPIRED"
  | "CAPABILITY_API_ERROR";

type CapabilityState = {
  loading: boolean;
  canSend: boolean;
  reasonCode: CapabilityReasonCode | null;
  reason: string | null;
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN CLIENT COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function ImperiumInboxClient({
  workspaceId: _workspaceId,
  workspaceSlug,
  userId,
  canEdit,
  allowWrite,
  demoMode = false,
  initialThreads,
  initialMessages,
  initialSession,
  // initialTags - reserved for tag filtering
  initialNotes,
  templates,
  fullMode = false,
  overviewMode = false,
}: ImperiumInboxClientProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const { toast } = useToast();
  void _workspaceId;

  // User preferences
  const [soundEnabled, setSoundEnabled] = useState(false);
  const blipRef = useRef<HTMLAudioElement | null>(null);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [lastTelemetryFetchAt, setLastTelemetryFetchAt] = useState<number | null>(null);

  // Preference redirect for overview mode
  useEffect(() => {
    if (!overviewMode || !mounted) return;
    const preference = localStorage.getItem("gigaviz.metaHub.whatsapp.fullInboxDefault");
    if (preference === "true") {
      window.location.href = `/${workspaceSlug}/meta-hub/messaging/whatsapp/inbox/full`;
    }
  }, [overviewMode, workspaceSlug, mounted]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedSound = localStorage.getItem("gigaviz.metaHub.inbox.soundEnabled");
    const storedAnimations = localStorage.getItem("gigaviz.metaHub.inbox.animationsEnabled");
    if (storedSound !== null) setSoundEnabled(storedSound === "true");
    if (storedAnimations !== null) setAnimationsEnabled(storedAnimations === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("gigaviz.metaHub.inbox.animationsEnabled", String(animationsEnabled));
  }, [animationsEnabled]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem("gigaviz.metaHub.inbox.soundEnabled", String(soundEnabled));
  }, [soundEnabled]);

  // Thread state
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(initialThreads[0] ?? null);
  const [threadsLoading, setThreadsLoading] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>(initialSession);
  const [showDemoChecklist, setShowDemoChecklist] = useState(false);

  // CRM state
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Composer state
  const [composerValue, setComposerValue] = useState("");
  const [sending, setSending] = useState(false);
  const [escalating, setEscalating] = useState(false);

  // Filter state
  const [filter, setFilter] = useState<FilterState>({
    status: "all",
    assigned: "all",
    search: "",
    showVipOnly: false,
    quickTab: "all",
    tags: [],
    sortBy: "newest",
  });

  // Saved views state
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);

  // Bulk selection state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedThreadIds, setSelectedThreadIds] = useState<Set<string>>(new Set());

  // Connection status (simulate real-time check)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connected");

  const [capability, setCapability] = useState<CapabilityState>({
    loading: true,
    canSend: allowWrite,
    reasonCode: allowWrite ? null : "PLAN_LOCKED",
    reason: allowWrite ? null : "Messaging is disabled for the current plan.",
  });

  // Telemetry
  const [telemetry, setTelemetry] = useState<TelemetrySnapshot | null>(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [slaHours, setSlaHours] = useState<number>(24);
  const latestMessageTsRef = useRef<number>(0);

  // Sentiment
  const [customerSentiment, setCustomerSentiment] = useState<SentimentResult>(() => ({ score: 50, label: "Neutral", source: "init" }));
  const [, setSentimentLoading] = useState(false);
  const sentimentCacheRef = useRef<string | null>(null);
  const fetchTelemetry = useCallback(async () => {
    setTelemetryLoading(true);
    try {
      const params = new URLSearchParams({ workspaceSlug });
      const res = await fetch(`/api/meta/whatsapp/inbox/telemetry?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.reason || data?.error || "Failed to load telemetry");
      }
      setTelemetry({
        incomingToday: data.incomingToday ?? 0,
        avgResponseMs: data.avgResponseMs ?? null,
        automationRate: data.automationRate ?? 0,
        throughput: Array.isArray(data.throughput) ? data.throughput : [],
        slaHours: data.slaHours ?? slaHours,
        generatedAt: data.generatedAt ?? new Date().toISOString(),
      });
      if (data.slaHours) setSlaHours(data.slaHours);
      setLastTelemetryFetchAt(Date.now());
    } catch (err) {
      // Soft fail; keep previous telemetry if any
      if (process.env.NODE_ENV !== "production") {
        console.warn("telemetry_load_failed", err);
      }
    } finally {
      setTelemetryLoading(false);
    }
  }, [workspaceSlug, slaHours]);

  // Canned responses (for slash commands)
  const cannedResponses: CannedResponse[] = useMemo(() => {
    return templates
      .filter((t) => t.body)
      .map((t, idx) => ({
        id: `canned-${idx}`,
        shortcut: t.name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        body: t.body ?? "",
        category: "template",
      }));
  }, [templates]);

  // Template modal state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<ApprovedTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);

  // Auto-refresh
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRhQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAAA/////wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAAAP///wAA"
    );
    audio.volume = 0.16;
    blipRef.current = audio;
  }, []);
  const templatePlaceholderWarned = useRef(false);

  // Filtered threads
  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      // Status filter
      if (filter.status !== "all" && thread.status !== filter.status) return false;

      // VIP filter
      if (filter.showVipOnly && !thread.contact?.is_vip) return false;

      // Search filter
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const name = (thread.contact?.display_name ?? "").toLowerCase();
        const phone = (thread.contact?.phone ?? "").toLowerCase();
        const preview = (thread.last_message_preview ?? "").toLowerCase();
        if (!name.includes(q) && !phone.includes(q) && !preview.includes(q)) return false;
      }

      return true;
    });
  }, [threads, filter]);

  // Fetch saved views on mount
  useEffect(() => {
    if (!_workspaceId || !mounted) return;
    async function fetchSavedViews() {
      try {
        const res = await fetch(`/api/meta/whatsapp/saved-views?workspaceId=${_workspaceId}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.views)) {
          setSavedViews(data.views);
        }
      } catch {
        // Silent fail
      }
    }
    fetchSavedViews();
  }, [_workspaceId, mounted]);

  // Fetch available tags
  useEffect(() => {
    if (!_workspaceId || !mounted) return;
    async function fetchTags() {
      try {
        const res = await fetch(`/api/meta/whatsapp/tags?workspaceId=${_workspaceId}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.tags)) {
          setAvailableTags(data.tags);
        }
      } catch {
        // Silent fail
      }
    }
    fetchTags();
  }, [_workspaceId, mounted]);

  // Fetch workspace members
  useEffect(() => {
    if (!_workspaceId || !mounted) return;
    async function fetchMembers() {
      try {
        const res = await fetch(`/api/workspaces/${_workspaceId}/members`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.members)) {
          setWorkspaceMembers(data.members);
        }
      } catch {
        // Silent fail
      }
    }
    fetchMembers();
  }, [_workspaceId, mounted]);

  // Saved views handlers
  const handleSaveView = useCallback(async (name: string, filters: Partial<FilterState>) => {
    if (!_workspaceId) return;
    try {
      const res = await fetch("/api/meta/whatsapp/saved-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: _workspaceId,
          name,
          filters,
        }),
      });
      const data = await res.json();
      if (res.ok && data.view) {
        setSavedViews((prev) => [...prev, data.view]);
        setActiveViewId(data.view.id);
        toast({ title: "View saved", description: `"${name}" saved successfully` });
      } else {
        throw new Error(data.error || "Failed to save view");
      }
    } catch (err) {
      toast({
        title: "Failed to save view",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    }
  }, [_workspaceId, toast]);

  const handleDeleteView = useCallback(async (viewId: string) => {
    if (!_workspaceId) return;
    try {
      const res = await fetch(`/api/meta/whatsapp/saved-views/${viewId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: _workspaceId }),
      });
      if (res.ok) {
        setSavedViews((prev) => prev.filter((v) => v.id !== viewId));
        if (activeViewId === viewId) setActiveViewId(null);
        toast({ title: "View deleted" });
      } else {
        throw new Error("Failed to delete view");
      }
    } catch (err) {
      toast({
        title: "Failed to delete view",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    }
  }, [_workspaceId, activeViewId, toast]);

  const handleApplyView = useCallback((view: SavedView) => {
    setFilter((prev) => ({
      ...prev,
      ...view.filters,
      tags: view.filters.tags || [],
      sortBy: view.filters.sortBy || "newest",
    }));
    setActiveViewId(view.id);
  }, []);

  // Bulk actions handler
  const handleBulkAction = useCallback(async (action: string, value?: string) => {
    if (!_workspaceId || selectedThreadIds.size === 0) return;
    
    try {
      const threadIds = Array.from(selectedThreadIds);
      let endpoint = "";
      let body = {};

      if (action === "status") {
        endpoint = "/api/meta/whatsapp/threads/bulk-update";
        body = { workspaceId: _workspaceId, threadIds, status: value };
      } else if (action === "assign") {
        endpoint = "/api/meta/whatsapp/threads/bulk-update";
        body = { workspaceId: _workspaceId, threadIds, assignedTo: value };
      } else if (action === "tag") {
        endpoint = "/api/meta/whatsapp/threads/bulk-tag";
        body = { workspaceId: _workspaceId, threadIds, tag: value };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({ title: "Bulk action completed", description: `Updated ${threadIds.length} thread(s)` });
        setSelectedThreadIds(new Set());
        // Refresh threads
        window.location.reload();
      } else {
        throw new Error("Bulk action failed");
      }
    } catch (err) {
      toast({
        title: "Bulk action failed",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    }
  }, [_workspaceId, selectedThreadIds, toast]);

  const handleToggleBulkSelection = useCallback((threadId: string) => {
    setSelectedThreadIds((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  }, []);

  // Unread count
  const unreadCount = useMemo(() => {
    return threads.reduce((sum, t) => sum + (t.unread_count ?? 0), 0);
  }, [threads]);

  // Determine demo checklist visibility (only demoMode or URL ?demo=1)
  useEffect(() => {
    if (typeof window === "undefined") {
      setShowDemoChecklist(Boolean(demoMode));
      return;
    }
    const urlFlag = new URLSearchParams(window.location.search).get("demo");
    const enabledByUrl = urlFlag === "1" || urlFlag === "true";
    setShowDemoChecklist(Boolean(demoMode) || enabledByUrl);
  }, [demoMode]);

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    setThreadsLoading(true);
    setConnectionStatus("connecting");
    try {
      const params = new URLSearchParams({ workspaceSlug });
      const res = await fetch(`/api/meta/whatsapp/threads?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data.error) {
        setConnectionStatus("error");
        throw new Error(data.error || "Failed to load threads");
      }
      setThreads(data.threads ?? []);
      setConnectionStatus("connected");
    } catch (err) {
      setConnectionStatus("error");
      toast({
        title: "Failed to load conversations",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setThreadsLoading(false);
    }
  }, [workspaceSlug, toast]);

  // Fetch messages for selected thread
  const fetchMessages = useCallback(async (threadId: string) => {
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const params = new URLSearchParams({ threadId, workspaceSlug });
      const res = await fetch(`/api/meta/whatsapp/thread/messages?${params.toString()}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        const baseError =
          (data?.details?.message as string | undefined) ||
          (data?.error as string | undefined) ||
          "Failed to load messages";
        const requestId = data?.requestId as string | undefined;
        const message = requestId ? `${baseError} (requestId ${requestId})` : baseError;
        throw new Error(message);
      }
      setMessages(data.messages ?? []);
      const latestFromResponse = Array.isArray(data.messages)
        ? data.messages.reduce((max: number, m: Message) => {
            const ts = Date.parse(m.wa_timestamp ?? m.sent_at ?? m.created_at ?? "");
            return Number.isFinite(ts) && ts > max ? ts : max;
          }, 0)
        : 0;
      if (latestFromResponse > 0) {
        latestMessageTsRef.current = latestFromResponse;
      }
      void fetchTelemetry();
      if (data.session) {
        const state = data.session.state ?? (data.session.active ? "active" : "expired");
        setSessionInfo({
          state,
          active: data.session.active ?? (state === "active" ? true : state === "expired" ? false : null),
          lastInboundAt: data.session.lastInboundAt ?? null,
          lastOutboundAt: data.session.lastOutboundAt ?? null,
          expiresAt: data.session.expiresAt ?? null,
          remainingMinutes: data.session.remainingMinutes ?? null,
        });
      } else {
        setSessionInfo({ state: "unknown", active: null });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setMessagesError(message);
      setSessionInfo({ state: "unknown", active: null });
      toast({
        title: "Failed to load messages",
        description: message,
        variant: "destructive",
      });
    } finally {
      setMessagesLoading(false);
    }
  }, [toast, workspaceSlug, fetchTelemetry]);

  const refreshMessages = useCallback(
    async (threadId: string | null) => {
      if (!threadId) return;
      try {
        const params = new URLSearchParams({ threadId, workspaceSlug });
        const res = await fetch(`/api/meta/whatsapp/thread/messages?${params.toString()}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.messages) {
          setMessages(data.messages ?? []);
        }
      } catch {
        // silent refresh failure
      }
    },
    [workspaceSlug]
  );

  // Build contact details from thread
  const buildContactDetails = useCallback(
    (thread: Thread): ContactDetails => {
      return {
        id: thread.contact?.id ?? thread.id,
        display_name: thread.contact?.display_name ?? null,
        phone: thread.contact?.phone ?? thread.external_thread_id,
        avatar_url: thread.contact?.avatar_url,
        labels: thread.contact?.labels ?? [],
        is_vip: thread.contact?.is_vip ?? false,
        notes: initialNotes,
        activity_timeline: [],
      };
    },
    [initialNotes]
  );

  // Extract media items from messages
  const mediaItems = useMemo((): MediaItem[] => {
    return messages
      .filter((m) => m.media_url && m.media_type)
      .map((m) => ({
        id: m.id,
        type: m.media_type as "image" | "video" | "document" | "audio",
        url: m.media_url!,
        filename: (m.content_json as { filename?: string })?.filename,
        timestamp: m.created_at ?? m.wa_timestamp ?? new Date().toISOString(),
      }));
  }, [messages]);

  const latestMessageTs = useMemo(() => {
    return messages.reduce((max, msg) => {
      const ts = Date.parse(msg.wa_timestamp ?? msg.sent_at ?? msg.created_at ?? "");
      return Number.isFinite(ts) && ts > max ? ts : max;
    }, 0);
  }, [messages]);

  useEffect(() => {
    fetchTelemetry();
    const id = setInterval(fetchTelemetry, 120000);
    return () => clearInterval(id);
  }, [fetchTelemetry]);

  useEffect(() => {
    if (!latestMessageTs) return;
    const shouldRefresh =
      latestMessageTsRef.current === 0 ||
      latestMessageTs > latestMessageTsRef.current ||
      (lastTelemetryFetchAt && Date.now() - lastTelemetryFetchAt > 180000);
    if (shouldRefresh) {
      latestMessageTsRef.current = latestMessageTs;
      void fetchTelemetry();
    }
  }, [latestMessageTs, fetchTelemetry, lastTelemetryFetchAt]);

  const optOutDetected = useMemo(() => {
    const inboundMessages = messages.filter((m) => ["in", "inbound"].includes(m.direction));
    const latestInbound = inboundMessages.reduce<Message | null>((latest, msg) => {
      const ts = Date.parse(msg.wa_timestamp ?? msg.sent_at ?? msg.created_at ?? "");
      const latestTs = latest ? Date.parse(latest.wa_timestamp ?? latest.sent_at ?? latest.created_at ?? "") : 0;
      return ts > latestTs ? msg : latest;
    }, null);

    const rawBody = (latestInbound?.text_body ?? "") ||
      (typeof latestInbound?.content_json === "object"
        ? (latestInbound?.content_json as { text?: string })?.text ?? ""
        : "");
    const body = rawBody.toString().trim().toLowerCase();
    if (!body) return false;

    const keywords = ["stop", "unsubscribe", "cancel", "end", "quit"];
    return keywords.some((kw) => body === kw || body.startsWith(`${kw} `) || body.includes(` ${kw} `));
  }, [messages]);

  const latestCustomerMessage = useMemo(() => {
    const inboundMessages = messages
      .filter((m) => ["in", "inbound"].includes(m.direction))
      .map((m) => ({
        text:
          m.text_body ||
          (typeof m.content_json === "object" && m.content_json && "text" in m.content_json
            ? (m.content_json as { text?: string }).text ?? ""
            : ""),
        ts: Date.parse(m.wa_timestamp ?? m.sent_at ?? m.created_at ?? ""),
      }))
      .filter((m) => Number.isFinite(m.ts));

    if (!inboundMessages.length) return null;
    inboundMessages.sort((a, b) => a.ts - b.ts);
    return inboundMessages[inboundMessages.length - 1];
  }, [messages]);

  useEffect(() => {
    const text = latestCustomerMessage?.text?.trim();
    if (!text) {
      setCustomerSentiment({ score: 50, label: "Neutral", source: "empty" });
      sentimentCacheRef.current = null;
      return;
    }
    if (sentimentCacheRef.current === text) return;

    const controller = new AbortController();
    setSentimentLoading(true);
    fetch("/api/meta/whatsapp/inbox/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceSlug, text }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        if (data?.ok && typeof data.score === "number" && data.label) {
          setCustomerSentiment({ score: data.score, label: data.label, source: data.source ?? "nlp" });
          sentimentCacheRef.current = text;
          return;
        }
        const fallback = fallbackSentiment(text);
        setCustomerSentiment(fallback);
        sentimentCacheRef.current = text;
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        const fallback = fallbackSentiment(text);
        setCustomerSentiment(fallback);
        sentimentCacheRef.current = text;
      })
      .finally(() => {
        if (!controller.signal.aborted) setSentimentLoading(false);
      });

    return () => controller.abort();
  }, [latestCustomerMessage?.text, workspaceSlug]);

  const refreshCapabilities = useCallback(async () => {
    setCapability((prev) => ({ ...prev, loading: true }));
    try {
      const params = new URLSearchParams({ workspaceSlug });
      const res = await fetch(`/api/meta/whatsapp/inbox/capabilities?${params.toString()}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const baseError = (data?.error as string | undefined) ?? "Capability check failed";
        throw new Error(baseError);
      }

      const canSend = data?.canSendText !== false;
      const reasonCode = (data?.reasonCode as CapabilityReasonCode | null | undefined) ?? (canSend ? null : "CAPABILITY_API_ERROR");
      const reason = (data?.reason as string | null | undefined) ?? (canSend ? null : "Messaging is currently blocked.");

      setCapability({
        loading: false,
        canSend,
        reasonCode,
        reason,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Capability check failed";
      setCapability({
        loading: false,
        canSend: false,
        reasonCode: "CAPABILITY_API_ERROR",
        reason: "Unable to verify messaging capability.",
      });
      toast({
        title: "Messaging unavailable",
        description: message,
        variant: "destructive",
      });
    }
  }, [toast, workspaceSlug]);

  useEffect(() => {
    void refreshCapabilities();
  }, [refreshCapabilities]);

  const planAllowsSend = capability.canSend && allowWrite;
  const sessionState = sessionInfo?.state ?? "unknown";

  const capabilityNotice = useMemo(() => {
    const connectionCodes: CapabilityReasonCode[] = [
      "NO_CONNECTION",
      "CONNECTION_INACTIVE",
      "PHONE_NUMBER_MISSING",
      "TOKEN_MISSING",
      "TOKEN_EXPIRED",
    ];

    if (!capability.reasonCode && !capability.reason) {
      return { message: null, ctaHref: null, ctaLabel: null } as const;
    }

    const message = capability.reason ?? "Messaging is currently blocked.";

    if (capability.reasonCode === "PLAN_LOCKED") {
      return {
        message,
        ctaHref: `/${workspaceSlug}/billing`,
        ctaLabel: "Open Billing",
      } as const;
    }

    if (capability.reasonCode && connectionCodes.includes(capability.reasonCode)) {
      return {
        message,
        ctaHref: `/${workspaceSlug}/meta-hub/connections`,
        ctaLabel: "Fix in Connections",
      } as const;
    }

    if (capability.reasonCode === "CAPABILITY_API_ERROR") {
      return {
        message,
        ctaHref: `/${workspaceSlug}/meta-hub/connections`,
        ctaLabel: "Open Connections",
      } as const;
    }

    return { message, ctaHref: null, ctaLabel: null } as const;
  }, [capability.reason, capability.reasonCode, workspaceSlug]);

  const handleComposerChange = useCallback(
    (value: string) => {
      const hasPlaceholder = /{{\s*\d+\s*}}/.test(value);
      if (hasPlaceholder) {
        if (!templatePlaceholderWarned.current) {
          toast({
            title: "Use template parameters",
            description: "Fill placeholders via Send Template. Free-text cannot include {{1}} style tokens.",
            variant: "destructive",
          });
          templatePlaceholderWarned.current = true;
        }
      } else {
        templatePlaceholderWarned.current = false;
      }
      setComposerValue(value);
    },
    [toast]
  );

  // Handle add note
  const handleAddNote = useCallback(
    async (body: string) => {
      if (!selectedThread) return;
      try {
        const res = await fetch("/api/meta/whatsapp/thread/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceSlug,
            threadId: selectedThread.id,
            body,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to add note");
        }
        // Refresh contact details to show new note
        if (contactDetails) {
          setContactDetails({
            ...contactDetails,
            notes: [
              {
                id: data.noteId ?? `temp-${Date.now()}`,
                author_id: userId,
                author_name: "You",
                body,
                created_at: new Date().toISOString(),
              },
              ...contactDetails.notes,
            ],
          });
        }
        toast({ title: "Note added", description: "Team note saved successfully." });
      } catch (err) {
        toast({
          title: "Failed to add note",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
      }
    },
    [selectedThread, workspaceSlug, userId, contactDetails, toast]
  );

  // Handle thread selection
  const handleSelectThread = useCallback(
    (thread: Thread) => {
      setSelectedThread(thread);
      setContactDetails(buildContactDetails(thread));
      fetchMessages(thread.id);
      if (soundEnabled && blipRef.current) {
        try {
          blipRef.current.currentTime = 0;
          void blipRef.current.play();
        } catch {
          // ignore playback errors (autoplay restrictions)
        }
      }

      // Mark as read
      if ((thread.unread_count ?? 0) > 0) {
        fetch("/api/meta/whatsapp/thread/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: thread.id, workspaceSlug }),
        }).catch(() => {});

        // Optimistic update
        setThreads((prev) =>
          prev.map((t) => (t.id === thread.id ? { ...t, unread_count: 0 } : t))
        );
      }
    },
    [buildContactDetails, fetchMessages, workspaceSlug, soundEnabled]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Cmd/Ctrl + K: Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[placeholder*="Search"]'
        ) as HTMLInputElement;
        searchInput?.focus();
      }

      // Cmd/Ctrl + B: Toggle bulk mode
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setBulkMode((prev) => !prev);
      }

      // Cmd/Ctrl + /: Clear filters
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setFilter({
          status: "all",
          assigned: "all",
          search: "",
          showVipOnly: false,
          quickTab: "all",
          tags: [],
          sortBy: "newest",
        });
        setActiveViewId(null);
      }

      // J/K: Navigate threads (vim-style)
      if (e.key === "j" && selectedThread && threads.length > 0) {
        e.preventDefault();
        const currentIndex = threads.findIndex((t) => t.id === selectedThread.id);
        const nextIndex = Math.min(currentIndex + 1, threads.length - 1);
        const nextThread = threads[nextIndex];
        if (nextThread) handleSelectThread(nextThread);
      }

      if (e.key === "k" && selectedThread && threads.length > 0) {
        e.preventDefault();
        const currentIndex = threads.findIndex((t) => t.id === selectedThread.id);
        const prevIndex = Math.max(currentIndex - 1, 0);
        const prevThread = threads[prevIndex];
        if (prevThread) handleSelectThread(prevThread);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedThread, threads, handleSelectThread]);


  // Handle send message
  const handleSend = useCallback(async () => {
    if (!composerValue.trim() || !selectedThread) return;
    if (!allowWrite) {
      toast({
        title: "Messaging disabled",
        description: "Upgrade plan or enable demo override to send WhatsApp messages.",
        variant: "destructive",
      });
      return;
    }

    if (optOutDetected) {
      toast({
        title: "Respect opt-out",
        description: "Recipient asked to stop. Do not send additional messages.",
        variant: "destructive",
      });
      return;
    }

    if (sessionState === "expired") {
      toast({
        title: "Session window expired",
        description: "WhatsApp requires an approved template outside the 24h window.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    const text = composerValue.trim();
    setComposerValue("");

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      direction: "out",
      text_body: text,
      status: "queued",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await fetch("/api/meta/whatsapp/send-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceSlug,
          threadId: selectedThread.id,
          text,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to send message");
      }

      const inserted = (data?.message ?? data?.insertedMessage) as Partial<Message> | undefined;
      const outboxId = typeof data?.outboxId === "string" ? data.outboxId : null;
      const status = (data?.status as string | undefined) ?? inserted?.status ?? "queued";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMessage.id
            ? {
                ...m,
                id: inserted?.id ?? data.insertedMessage?.id ?? m.id,
                status,
                wa_message_id: inserted?.wa_message_id ?? m.wa_message_id,
                wa_timestamp: inserted?.wa_timestamp ?? m.wa_timestamp,
                outbox_id: outboxId ?? (inserted as { outbox_id?: string })?.outbox_id ?? null,
              }
            : m
        )
      );
      void fetchTelemetry();
    } catch (err) {
      // Mark as failed
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMessage.id ? { ...m, status: "failed" } : m))
      );
      toast({
        title: "Send failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }, [composerValue, selectedThread, allowWrite, optOutDetected, sessionState, workspaceSlug, toast, fetchTelemetry]);

  const handleSendTemplate = useCallback(
    async (template: ApprovedTemplate, variables: string[] = []) => {
      if (!selectedThread) return;
      if (!allowWrite) {
        toast({
          title: "Messaging disabled",
          description: "Upgrade plan or enable demo override to send WhatsApp messages.",
          variant: "destructive",
        });
        return;
      }

      if (optOutDetected) {
        toast({
          title: "Respect opt-out",
          description: "Recipient asked to stop. Do not send additional messages.",
          variant: "destructive",
        });
        return;
      }

      const cleanedVars = variables.map((v) => v.trim());
      const expectedCount = getPlaceholderCount(template.body);
      const hasPlaceholders = expectedCount > 0;
      const missing = hasPlaceholders && cleanedVars.slice(0, expectedCount).some((v) => !v);
      if (missing) {
        toast({
          title: "Fill all template variables",
          description: "Please provide values for each placeholder before sending.",
          variant: "destructive",
        });
        return;
      }

      setSending(true);
      try {
        const res = await fetch("/api/meta/whatsapp/reply-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceSlug,
            threadId: selectedThread.id,
            templateName: template.name,
            language: template.language,
            variables: cleanedVars,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to send template");
        }
        await fetchMessages(selectedThread.id);
        setTemplateModalOpen(false);
        setActiveTemplate(null);
        setTemplateVariables([]);
        toast({ title: "Template sent" });
      } catch (err) {
        toast({
          title: "Send template failed",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setSending(false);
      }
    },
    [allowWrite, fetchMessages, optOutDetected, selectedThread, toast, workspaceSlug]
  );

  useEffect(() => {
    const hasQueued = messages.some(
      (m) =>
        !["in", "inbound"].includes(m.direction) &&
        (!m.status || ["queued", "pending", "sending"].includes((m.status ?? "").toLowerCase()))
    );
    if (!selectedThread?.id || !hasQueued) return;
    const timer = setInterval(() => refreshMessages(selectedThread.id), 2500);
    return () => clearInterval(timer);
  }, [messages, selectedThread, refreshMessages]);

  const handleEscalate = useCallback(async () => {
    if (!selectedThread) return;
    setEscalating(true);
    try {
      const res = await fetch("/api/meta/whatsapp/thread/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceSlug, threadId: selectedThread.id, status: "escalated" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to escalate thread");
      }
      setThreads((prev) => prev.map((t) => (t.id === selectedThread.id ? { ...t, status: "escalated" } : t)));
      setSelectedThread((prev) => (prev ? { ...prev, status: "escalated" } : prev));
      toast({ title: "Escalated", description: "Thread marked for human follow-up." });
    } catch (err) {
      toast({
        title: "Escalation failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setEscalating(false);
    }
  }, [selectedThread, toast, workspaceSlug]);

  const handleTemplatePicked = useCallback((template: ApprovedTemplate) => {
    const count = getPlaceholderCount(template.body);
    setTemplateVariables(Array.from({ length: count }, () => ""));
    setActiveTemplate(template);
    setTemplateModalOpen(false);
  }, []);

  const handleTemplateVariableChange = useCallback((index: number, value: string) => {
    setTemplateVariables((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const renderedTemplatePreview = useMemo(() => {
    if (!activeTemplate) return "";
    return renderTemplateBody(activeTemplate.body ?? activeTemplate.name ?? "", templateVariables);
  }, [activeTemplate, templateVariables]);

  const handleTemplateSubmit = useCallback(async () => {
    if (!activeTemplate) return;
    const count = getPlaceholderCount(activeTemplate.body);
    const normalized = templateVariables.slice(0, Math.max(count, templateVariables.length)).map((v) => v.trim());
    if (count > 0 && normalized.some((v) => !v)) {
      toast({
        title: "Fill all template variables",
        description: "Provide values for each placeholder before sending.",
        variant: "destructive",
      });
      return;
    }
    await handleSendTemplate(activeTemplate, normalized);
    setActiveTemplate(null);
    setTemplateVariables([]);
  }, [activeTemplate, handleSendTemplate, templateVariables, toast]);

  // Handle filter change
  const handleFilterChange = useCallback((updates: Partial<FilterState>) => {
    setFilter((prev) => ({ ...prev, ...updates }));
  }, []);

  // Initial load
  useEffect(() => {
    if (selectedThread) {
      setContactDetails(buildContactDetails(selectedThread));
    }
  }, [selectedThread, buildContactDetails]);

  // Auto-refresh threads
  useEffect(() => {
    refreshInterval.current = setInterval(fetchThreads, 30000);
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [fetchThreads]);

  // Realtime polling for messages (2.5s interval, pause when tab hidden)
  useEffect(() => {
    if (!selectedThread) return;

    let pollTimer: NodeJS.Timeout | null = null;
    let isVisible = true;

    const poll = async () => {
      if (!isVisible || !selectedThread) return;
      try {
        const params = new URLSearchParams({ threadId: selectedThread.id, workspaceSlug });
        const res = await fetch(`/api/meta/whatsapp/thread/messages?${params.toString()}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok && data.messages) {
          setMessages(data.messages);
          if (data.session) {
            const state = data.session.state ?? (data.session.active ? "active" : "expired");
            setSessionInfo({
              state,
              active: data.session.active ?? (state === "active" ? true : state === "expired" ? false : null),
              lastInboundAt: data.session.lastInboundAt ?? null,
              lastOutboundAt: data.session.lastOutboundAt ?? null,
              expiresAt: data.session.expiresAt ?? null,
              remainingMinutes: data.session.remainingMinutes ?? null,
            });
          }
        }
      } catch {
        // Silently ignore polling errors
      }
    };

    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === "visible";
      if (isVisible) {
        // Immediately poll when tab becomes visible
        poll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    pollTimer = setInterval(poll, 2500);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [selectedThread, workspaceSlug]);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050a18]">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      {/* Cyber-Batik Parang Background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 L30 0 L60 30 L30 60 Z' fill='none' stroke='%23d4af37' stroke-width='0.5'/%3E%3Cpath d='M15 15 L45 15 L45 45 L15 45 Z' fill='none' stroke='%23d4af37' stroke-width='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />
      {animationsEnabled && (
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 10% 20%, rgba(249,217,118,0.45), transparent 40%), radial-gradient(1px 1px at 80% 30%, rgba(34,211,238,0.4), transparent 35%), radial-gradient(1px 1px at 40% 80%, rgba(225,29,72,0.35), transparent 35%), radial-gradient(1px 1px at 65% 60%, rgba(16,185,129,0.35), transparent 35%)",
            backgroundSize: "180px 180px, 220px 220px, 200px 200px, 240px 240px",
            animation: "particleDrift 38s linear infinite",
          }}
        />
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex h-full flex-col"
      >
        {/* Full Mode Header with Back Link */}
        {fullMode && (
          <div className="flex items-center gap-3 border-b border-[#d4af37]/10 bg-[#0a1229] px-4 py-2">
            <a
              href={`/${workspaceSlug}/meta-hub/messaging/whatsapp/inbox`}
              className="flex items-center gap-2 text-sm text-[#f5f5dc]/60 hover:text-[#d4af37] transition-colors"
            >
              ← Back to Overview
            </a>
          </div>
        )}

        {/* Header */}
        <InboxHeader
          unreadCount={unreadCount}
          connectionStatus={connectionStatus}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
        />

        {/* Overview Mode CTA */}
        {overviewMode && (
          <div className="border-b border-[#d4af37]/10 bg-[#0a1229]/50 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#f5f5dc]/60">Lite view · 5 threads</span>
                <label className="flex items-center gap-2 text-sm text-[#f5f5dc]/70 cursor-pointer hover:text-[#d4af37] transition-colors">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-[#d4af37]/40 bg-[#050a18] text-[#d4af37] focus:ring-[#d4af37]/50"
                    onChange={(e) => {
                      localStorage.setItem("gigaviz.metaHub.whatsapp.fullInboxDefault", String(e.target.checked));
                    }}
                    defaultChecked={typeof window !== "undefined" && localStorage.getItem("gigaviz.metaHub.whatsapp.fullInboxDefault") === "true"}
                  />
                  Always open full workspace
                </label>
              </div>
              <a
                href={`/${workspaceSlug}/meta-hub/messaging/whatsapp/inbox/full`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(`/${workspaceSlug}/meta-hub/messaging/whatsapp/inbox/full`, '_blank', 'noopener,noreferrer');
                }}
                className="flex items-center gap-2 rounded-md border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-1.5 text-sm font-medium text-[#f9d976] transition-all hover:border-[#d4af37] hover:bg-[#d4af37]/20 hover:shadow-[0_0_12px_rgba(212,175,55,0.3)]"
              >
                Open Full Inbox
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        )}

        {/* Three-Column Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Column 1: Contact List */}
          <div className="w-80 flex-shrink-0">
            <ContactList
              threads={filteredThreads}
              selectedId={selectedThread?.id ?? null}
              onSelect={handleSelectThread}
              filter={filter}
              onFilterChange={handleFilterChange}
              loading={threadsLoading}
              currentUserId={userId}
              slaHours={slaHours}
              nowMs={nowMs}
              workspaceId={_workspaceId}
              savedViews={savedViews}
              onSaveView={handleSaveView}
              onDeleteView={handleDeleteView}
              onApplyView={handleApplyView}
              activeViewId={activeViewId}
              availableTags={availableTags}
              workspaceMembers={workspaceMembers}
              bulkMode={bulkMode}
              selectedThreadIds={selectedThreadIds}
              onToggleBulkSelection={handleToggleBulkSelection}
              onBulkAction={handleBulkAction}
            />
          </div>

          {/* Column 2: Chat Terminal */}
          <ChatTerminal
            thread={selectedThread}
            messages={messages}
            loading={messagesLoading}
            error={messagesError}
            composerValue={composerValue}
            onComposerChange={handleComposerChange}
            onSend={handleSend}
            onOpenTemplates={() => setTemplateModalOpen(true)}
            sending={sending}
            cannedResponses={cannedResponses}
            allowSend={planAllowsSend}
            sendDisabledReason={capabilityNotice.message}
            sendDisabledCtaHref={capabilityNotice.ctaHref}
            sendDisabledCtaLabel={capabilityNotice.ctaLabel}
            sessionInfo={sessionInfo}
            optOutDetected={optOutDetected}
            onEscalate={handleEscalate}
            escalating={escalating}
            threadStatus={selectedThread?.status ?? null}
            telemetry={telemetry}
            telemetryLoading={telemetryLoading}
            animationsEnabled={animationsEnabled}
            onToggleAnimations={() => setAnimationsEnabled((prev) => !prev)}
          />

          {/* Column 3: CRM Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "hidden items-center justify-center border-l border-[#d4af37]/10 bg-[#0a1229] px-2 transition-all lg:flex",
              !sidebarOpen && "hover:bg-[#d4af37]/10"
            )}
          >
            {sidebarOpen ? (
              <PanelRightClose className="h-5 w-5 text-[#f5f5dc]/40" />
            ) : (
              <PanelRightOpen className="h-5 w-5 text-[#f5f5dc]/40" />
            )}
          </button>

          {/* Column 3: CRM Sidebar */}
          <div className="hidden lg:block">
            <CRMSidebar
              contact={contactDetails}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              onAddNote={canEdit ? handleAddNote : undefined}
              mediaItems={mediaItems}
              sentimentScore={customerSentiment.score}
              sentimentLabel={customerSentiment.label}
              sentimentText={latestCustomerMessage?.text ?? ""}
              nowMs={nowMs}
            />
          </div>
        </div>

        {/* Footer */}
        <ImperiumInboxFooter />
      </motion.div>

      {showDemoChecklist && (
        <DemoChecklistPanel
          sessionInfo={sessionInfo}
          optOutDetected={optOutDetected}
          allowSend={planAllowsSend}
          threadStatus={selectedThread?.status ?? null}
        />
      )}

      {/* Template Shortcut Modal */}
      <TemplateShortcutModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        templates={templates.filter((t) => t.body)}
        onSelect={handleTemplatePicked}
      />

      <TemplateVariableModal
        isOpen={Boolean(activeTemplate)}
        template={activeTemplate}
        variables={templateVariables}
        onChange={handleTemplateVariableChange}
        onSend={handleTemplateSubmit}
        onClose={() => {
          setActiveTemplate(null);
          setTemplateVariables([]);
        }}
        sending={sending}
        preview={renderedTemplatePreview}
      />
      <style jsx global>{`
        @keyframes particleDrift {
          0% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(-30px, -20px, 0);
          }
          100% {
            transform: translate3d(-60px, -40px, 0);
          }
        }
      `}</style>
    </div>
  );
}
