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
  ImperiumInboxFooter,
  type Thread,
  type Message,
  type Note,
  type ContactDetails,
  type ApprovedTemplate,
  type FilterState,
  type ConnectionStatus,
  type CannedResponse,
  type MediaItem,
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

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface ImperiumInboxClientProps {
  workspaceId: string;
  workspaceSlug: string;
  userId: string;
  canEdit: boolean;
  allowWrite: boolean;
  connectionName?: string;
  initialThreads: Thread[];
  initialMessages: Message[];
  initialTags: string[];
  initialNotes: Note[];
  templates: ApprovedTemplate[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN CLIENT COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function ImperiumInboxClient({
  workspaceId,
  // workspaceSlug - reserved for future routing
  userId,
  canEdit,
  allowWrite,
  connectionName,
  initialThreads,
  initialMessages,
  // initialTags - reserved for tag filtering
  initialNotes,
  templates,
}: ImperiumInboxClientProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const { toast } = useToast();

  // Thread state
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(initialThreads[0] ?? null);
  const [threadsLoading, setThreadsLoading] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // CRM state
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Composer state
  const [composerValue, setComposerValue] = useState("");
  const [sending, setSending] = useState(false);

  // Filter state
  const [filter, setFilter] = useState<FilterState>({
    status: "all",
    assigned: "all",
    search: "",
    showVipOnly: false,
    quickTab: "all",
  });

  // Connection status (simulate real-time check)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connected");

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

  // Auto-refresh
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

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

  // Unread count
  const unreadCount = useMemo(() => {
    return threads.reduce((sum, t) => sum + (t.unread_count ?? 0), 0);
  }, [threads]);

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    setThreadsLoading(true);
    setConnectionStatus("connecting");
    try {
      const params = new URLSearchParams({ workspaceId });
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
  }, [workspaceId, toast]);

  // Fetch messages for selected thread
  const fetchMessages = useCallback(async (threadId: string) => {
    setMessagesLoading(true);
    try {
      const params = new URLSearchParams({ threadId });
      const res = await fetch(`/api/meta/whatsapp/thread/messages?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load messages");
      }
      setMessages(data.messages ?? []);
    } catch (err) {
      toast({
        title: "Failed to load messages",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setMessagesLoading(false);
    }
  }, [toast]);

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

  // Handle add note
  const handleAddNote = useCallback(
    async (body: string) => {
      if (!selectedThread) return;
      try {
        const res = await fetch("/api/meta/whatsapp/thread/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId,
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
    [selectedThread, workspaceId, userId, contactDetails, toast]
  );

  // Handle thread selection
  const handleSelectThread = useCallback(
    (thread: Thread) => {
      setSelectedThread(thread);
      setContactDetails(buildContactDetails(thread));
      fetchMessages(thread.id);

      // Mark as read
      if ((thread.unread_count ?? 0) > 0) {
        fetch("/api/meta/whatsapp/thread/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: thread.id }),
        }).catch(() => {});

        // Optimistic update
        setThreads((prev) =>
          prev.map((t) => (t.id === thread.id ? { ...t, unread_count: 0 } : t))
        );
      }
    },
    [buildContactDetails, fetchMessages]
  );

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!composerValue.trim() || !selectedThread || !allowWrite) return;

    setSending(true);
    const text = composerValue.trim();
    setComposerValue("");

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      direction: "out",
      text_body: text,
      status: "sending",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await fetch("/api/meta/whatsapp/send-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          threadId: selectedThread.id,
          text,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to send message");
      }

      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMessage.id
            ? { ...m, id: data.messageId ?? m.id, status: "sent" }
            : m
        )
      );
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
  }, [composerValue, selectedThread, workspaceId, allowWrite, toast]);

  // Handle template select
  const handleTemplateSelect = useCallback((template: ApprovedTemplate) => {
    setComposerValue(template.body ?? template.name);
    setTemplateModalOpen(false);
  }, []);

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

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex h-full flex-col"
      >
        {/* Header */}
        <InboxHeader
          connectionName={connectionName}
          unreadCount={unreadCount}
          connectionStatus={connectionStatus}
        />

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
            />
          </div>

          {/* Column 2: Chat Terminal */}
          <ChatTerminal
            thread={selectedThread}
            messages={messages}
            loading={messagesLoading}
            composerValue={composerValue}
            onComposerChange={setComposerValue}
            onSend={handleSend}
            onOpenTemplates={() => setTemplateModalOpen(true)}
            sending={sending}
            cannedResponses={cannedResponses}
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
            />
          </div>
        </div>

        {/* Footer */}
        <ImperiumInboxFooter />
      </motion.div>

      {/* Template Shortcut Modal */}
      <TemplateShortcutModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        templates={templates.filter((t) => t.body)}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
}
