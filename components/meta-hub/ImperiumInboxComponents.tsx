"use client";

import { useSyncExternalStore, useState, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Search,
  Star,
  MessageSquare,
  Reply,
  Forward,
  User,
  Tag,
  Clock,
  Check,
  CheckCheck,
  X,
  Send,
  Paperclip,
  Smile,
  FileText,
  Calendar,
  MapPin,
  Mail,
  Activity,
  Plus,
  Edit3,
  Crown,
  Volume2,
  Inbox,
  Bell,
  UserCheck,
  Wand2,
  ImageIcon,
  Video,
  File,
  Download,
  Wifi,
  WifiOff,
  Hash,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   HYDRATION-SAFE MOUNT CHECK
   ═══════════════════════════════════════════════════════════════════════════ */

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

const bubbleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
};

const sidebarVariants: Variants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { x: "100%", opacity: 0, transition: { duration: 0.2 } },
};

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

export type Thread = {
  id: string;
  external_thread_id: string | null;
  status: string | null;
  unread_count: number | null;
  assigned_to: string | null;
  last_message_at: string | null;
  last_message_preview?: string | null;
  contact?: {
    id: string;
    display_name?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    labels?: string[];
    is_vip?: boolean;
  } | null;
};

export type Message = {
  id: string;
  direction: "in" | "inbound" | "out" | "outbound" | "outgoing";
  payload_json?: Record<string, unknown>;
  content_json?: Record<string, unknown>;
  text_body?: string | null;
  status?: string | null;
  created_at?: string | null;
  external_message_id?: string | null;
  wa_message_id?: string | null;
  wa_timestamp?: string | null;
  media_url?: string | null;
  media_type?: "image" | "video" | "audio" | "document" | null;
};

export type Note = {
  id: string;
  author_id: string;
  author_name?: string;
  body: string;
  created_at: string;
};

export type ContactDetails = {
  id: string;
  display_name: string | null;
  phone: string | null;
  avatar_url?: string | null;
  email?: string | null;
  location?: string | null;
  created_at?: string | null;
  last_seen_at?: string | null;
  labels: string[];
  is_vip: boolean;
  notes: Note[];
  activity_timeline: { type: string; description: string; timestamp: string }[];
};

export type ApprovedTemplate = {
  name: string;
  language: string | null;
  body?: string | null;
};

export type FilterState = {
  status: string;
  assigned: string;
  search: string;
  showVipOnly: boolean;
  quickTab: "all" | "unread" | "assigned";
};

export type CannedResponse = {
  id: string;
  shortcut: string;
  body: string;
  category?: string;
};

export type MediaItem = {
  id: string;
  type: "image" | "video" | "document" | "audio";
  url: string;
  filename?: string;
  timestamp: string;
};

export type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error";

/* ═══════════════════════════════════════════════════════════════════════════
   INBOX HEADER with Connection Status
   ═══════════════════════════════════════════════════════════════════════════ */

interface InboxHeaderProps {
  connectionName?: string;
  unreadCount: number;
  connectionStatus?: ConnectionStatus;
}

export function InboxHeader({ connectionName, unreadCount, connectionStatus = "connected" }: InboxHeaderProps) {
  const statusConfig = {
    connected: {
      icon: Wifi,
      color: "text-[#10b981]",
      bgColor: "bg-[#10b981]/10",
      borderColor: "border-[#10b981]/40",
      label: "Connected",
      pulse: false,
    },
    connecting: {
      icon: Wifi,
      color: "text-[#f59e0b]",
      bgColor: "bg-[#f59e0b]/10",
      borderColor: "border-[#f59e0b]/40",
      label: "Connecting...",
      pulse: true,
    },
    disconnected: {
      icon: WifiOff,
      color: "text-[#6b7280]",
      bgColor: "bg-[#6b7280]/10",
      borderColor: "border-[#6b7280]/40",
      label: "Offline",
      pulse: false,
    },
    error: {
      icon: AlertCircle,
      color: "text-[#e11d48]",
      bgColor: "bg-[#e11d48]/10",
      borderColor: "border-[#e11d48]/40",
      label: "Connection Error",
      pulse: true,
    },
  };

  const status = statusConfig[connectionStatus];
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center justify-between border-b border-[#d4af37]/10 bg-gradient-to-r from-[#0a1229] to-[#050a18] px-6 py-4">
      <div>
        <div className="mb-1 flex items-center gap-3">
          <span className="rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-0.5 text-xs font-semibold tracking-wider text-[#f9d976]">
            PILLAR #2
          </span>
          <span className="text-xs text-[#f5f5dc]/50">Imperial Inbox</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#f5f5dc]">
          {connectionName ?? "WhatsApp"} Messages
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Connection Status Indicator */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-all",
            status.bgColor,
            status.borderColor
          )}
        >
          <div className="relative flex h-3 w-3 items-center justify-center">
            {status.pulse && (
              <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", status.bgColor)} />
            )}
            <StatusIcon className={cn("relative h-3 w-3", status.color)} />
          </div>
          <span className={cn("text-xs font-medium", status.color)}>{status.label}</span>
        </div>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-[#e11d48]/40 bg-[#e11d48]/10 px-4 py-2">
            <div className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e11d48] opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[#e11d48]" />
            </div>
            <span className="text-sm font-semibold text-[#e11d48]">{unreadCount} unread</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COLUMN 1: CONTACT LIST with Smart Filter Tabs
   ═══════════════════════════════════════════════════════════════════════════ */

interface ContactListProps {
  threads: Thread[];
  selectedId: string | null;
  onSelect: (thread: Thread) => void;
  filter: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  loading?: boolean;
  currentUserId?: string;
}

export function ContactList({
  threads,
  selectedId,
  onSelect,
  filter,
  onFilterChange,
  loading,
  currentUserId,
}: ContactListProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  // Count for quick tabs
  const unreadCount = threads.filter((t) => (t.unread_count ?? 0) > 0).length;
  const assignedCount = currentUserId
    ? threads.filter((t) => t.assigned_to === currentUserId).length
    : 0;

  // Filter threads based on quick tab
  const quickTabFiltered = threads.filter((thread) => {
    if (filter.quickTab === "unread") return (thread.unread_count ?? 0) > 0;
    if (filter.quickTab === "assigned" && currentUserId) return thread.assigned_to === currentUserId;
    return true;
  });

  if (!mounted) {
    return (
      <div className="flex h-full flex-col border-r border-[#d4af37]/10 bg-[#0a1229]/90">
        <div className="p-4">
          <div className="h-10 animate-pulse rounded-xl bg-[#d4af37]/10" />
        </div>
        <div className="flex-1 space-y-2 p-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[#d4af37]/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col border-r border-[#d4af37]/10 bg-gradient-to-b from-[#0a1229] to-[#050a18]">
      {/* Smart Filter Tabs */}
      <div className="border-b border-[#d4af37]/10 px-2 pt-2">
        <div className="flex gap-1">
          <button
            onClick={() => onFilterChange({ quickTab: "all" })}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-3 py-2.5 text-xs font-semibold transition-all",
              filter.quickTab === "all"
                ? "border border-b-0 border-[#d4af37]/30 bg-gradient-to-b from-[#d4af37]/20 to-transparent text-[#f9d976]"
                : "text-[#f5f5dc]/50 hover:bg-[#f5f5dc]/5 hover:text-[#f5f5dc]/70"
            )}
          >
            <Inbox className="h-3.5 w-3.5" />
            All
          </button>
          <button
            onClick={() => onFilterChange({ quickTab: "unread" })}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-3 py-2.5 text-xs font-semibold transition-all",
              filter.quickTab === "unread"
                ? "border border-b-0 border-[#e11d48]/30 bg-gradient-to-b from-[#e11d48]/20 to-transparent text-[#e11d48]"
                : "text-[#f5f5dc]/50 hover:bg-[#f5f5dc]/5 hover:text-[#f5f5dc]/70"
            )}
          >
            <Bell className="h-3.5 w-3.5" />
            Unread
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#e11d48] px-1.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onFilterChange({ quickTab: "assigned" })}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-3 py-2.5 text-xs font-semibold transition-all",
              filter.quickTab === "assigned"
                ? "border border-b-0 border-[#10b981]/30 bg-gradient-to-b from-[#10b981]/20 to-transparent text-[#10b981]"
                : "text-[#f5f5dc]/50 hover:bg-[#f5f5dc]/5 hover:text-[#f5f5dc]/70"
            )}
          >
            <UserCheck className="h-3.5 w-3.5" />
            Mine
            {assignedCount > 0 && (
              <span className="rounded-full bg-[#10b981] px-1.5 text-[10px] font-bold text-white">
                {assignedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3 border-b border-[#d4af37]/10 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#f5f5dc]/30" />
          <input
            type="text"
            value={filter.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search contacts..."
            className="w-full rounded-xl border border-[#d4af37]/20 bg-[#050a18] py-2.5 pl-10 pr-4 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "open", "pending", "closed"].map((status) => (
            <button
              key={status}
              onClick={() => onFilterChange({ status })}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                filter.status === status
                  ? "bg-[#d4af37]/20 text-[#f9d976]"
                  : "bg-[#f5f5dc]/5 text-[#f5f5dc]/50 hover:bg-[#f5f5dc]/10"
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
          <button
            onClick={() => onFilterChange({ showVipOnly: !filter.showVipOnly })}
            className={cn(
              "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              filter.showVipOnly
                ? "bg-[#d4af37]/30 text-[#f9d976]"
                : "bg-[#f5f5dc]/5 text-[#f5f5dc]/50 hover:bg-[#f5f5dc]/10"
            )}
          >
            <Crown className="h-3 w-3" />
            VIP
          </button>
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
          </div>
        ) : quickTabFiltered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="mb-3 h-10 w-10 text-[#f5f5dc]/20" />
            <p className="text-sm text-[#f5f5dc]/40">No conversations found</p>
            <p className="mt-1 text-xs text-[#f5f5dc]/30">
              {filter.quickTab === "unread" && "All caught up!"}
              {filter.quickTab === "assigned" && "No conversations assigned to you"}
              {filter.quickTab === "all" && "Start a new conversation"}
            </p>
          </div>
        ) : (
          <motion.div variants={listVariants} initial="hidden" animate="visible" className="p-2">
            {quickTabFiltered.map((thread) => (
              <ContactCard
                key={thread.id}
                thread={thread}
                isSelected={selectedId === thread.id}
                onClick={() => onSelect(thread)}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONTACT CARD
   ═══════════════════════════════════════════════════════════════════════════ */

interface ContactCardProps {
  thread: Thread;
  isSelected: boolean;
  onClick: () => void;
}

function ContactCard({ thread, isSelected, onClick }: ContactCardProps) {
  const hasUnread = (thread.unread_count ?? 0) > 0;
  const isVip = thread.contact?.is_vip ?? false;

  return (
    <motion.button
      variants={listItemVariants}
      onClick={onClick}
      className={cn(
        "group relative mb-1 flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all",
        isSelected
          ? "border border-[#e11d48]/40 bg-[#e11d48]/10"
          : "border border-transparent hover:border-[#d4af37]/20 hover:bg-[#d4af37]/5"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold",
            isVip
              ? "bg-gradient-to-br from-[#d4af37] to-[#b8962e] text-[#050a18]"
              : "bg-[#1a2940] text-[#f5f5dc]"
          )}
        >
          {thread.contact?.display_name?.charAt(0).toUpperCase() ?? "?"}
        </div>
        {isVip && (
          <div className="absolute -right-1 -top-1 rounded-full bg-[#d4af37] p-0.5">
            <Crown className="h-2.5 w-2.5 text-[#050a18]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("truncate text-sm font-semibold", hasUnread ? "text-[#f5f5dc]" : "text-[#f5f5dc]/80")}>
            {thread.contact?.display_name ?? thread.external_thread_id ?? "Unknown"}
          </p>
          {thread.last_message_at && (
            <span className="flex-shrink-0 text-[10px] text-[#f5f5dc]/40">
              {formatTime(thread.last_message_at)}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-[#f5f5dc]/50">{thread.last_message_preview ?? "No messages"}</p>
        {/* Labels */}
        {thread.contact?.labels && thread.contact.labels.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {thread.contact.labels.slice(0, 2).map((label) => (
              <span key={label} className="rounded bg-[#d4af37]/20 px-1.5 py-0.5 text-[9px] font-medium text-[#d4af37]">
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Unread Badge */}
      {hasUnread && (
        <div className="absolute right-3 top-1/2 flex h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-full bg-[#e11d48] px-1.5 text-[10px] font-bold text-white">
          {thread.unread_count}
        </div>
      )}

      {/* Active Glow */}
      {isSelected && (
        <div className="absolute inset-0 -z-10 rounded-xl bg-[#e11d48]/20 blur-xl" />
      )}
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COLUMN 2: CHAT TERMINAL with Enhanced Composer
   ═══════════════════════════════════════════════════════════════════════════ */

interface ChatTerminalProps {
  thread: Thread | null;
  messages: Message[];
  loading?: boolean;
  composerValue: string;
  onComposerChange: (value: string) => void;
  onSend: () => void;
  onReply?: (messageId: string) => void;
  onStar?: (messageId: string) => void;
  onForward?: (messageId: string) => void;
  onOpenTemplates?: () => void;
  onOpenHelper?: () => void;
  onGenerateAIDraft?: () => void;
  sending?: boolean;
  aiDraftLoading?: boolean;
  viewingAgents?: { id: string; name: string; avatar?: string }[];
  cannedResponses?: CannedResponse[];
}

export function ChatTerminal({
  thread,
  messages,
  loading,
  composerValue,
  onComposerChange,
  onSend,
  onReply,
  onStar,
  onForward,
  onOpenTemplates,
  onOpenHelper,
  onGenerateAIDraft,
  sending,
  aiDraftLoading,
  viewingAgents,
  cannedResponses = [],
}: ChatTerminalProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect slash command - derived state
  const showSlashMenu = composerValue.startsWith("/");
  const slashFilter = showSlashMenu ? composerValue.slice(1).toLowerCase() : "";

  // Filter canned responses
  const filteredCanned = cannedResponses.filter(
    (r) =>
      r.shortcut.toLowerCase().includes(slashFilter) ||
      r.body.toLowerCase().includes(slashFilter)
  );

  const handleSelectCanned = (response: CannedResponse) => {
    onComposerChange(response.body);
    textareaRef.current?.focus();
  };

  if (!mounted) {
    return <div className="flex-1 animate-pulse bg-[#050a18]" />;
  }

  if (!thread) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-[#0a1229] to-[#050a18] text-center">
        <MessageSquare className="mb-4 h-16 w-16 text-[#d4af37]/20" />
        <p className="text-lg font-semibold text-[#f5f5dc]/60">Select a conversation</p>
        <p className="text-sm text-[#f5f5dc]/40">Choose a contact to start messaging</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col bg-gradient-to-b from-[#0a1229] to-[#050a18]">
      {/* Cyber-Batik Parang Overlay - subtle pattern backdrop */}
      <div 
        className="pointer-events-none absolute inset-0 batik-pattern opacity-[0.03]" 
        aria-hidden="true" 
      />
      
      {/* Chat Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-[#d4af37]/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
              thread.contact?.is_vip
                ? "bg-gradient-to-br from-[#d4af37] to-[#b8962e] text-[#050a18]"
                : "bg-[#1a2940] text-[#f5f5dc]"
            )}
          >
            {thread.contact?.display_name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-semibold text-[#f5f5dc]">
              {thread.contact?.display_name ?? thread.external_thread_id}
            </p>
            <p className="text-xs text-[#f5f5dc]/40">{thread.contact?.phone ?? "No phone"}</p>
          </div>
        </div>

        {/* Multi-Agent Presence */}
        {viewingAgents && viewingAgents.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="mr-2 text-xs text-[#f5f5dc]/40">Viewing:</span>
            <div className="flex -space-x-2">
              {viewingAgents.slice(0, 3).map((agent) => (
                <div
                  key={agent.id}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#050a18] bg-[#d4af37] text-[10px] font-bold text-[#050a18]"
                  title={agent.name}
                >
                  {agent.name.charAt(0)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="mb-3 h-10 w-10 text-[#f5f5dc]/20" />
            <p className="text-sm text-[#f5f5dc]/40">No messages yet</p>
            <p className="mt-2 text-xs text-[#f5f5dc]/30">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onReply={onReply}
                onStar={onStar}
                onForward={onForward}
              />
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-[#d4af37]/10 p-4">
        {/* Slash Command Dropdown */}
        <AnimatePresence>
          {showSlashMenu && cannedResponses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 max-h-48 overflow-y-auto rounded-xl border border-[#d4af37]/30 bg-[#0a1229] p-2 shadow-2xl"
            >
              <div className="mb-2 flex items-center gap-2 px-2 text-xs text-[#f5f5dc]/50">
                <Hash className="h-3 w-3" />
                Quick Responses (type / to filter)
              </div>
              {filteredCanned.length > 0 ? (
                filteredCanned.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectCanned(r)}
                    className="flex w-full items-start gap-3 rounded-lg p-2 text-left transition-all hover:bg-[#d4af37]/10"
                  >
                    <div className="flex-shrink-0 rounded bg-[#d4af37]/20 px-1.5 py-0.5 font-mono text-[10px] text-[#d4af37]">
                      /{r.shortcut}
                    </div>
                    <p className="line-clamp-2 flex-1 text-xs text-[#f5f5dc]/70">{r.body}</p>
                  </button>
                ))
              ) : (
                <p className="px-2 py-4 text-center text-xs text-[#f5f5dc]/30">
                  No matching responses
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <div className="mb-3 flex items-center gap-2">
          {onOpenTemplates && (
            <button
              onClick={onOpenTemplates}
              className="flex items-center gap-1.5 rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1.5 text-xs font-semibold text-[#d4af37] transition-all hover:bg-[#d4af37]/20"
            >
              <FileText className="h-3.5 w-3.5" />
              Templates
            </button>
          )}
          {(onOpenHelper || onGenerateAIDraft) && (
            <button
              onClick={onGenerateAIDraft ?? onOpenHelper}
              disabled={aiDraftLoading}
              className="flex items-center gap-1.5 rounded-lg border border-[#e11d48]/30 bg-gradient-to-r from-[#e11d48]/10 to-[#d4af37]/10 px-3 py-1.5 text-xs font-semibold text-[#e11d48] transition-all hover:from-[#e11d48]/20 hover:to-[#d4af37]/20"
            >
              {aiDraftLoading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border border-[#e11d48] border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5" />
                  AI Draft
                </>
              )}
            </button>
          )}
          <div className="flex-1" />
          <span className="text-[10px] text-[#f5f5dc]/30">
            Type <kbd className="rounded bg-[#f5f5dc]/10 px-1">/</kbd> for quick responses
          </span>
        </div>

        {/* Input Row */}
        <div className="relative z-10 flex items-end gap-3">
          <div className="flex gap-1">
            <button className="rounded-lg p-2 text-[#f5f5dc]/40 hover:bg-[#f5f5dc]/10 hover:text-[#f5f5dc]">
              <Paperclip className="h-5 w-5" />
            </button>
            <button className="rounded-lg p-2 text-[#f5f5dc]/40 hover:bg-[#f5f5dc]/10 hover:text-[#f5f5dc]">
              <ImageIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex-1">
            {/* Magic Wand AI Draft - Inside Input */}
            <button
              onClick={onGenerateAIDraft}
              disabled={aiDraftLoading}
              title="Draft with Gigaviz AI"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-lg p-1.5 text-[#e11d48] transition-all hover:bg-[#e11d48]/10 hover:shadow-[0_0_12px_rgba(225,29,72,0.4)] disabled:opacity-50"
            >
              <Wand2 className={cn("h-4 w-4", aiDraftLoading && "animate-pulse")} />
            </button>
            <textarea
              ref={textareaRef}
              value={composerValue}
              onChange={(e) => onComposerChange(e.target.value)}
              placeholder="Type a message or / for quick responses..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-[#d4af37]/20 bg-[#0a1229] pl-10 pr-12 py-3 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !showSlashMenu) {
                  e.preventDefault();
                  onSend();
                }
                if (e.key === "Escape" && showSlashMenu) {
                  onComposerChange("");
                }
              }}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#f5f5dc]/40 hover:text-[#f5f5dc]">
              <Smile className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={onSend}
            disabled={!composerValue.trim() || sending || showSlashMenu}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl transition-all",
              composerValue.trim() && !showSlashMenu
                ? "bg-gradient-to-br from-[#d4af37] to-[#b8962e] text-[#050a18] hover:shadow-lg hover:shadow-[#d4af37]/30"
                : "bg-[#f5f5dc]/10 text-[#f5f5dc]/30"
            )}
          >
            {sending ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#050a18] border-t-transparent" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MESSAGE BUBBLE - Enhanced Imperium Aesthetics
   ═══════════════════════════════════════════════════════════════════════════ */

interface MessageBubbleProps {
  message: Message;
  onReply?: (id: string) => void;
  onStar?: (id: string) => void;
  onForward?: (id: string) => void;
}

function MessageBubble({ message, onReply, onStar, onForward }: MessageBubbleProps) {
  const isOutbound = ["out", "outbound", "outgoing"].includes(message.direction);
  const text = message.text_body ?? (message.content_json as { text?: string })?.text ?? "";
  const status = message.status?.toLowerCase();
  const timestamp = message.created_at ?? message.wa_timestamp;

  // Status indicator styling
  const getStatusIndicator = () => {
    if (!isOutbound) return null;

    switch (status) {
      case "sending":
        return <Clock className="h-3 w-3 animate-pulse text-[#050a18]/40" />;
      case "sent":
        return <Check className="h-3 w-3 text-[#050a18]/60" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-[#d4af37]" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-[#10b981]" />;
      case "failed":
        return <AlertCircle className="h-3 w-3 text-[#e11d48]" />;
      default:
        return <Check className="h-3 w-3 text-[#050a18]/40" />;
    }
  };

  return (
    <motion.div
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      className={cn("group flex", isOutbound ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "relative max-w-[75%] rounded-2xl px-4 py-2.5 shadow-lg transition-all",
          isOutbound
            ? "rounded-br-sm bg-gradient-to-br from-[#0a1830] to-[#0d2040] ring-1 ring-[#d4af37]/30 text-[#f5f5dc]"
            : "rounded-bl-sm bg-gradient-to-br from-[#f5f5dc] to-[#ebe5d0] text-[#050a18]"
        )}
      >
        {/* Subtle glow for outbound */}
        {isOutbound && (
          <div className="absolute inset-0 -z-10 rounded-2xl rounded-br-sm bg-[#d4af37]/10 blur-sm" />
        )}

        {/* Media */}
        {message.media_url && message.media_type === "image" && (
          // eslint-disable-next-line @next/next/no-img-element -- dynamic user-uploaded content with unknown dimensions
          <img src={message.media_url} alt="Media" className="mb-2 max-w-full rounded-lg" />
        )}
        {message.media_url && message.media_type === "video" && (
          <div className="mb-2 flex aspect-video items-center justify-center rounded-lg bg-[#050a18]/30">
            <Video className="h-8 w-8 text-[#d4af37]" />
          </div>
        )}
        {message.media_url && message.media_type === "audio" && (
          <div className={cn(
            "mb-2 flex items-center gap-2 rounded-lg p-3",
            isOutbound ? "bg-[#e11d48]/10" : "bg-[#050a18]/10"
          )}>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e11d48] text-white hover:bg-[#e11d48]/80">
              <Volume2 className="h-4 w-4" />
            </button>
            <div className="flex-1">
              {/* Magenta Waveform Visualization */}
              <div className="flex h-6 items-center gap-[2px]">
                {[3, 5, 8, 4, 6, 9, 7, 3, 5, 8, 6, 4, 7, 5, 3, 6, 8, 4, 5, 7, 4, 6, 8, 5, 3].map((h, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1 rounded-full transition-all",
                      isOutbound ? "bg-[#e11d48]" : "bg-[#e11d48]/70"
                    )}
                    style={{ height: `${h * 10}%` }}
                  />
                ))}
              </div>
              <span className={cn("text-[9px]", isOutbound ? "text-[#f5f5dc]/50" : "text-[#050a18]/50")}>
                0:24
              </span>
            </div>
          </div>
        )}

        {/* Text */}
        {text && (
          <p className={cn(
            "whitespace-pre-wrap text-sm leading-relaxed",
            isOutbound ? "text-[#f5f5dc]" : "text-[#050a18]"
          )}>
            {text}
          </p>
        )}

        {/* Meta row with enhanced status */}
        <div
          className={cn(
            "mt-1.5 flex items-center gap-1.5 text-[10px]",
            isOutbound ? "justify-end text-[#f5f5dc]/50" : "justify-start text-[#050a18]/50"
          )}
        >
          {timestamp && <span>{formatTime(timestamp)}</span>}
          {getStatusIndicator()}
        </div>

        {/* Hover Actions */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100",
            isOutbound ? "-left-20" : "-right-20"
          )}
        >
          <div className="flex items-center gap-1 rounded-lg border border-[#d4af37]/20 bg-[#0a1229] p-1 shadow-lg">
            {onReply && (
              <button
                onClick={() => onReply(message.id)}
                className="rounded p-1.5 text-[#f5f5dc]/60 hover:bg-[#f5f5dc]/10 hover:text-[#f5f5dc]"
              >
                <Reply className="h-3.5 w-3.5" />
              </button>
            )}
            {onStar && (
              <button
                onClick={() => onStar(message.id)}
                className="rounded p-1.5 text-[#f5f5dc]/60 hover:bg-[#f5f5dc]/10 hover:text-[#d4af37]"
              >
                <Star className="h-3.5 w-3.5" />
              </button>
            )}
            {onForward && (
              <button
                onClick={() => onForward(message.id)}
                className="rounded p-1.5 text-[#f5f5dc]/60 hover:bg-[#f5f5dc]/10 hover:text-[#f5f5dc]"
              >
                <Forward className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COLUMN 3: CRM SIDEBAR with Team Notes & Media Gallery
   ═══════════════════════════════════════════════════════════════════════════ */

interface CRMSidebarProps {
  contact: ContactDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLabels?: (labels: string[]) => void;
  onAddNote?: (body: string) => void;
  onToggleVIP?: () => void;
  mediaItems?: MediaItem[];
}

export function CRMSidebar({
  contact,
  isOpen,
  onClose,
  onUpdateLabels,
  onAddNote,
  onToggleVIP,
  mediaItems = [],
}: CRMSidebarProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteValue, setNoteValue] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "media">("details");

  const handleSubmitNote = async () => {
    if (!noteValue.trim() || !onAddNote) return;
    setSubmittingNote(true);
    try {
      await onAddNote(noteValue.trim());
      setNoteValue("");
      setShowNoteInput(false);
    } finally {
      setSubmittingNote(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex h-full w-80 flex-shrink-0 flex-col border-l border-[#d4af37]/10 bg-gradient-to-b from-[#0a1229] to-[#050a18]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#d4af37]/10 p-4">
            <h3 className="text-sm font-semibold text-[#d4af37]">SOVEREIGN CRM</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-[#f5f5dc]/40 hover:bg-[#f5f5dc]/10 hover:text-[#f5f5dc]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#d4af37]/10">
            <button
              onClick={() => setActiveTab("details")}
              className={cn(
                "flex-1 py-2.5 text-xs font-semibold transition-all",
                activeTab === "details"
                  ? "border-b-2 border-[#d4af37] text-[#d4af37]"
                  : "text-[#f5f5dc]/50 hover:text-[#f5f5dc]/70"
              )}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab("media")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all",
                activeTab === "media"
                  ? "border-b-2 border-[#d4af37] text-[#d4af37]"
                  : "text-[#f5f5dc]/50 hover:text-[#f5f5dc]/70"
              )}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Media
              {mediaItems.length > 0 && (
                <span className="rounded-full bg-[#d4af37]/20 px-1.5 text-[10px]">{mediaItems.length}</span>
              )}
            </button>
          </div>

          {contact ? (
            <div className="flex-1 overflow-y-auto">
              {/* Details Tab */}
              {activeTab === "details" && (
                <div className="p-4">
                  {/* Identity Card */}
                  <div className="mb-6 flex flex-col items-center text-center">
                    <div className="relative mb-3">
                      <div
                        className={cn(
                          "flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold",
                          contact.is_vip
                            ? "bg-gradient-to-br from-[#d4af37] to-[#b8962e] text-[#050a18] ring-4 ring-[#d4af37]/30"
                            : "bg-[#1a2940] text-[#f5f5dc]"
                        )}
                      >
                        {contact.display_name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      {contact.is_vip && (
                        <div className="absolute -right-1 -top-1 rounded-full bg-[#d4af37] p-1.5">
                          <Crown className="h-4 w-4 text-[#050a18]" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-[#f5f5dc]">{contact.display_name ?? "Unknown"}</h4>
                    {contact.phone && <p className="text-sm text-[#f5f5dc]/50">{contact.phone}</p>}
                    {onToggleVIP && (
                      <button
                        onClick={onToggleVIP}
                        className={cn(
                          "mt-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                          contact.is_vip
                            ? "bg-[#d4af37]/20 text-[#d4af37]"
                            : "bg-[#f5f5dc]/10 text-[#f5f5dc]/50 hover:bg-[#d4af37]/10"
                        )}
                      >
                        <Crown className="h-3 w-3" />
                        {contact.is_vip ? "VIP Status" : "Mark as VIP"}
                      </button>
                    )}

                    {/* Status Badges - Imperium Classification */}
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {contact.is_vip && (
                        <span className="animate-pulse rounded-full border-2 border-[#d4af37] bg-[#d4af37]/10 px-3 py-1 text-[10px] font-bold tracking-wider text-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.3)]">
                          VIP LEAD
                        </span>
                      )}
                      {contact.labels?.includes("founder") && (
                        <span className="animate-pulse rounded-full border-2 border-[#e11d48] bg-[#e11d48]/10 px-3 py-1 text-[10px] font-bold tracking-wider text-[#e11d48] shadow-[0_0_8px_rgba(225,29,72,0.3)]">
                          FOUNDER
                        </span>
                      )}
                      {contact.labels?.includes("enterprise") && (
                        <span className="rounded-full border-2 border-[#10b981] bg-[#10b981]/10 px-3 py-1 text-[10px] font-bold tracking-wider text-[#10b981]">
                          ENTERPRISE
                        </span>
                      )}
                      {contact.labels?.includes("priority") && (
                        <span className="rounded-full border-2 border-[#f9d976] bg-[#f9d976]/10 px-3 py-1 text-[10px] font-bold tracking-wider text-[#f9d976]">
                          PRIORITY
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="mb-6 space-y-3 rounded-xl border border-[#d4af37]/10 bg-[#050a18]/50 p-3">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-[#d4af37]" />
                        <span className="text-[#f5f5dc]/70">{contact.email}</span>
                      </div>
                    )}
                    {contact.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-[#d4af37]" />
                        <span className="text-[#f5f5dc]/70">{contact.location}</span>
                      </div>
                    )}
                    {contact.created_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-[#d4af37]" />
                        <span className="text-[#f5f5dc]/70">Joined {formatDate(contact.created_at)}</span>
                      </div>
                    )}
                    {contact.last_seen_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-[#d4af37]" />
                        <span className="text-[#f5f5dc]/70">Last seen {formatTime(contact.last_seen_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* Labels */}
                  <div className="mb-6">
                    <div className="mb-2 flex items-center justify-between">
                      <h5 className="flex items-center gap-1.5 text-xs font-semibold text-[#d4af37]">
                        <Tag className="h-3.5 w-3.5" />
                        LABELS
                      </h5>
                      {onUpdateLabels && (
                        <button className="text-[#f5f5dc]/40 hover:text-[#f5f5dc]">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {contact.labels.length > 0 ? (
                        contact.labels.map((label) => (
                          <span
                            key={label}
                            className="rounded-lg bg-[#d4af37]/20 px-2.5 py-1 text-xs font-medium text-[#d4af37]"
                          >
                            {label}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#f5f5dc]/30">No labels</span>
                      )}
                    </div>
                  </div>

                  {/* Internal Notes with Add Form */}
                  <div className="mb-6">
                    <div className="mb-2 flex items-center justify-between">
                      <h5 className="flex items-center gap-1.5 text-xs font-semibold text-[#d4af37]">
                        <Edit3 className="h-3.5 w-3.5" />
                        TEAM NOTES
                      </h5>
                      {onAddNote && (
                        <button
                          onClick={() => setShowNoteInput(!showNoteInput)}
                          className={cn(
                            "rounded-lg p-1 transition-all",
                            showNoteInput
                              ? "bg-[#e11d48]/20 text-[#e11d48]"
                              : "text-[#f5f5dc]/40 hover:text-[#f5f5dc]"
                          )}
                        >
                          {showNoteInput ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>

                    {/* Note Input Form */}
                    <AnimatePresence>
                      {showNoteInput && onAddNote && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-3 overflow-hidden"
                        >
                          <div className="rounded-xl border border-[#d4af37]/20 bg-[#050a18]/80 p-2">
                            <textarea
                              value={noteValue}
                              onChange={(e) => setNoteValue(e.target.value)}
                              placeholder="Add a note for your team..."
                              rows={3}
                              className="w-full resize-none bg-transparent text-xs text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:outline-none"
                            />
                            <div className="mt-2 flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setShowNoteInput(false);
                                  setNoteValue("");
                                }}
                                className="rounded-lg px-3 py-1.5 text-xs text-[#f5f5dc]/50 hover:text-[#f5f5dc]"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSubmitNote}
                                disabled={!noteValue.trim() || submittingNote}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                                  noteValue.trim()
                                    ? "bg-[#d4af37] text-[#050a18] hover:bg-[#f9d976]"
                                    : "bg-[#f5f5dc]/10 text-[#f5f5dc]/30"
                                )}
                              >
                                {submittingNote ? (
                                  <div className="h-3 w-3 animate-spin rounded-full border border-[#050a18] border-t-transparent" />
                                ) : (
                                  <>
                                    <Plus className="h-3 w-3" />
                                    Save
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      {contact.notes.length > 0 ? (
                        contact.notes.slice(0, 5).map((note) => (
                          <div
                            key={note.id}
                            className="rounded-lg border border-[#f5f5dc]/10 bg-[#050a18]/50 p-2.5"
                          >
                            <p className="text-xs text-[#f5f5dc]/70">{note.body}</p>
                            <p className="mt-1 text-[10px] text-[#f5f5dc]/30">
                              {note.author_name ?? "Team"} • {formatTime(note.created_at)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#f5f5dc]/30">No notes yet</p>
                      )}
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  <div>
                    <h5 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#d4af37]">
                      <Activity className="h-3.5 w-3.5" />
                      ACTIVITY
                    </h5>
                    <div className="relative space-y-3 pl-4">
                      <div className="absolute bottom-0 left-1.5 top-0 w-0.5 bg-[#d4af37]/20" />
                      {contact.activity_timeline.length > 0 ? (
                        contact.activity_timeline.slice(0, 5).map((activity, idx) => (
                          <div key={idx} className="relative">
                            <div className="absolute -left-2.5 top-1 h-2 w-2 rounded-full bg-[#d4af37]" />
                            <p className="text-xs text-[#f5f5dc]/70">{activity.description}</p>
                            <p className="text-[10px] text-[#f5f5dc]/30">{formatTime(activity.timestamp)}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#f5f5dc]/30">No activity recorded</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Media Gallery Tab */}
              {activeTab === "media" && (
                <div className="p-4">
                  {mediaItems.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {mediaItems.map((item) => (
                        <div
                          key={item.id}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-[#d4af37]/10 bg-[#050a18]"
                        >
                          {item.type === "image" && (
                            // eslint-disable-next-line @next/next/no-img-element -- dynamic user-uploaded content
                            <img
                              src={item.url}
                              alt={item.filename ?? "Media"}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          )}
                          {item.type === "video" && (
                            <div className="flex h-full w-full items-center justify-center bg-[#1a2940]">
                              <Video className="h-8 w-8 text-[#d4af37]" />
                            </div>
                          )}
                          {item.type === "document" && (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#1a2940]">
                              <File className="h-8 w-8 text-[#d4af37]" />
                              <span className="px-2 text-center text-[10px] text-[#f5f5dc]/50 line-clamp-2">
                                {item.filename ?? "Document"}
                              </span>
                            </div>
                          )}
                          {item.type === "audio" && (
                            <div className="flex h-full w-full items-center justify-center bg-[#1a2940]">
                              <Volume2 className="h-8 w-8 text-[#e11d48]" />
                            </div>
                          )}

                          {/* Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-[#050a18]/60 opacity-0 transition-opacity group-hover:opacity-100">
                            <button className="rounded-full bg-[#d4af37] p-2 text-[#050a18] hover:bg-[#f9d976]">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Timestamp */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#050a18]/80 to-transparent p-2">
                            <span className="text-[9px] text-[#f5f5dc]/50">{formatTime(item.timestamp)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ImageIcon className="mb-3 h-10 w-10 text-[#f5f5dc]/20" />
                      <p className="text-sm text-[#f5f5dc]/40">No media shared</p>
                      <p className="mt-1 text-xs text-[#f5f5dc]/30">
                        Images, videos, and documents will appear here
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <User className="mb-3 h-10 w-10 text-[#f5f5dc]/20" />
              <p className="text-sm text-[#f5f5dc]/40">Select a contact</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEMPLATE SHORTCUT MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

interface TemplateShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ApprovedTemplate[];
  onSelect: (template: ApprovedTemplate) => void;
}

export function TemplateShortcutModal({ isOpen, onClose, templates, onSelect }: TemplateShortcutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#050a18]/90 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-[#d4af37]/30 bg-gradient-to-br from-[#0a1229] to-[#050a18] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#f5f5dc]">Quick Templates</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-[#f5f5dc]/40 hover:text-[#f5f5dc]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid max-h-[400px] gap-2 overflow-y-auto">
          {templates.map((tpl) => (
            <button
              key={`${tpl.name}-${tpl.language}`}
              onClick={() => onSelect(tpl)}
              className="flex flex-col items-start rounded-xl border border-[#d4af37]/20 bg-[#050a18]/50 p-3 text-left transition-all hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10"
            >
              <p className="font-mono text-sm font-semibold text-[#f5f5dc]">{tpl.name}</p>
              <p className="mt-1 line-clamp-2 text-xs text-[#f5f5dc]/50">{tpl.body ?? "No preview"}</p>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */

export function ImperiumInboxFooter() {
  return (
    <footer className="border-t border-[#d4af37]/10 bg-[#050a18] py-3 text-center">
      <p className="text-[10px] tracking-widest text-[#f5f5dc]/20">
        UNIFIED COMMUNICATION ENGINE — GIGAVIZ IMPERIUM BY PT GLORIOUS VICTORIOUS
      </p>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
