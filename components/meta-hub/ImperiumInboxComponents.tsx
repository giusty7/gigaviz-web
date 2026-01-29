"use client";

import { useSyncExternalStore, useState, useRef, useMemo } from "react";
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
  Copy,
  Bookmark,
  ChevronDown,
  Trash2,
  CheckCircle2,
  Users,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   HYDRATION-SAFE MOUNT CHECK
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   ANIMATION VARIANTS
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

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

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   TYPES
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

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
  outbox_id?: string | null;
  idempotency_key?: string | null;
  error_message?: string | null;
  status_at?: string | null;
  status_updated_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  failed_at?: string | null;
  error_code?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
  external_message_id?: string | null;
  wa_message_id?: string | null;
  wa_timestamp?: string | null;
  media_url?: string | null;
  media_type?: "image" | "video" | "audio" | "document" | null;
  msg_type?: string | null;
  error_reason?: string | null;
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
  tags: string[];
  sortBy: "newest" | "oldest" | "recent_reply" | "unread_first";
};

export type SavedView = {
  id: string;
  name: string;
  filters: Partial<FilterState>;
  isDefault?: boolean;
  created_at?: string;
};

export type WorkspaceMember = {
  user_id: string;
  email: string;
  full_name?: string | null;
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

export type SessionInfo = {
  state: "active" | "expired" | "unknown";
  active?: boolean | null;
  remainingMinutes?: number | null;
  lastInboundAt?: string | null;
  lastOutboundAt?: string | null;
  expiresAt?: string | null;
};

type TelemetrySnapshot = {
  incomingToday: number;
  avgResponseMs: number | null;
  automationRate: number;
  throughput: { hour: string; count: number }[];
  slaHours: number;
  generatedAt: string;
};

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   INBOX HEADER with Connection Status
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

interface InboxHeaderProps {
  unreadCount: number;
  connectionStatus?: ConnectionStatus;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export function InboxHeader({ unreadCount, connectionStatus = "connected", soundEnabled = false, onToggleSound }: InboxHeaderProps) {
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
          Gigaviz Messages
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {onToggleSound && (
          <button
            onClick={onToggleSound}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
              soundEnabled
                ? "border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                : "border-[#d4af37]/30 bg-[#d4af37]/5 text-[#f5f5dc]/60 hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10"
            )}
            title="Toggle interface blip sound when switching chats"
          >
            <Volume2 className={cn("h-4 w-4", soundEnabled ? "text-[#10b981]" : "text-[#f5f5dc]/60")} />
            <span>{soundEnabled ? "Sound On" : "Sound Off"}</span>
          </button>
        )}

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

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   COLUMN 1: CONTACT LIST with Smart Filter Tabs
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

interface ContactListProps {
  threads: Thread[];
  selectedId: string | null;
  onSelect: (thread: Thread) => void;
  filter: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  loading?: boolean;
  currentUserId?: string;
  slaHours?: number;
  nowMs?: number;
  workspaceId?: string;
  savedViews?: SavedView[];
  onSaveView?: (name: string, filters: Partial<FilterState>) => Promise<void>;
  onDeleteView?: (viewId: string) => Promise<void>;
  onApplyView?: (view: SavedView) => void;
  activeViewId?: string | null;
  availableTags?: string[];
  workspaceMembers?: WorkspaceMember[];
  bulkMode?: boolean;
  selectedThreadIds?: Set<string>;
  onToggleBulkSelection?: (threadId: string) => void;
  onBulkAction?: (action: string, value?: string) => Promise<void>;
}

export function ContactList({
  threads,
  selectedId,
  onSelect,
  filter,
  onFilterChange,
  loading,
  currentUserId,
  slaHours = 24,
  nowMs = 0,
  savedViews = [],
  onSaveView,
  onDeleteView,
  onApplyView,
  activeViewId,
  availableTags = [],
  workspaceMembers = [],
  bulkMode = false,
  selectedThreadIds = new Set(),
  onBulkAction,
}: ContactListProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const [showSaveViewDialog, setShowSaveViewDialog] = useState(false);
  const [showViewsDropdown, setShowViewsDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [newViewName, setNewViewName] = useState("");

  // Preset views
  const presetViews: SavedView[] = [
    { id: "preset-open", name: "Open", filters: { status: "open" } },
    { id: "preset-unassigned", name: "Unassigned", filters: { assigned: "unassigned" } },
    { id: "preset-my-threads", name: "My Threads", filters: { assigned: currentUserId || "" } },
    { id: "preset-urgent", name: "Urgent", filters: { showVipOnly: true, quickTab: "unread" } },
    { id: "preset-needs-reply", name: "Needs Reply", filters: { quickTab: "unread", status: "open" } },
  ];

  // Count for quick tabs
  const unreadCount = threads.filter((t) => (t.unread_count ?? 0) > 0).length;
  const assignedCount = currentUserId
    ? threads.filter((t) => t.assigned_to === currentUserId).length
    : 0;

/* CONTACT CARD */
  
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
        {/* Filter Stats & Actions Bar */}
        <div className="flex items-center justify-between text-xs text-[#f5f5dc]/60">
          <span>
            Showing <span className="font-semibold text-[#f9d976]">{quickTabFiltered.length}</span> of{" "}
            <span className="font-semibold">{threads.length}</span> threads
          </span>
          {(filter.status !== "all" || filter.search || filter.showVipOnly || (filter.tags && filter.tags.length > 0)) && (
            <button
              onClick={() => onFilterChange({ status: "all", search: "", showVipOnly: false, tags: [] })}
              className="flex items-center gap-1 text-[#e11d48] hover:underline"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        {/* Search + View + Sort Row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#f5f5dc]/30" />
            <input
              type="text"
              value={filter.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              placeholder="Search contacts..."
              className="w-full rounded-xl border border-[#d4af37]/20 bg-[#050a18] py-2.5 pl-10 pr-4 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
            />
          </div>

          {/* Saved Views Dropdown */}
          <DropdownMenu open={showViewsDropdown} onOpenChange={setShowViewsDropdown}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-xl border border-[#d4af37]/20 bg-[#050a18] px-3 py-2.5 text-sm font-medium text-[#f9d976] transition-all hover:bg-[#d4af37]/10 hover:border-[#d4af37]/40">
                <Bookmark className="h-4 w-4" />
                <span className="hidden sm:inline">Views</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#0a1229] border-[#d4af37]/20">
              <DropdownMenuLabel className="text-[#f5f5dc]/50 text-xs">Preset Views</DropdownMenuLabel>
              {presetViews.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  onClick={() => onApplyView?.(view)}
                  className={cn(
                    "cursor-pointer text-[#f5f5dc]",
                    activeViewId === view.id && "bg-[#d4af37]/20 text-[#f9d976]"
                  )}
                >
                  {activeViewId === view.id && <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
                  {view.name}
                </DropdownMenuItem>
              ))}
              {savedViews.length > 0 && (
                <>
                  <DropdownMenuSeparator className="bg-[#d4af37]/10" />
                  <DropdownMenuLabel className="text-[#f5f5dc]/50 text-xs">My Views</DropdownMenuLabel>
                  {savedViews.map((view) => (
                    <DropdownMenuItem
                      key={view.id}
                      className={cn(
                        "cursor-pointer text-[#f5f5dc] flex items-center justify-between",
                        activeViewId === view.id && "bg-[#d4af37]/20 text-[#f9d976]"
                      )}
                    >
                      <span onClick={() => onApplyView?.(view)} className="flex-1">
                        {activeViewId === view.id && <CheckCircle2 className="mr-2 h-3.5 w-3.5 inline" />}
                        {view.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${view.name}"?`)) {
                            onDeleteView?.(view.id);
                          }
                        }}
                        className="ml-2 text-[#f5f5dc]/40 hover:text-[#e11d48]"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              <DropdownMenuSeparator className="bg-[#d4af37]/10" />
              <DropdownMenuItem
                onClick={() => setShowSaveViewDialog(true)}
                className="cursor-pointer text-[#10b981] font-medium"
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                Save current view
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Dropdown */}
          <DropdownMenu open={showSortDropdown} onOpenChange={setShowSortDropdown}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-xl border border-[#d4af37]/20 bg-[#050a18] px-3 py-2.5 text-sm font-medium text-[#f9d976] transition-all hover:bg-[#d4af37]/10">
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">Sort</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#0a1229] border-[#d4af37]/20">
              {[
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "recent_reply", label: "Recent Reply" },
                { value: "unread_first", label: "Unread First" },
              ].map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onFilterChange({ sortBy: option.value as FilterState["sortBy"] })}
                  className={cn(
                    "cursor-pointer text-[#f5f5dc]",
                    filter.sortBy === option.value && "bg-[#d4af37]/20 text-[#f9d976]"
                  )}
                >
                  {filter.sortBy === option.value && <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status + VIP + Tags + Assignment Row */}
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

          {/* Tags Dropdown */}
          {availableTags.length > 0 && (
            <DropdownMenu open={showTagDropdown} onOpenChange={setShowTagDropdown}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all bg-[#f5f5dc]/5 text-[#f5f5dc]/50 hover:bg-[#f5f5dc]/10">
                  <Tag className="h-3 w-3" />
                  Tags
                  {filter.tags && filter.tags.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {filter.tags.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-[#0a1229] border-[#d4af37]/20">
                {availableTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={filter.tags?.includes(tag)}
                    onCheckedChange={(checked) => {
                      const currentTags = filter.tags || [];
                      const newTags = checked
                        ? [...currentTags, tag]
                        : currentTags.filter((t) => t !== tag);
                      onFilterChange({ tags: newTags });
                    }}
                    className="cursor-pointer text-[#f5f5dc]"
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Assignment Dropdown */}
          {workspaceMembers.length > 0 && (
            <DropdownMenu open={showAssignDropdown} onOpenChange={setShowAssignDropdown}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all bg-[#f5f5dc]/5 text-[#f5f5dc]/50 hover:bg-[#f5f5dc]/10">
                  <Users className="h-3 w-3" />
                  Assigned
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-[#0a1229] border-[#d4af37]/20">
                <DropdownMenuItem
                  onClick={() => onFilterChange({ assigned: "all" })}
                  className={cn(
                    "cursor-pointer text-[#f5f5dc]",
                    filter.assigned === "all" && "bg-[#d4af37]/20 text-[#f9d976]"
                  )}
                >
                  All
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onFilterChange({ assigned: "unassigned" })}
                  className={cn(
                    "cursor-pointer text-[#f5f5dc]",
                    filter.assigned === "unassigned" && "bg-[#d4af37]/20 text-[#f9d976]"
                  )}
                >
                  Unassigned
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#d4af37]/10" />
                {workspaceMembers.map((member) => (
                  <DropdownMenuItem
                    key={member.user_id}
                    onClick={() => onFilterChange({ assigned: member.user_id })}
                    className={cn(
                      "cursor-pointer text-[#f5f5dc]",
                      filter.assigned === member.user_id && "bg-[#d4af37]/20 text-[#f9d976]"
                    )}
                  >
                    {member.full_name || member.email}
                    {member.user_id === currentUserId && <span className="ml-2 text-[#10b981]">(You)</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {bulkMode && selectedThreadIds.size > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-[#10b981]/30 bg-[#10b981]/10 p-2">
            <span className="text-xs font-medium text-[#10b981]">
              {selectedThreadIds.size} thread{selectedThreadIds.size > 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onBulkAction?.("status", "open")}
                className="h-7 px-2 text-xs text-[#f5f5dc]"
              >
                Open
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onBulkAction?.("status", "closed")}
                className="h-7 px-2 text-xs text-[#f5f5dc]"
              >
                Close
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onBulkAction?.("assign", currentUserId)}
                className="h-7 px-2 text-xs text-[#f5f5dc]"
              >
                Assign to me
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Save View Dialog */}
      {showSaveViewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSaveViewDialog(false)}>
          <div className="w-full max-w-md rounded-xl border border-[#d4af37]/20 bg-[#0a1229] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-[#f9d976]">Save Current View</h3>
            <Input
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="Enter view name..."
              className="mb-4 bg-[#050a18] border-[#d4af37]/20 text-[#f5f5dc]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newViewName.trim()) {
                  onSaveView?.(newViewName.trim(), filter);
                  setNewViewName("");
                  setShowSaveViewDialog(false);
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setNewViewName("");
                  setShowSaveViewDialog(false);
                }}
                className="text-[#f5f5dc]/50"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (newViewName.trim()) {
                    onSaveView?.(newViewName.trim(), filter);
                    setNewViewName("");
                    setShowSaveViewDialog(false);
                  }
                }}
                disabled={!newViewName.trim()}
                className="bg-[#d4af37] text-[#0a1229] hover:bg-[#f9d976]"
              >
                Save View
              </Button>
            </div>
          </div>
        </div>
      )}

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
                slaHours={slaHours}
                nowMs={nowMs}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* CONTACT CARD */

interface ContactCardProps {
  thread: Thread;
  isSelected: boolean;
  onClick: () => void;
  slaHours?: number;
  nowMs?: number;
}

function ContactCard({ thread, isSelected, onClick, slaHours = 24, nowMs = 0 }: ContactCardProps) {
  const hasUnread = (thread.unread_count ?? 0) > 0;
  const isVip = thread.contact?.is_vip ?? false;
  const fullId = thread.contact?.display_name ?? thread.external_thread_id ?? "Unknown";
  const lastMessageAt = thread.last_message_at ? new Date(thread.last_message_at) : null;
  const hoursSinceLast =
    lastMessageAt && !Number.isNaN(lastMessageAt.getTime())
      ? (nowMs - lastMessageAt.getTime()) / (1000 * 60 * 60)
      : null;
  const isStale = typeof hoursSinceLast === "number" && hoursSinceLast > slaHours;

  return (
    <motion.button
      variants={listItemVariants}
      onClick={onClick}
      className={cn(
        "group relative mb-1 flex w-full items-start gap-3 rounded-xl p-3 pl-4 text-left transition-all",
        isSelected
          ? "border border-[#d4af37]/50 bg-gradient-to-r from-[#0d2344] via-[#0a1229] to-[#050a18] shadow-[0_0_24px_rgba(212,175,55,0.35)]"
          : "border border-transparent bg-[#050a18]/40 hover:border-[#d4af37]/20 hover:bg-[#0a1229]/60"
      )}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-[#f9d976] via-[#d4af37] to-[#a5720d] shadow-[0_0_14px_rgba(249,217,118,0.55)]" />
      )}
      {isStale && !isSelected && (
        <div className="absolute right-0 top-1/2 h-10 w-1.5 -translate-y-1/2 rounded-full bg-[#e11d48]/60 shadow-[0_0_18px_rgba(225,29,72,0.45)]" />
      )}

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
          <p
            className={cn(
              "truncate text-sm font-semibold",
              hasUnread ? "text-[#f5f5dc]" : "text-[#f5f5dc]/80"
            )}
            title={fullId}
          >
            {fullId}
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

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   COLUMN 2: CHAT TERMINAL with Enhanced Composer
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

interface ChatTerminalProps {
  thread: Thread | null;
  messages: Message[];
  loading?: boolean;
  error?: string | null;
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
  allowSend: boolean;
  sendDisabledReason?: string | null;
  sendDisabledCtaHref?: string | null;
  sendDisabledCtaLabel?: string | null;
  sessionInfo: SessionInfo | null;
  optOutDetected?: boolean;
  onEscalate?: () => void;
  escalating?: boolean;
  threadStatus?: string | null;
  telemetry?: TelemetrySnapshot | null;
  telemetryLoading?: boolean;
  animationsEnabled?: boolean;
  onToggleAnimations?: () => void;
}

export function ChatTerminal({
  thread,
  messages,
  loading,
  error,
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
  allowSend,
  sendDisabledReason,
  sendDisabledCtaHref,
  sendDisabledCtaLabel,
  sessionInfo,
  optOutDetected,
  onEscalate,
  escalating,
  threadStatus,
  telemetry,
  telemetryLoading,
  animationsEnabled = true,
  onToggleAnimations,
}: ChatTerminalProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showSlashMenu = composerValue.startsWith("/");
  const slashFilter = showSlashMenu ? composerValue.slice(1).toLowerCase() : "";
  const normalizeThroughput = (buckets: { count: number }[]) => {
    if (!buckets.length) return [];
    const trimmed = buckets.slice(-24);
    const max = Math.max(...trimmed.map((b) => b.count), 1);
    return trimmed.map((b) => Math.round((b.count / max) * 90) + 5);
  };
  const fallbackSeries = useMemo(
    () => Array.from({ length: 18 }, (_, idx) => 40 + (idx % 6) * 8),
    []
  );
  const pulseMetrics = useMemo(
    () => ({
      incoming: telemetry?.incomingToday ?? 128,
      responseMs: telemetry?.avgResponseMs ?? null,
      automation: telemetry?.automationRate ?? 64,
    }),
    [telemetry]
  );
  const filteredCanned = cannedResponses.filter(
    (r) => r.shortcut.toLowerCase().includes(slashFilter) || r.body.toLowerCase().includes(slashFilter)
  );
  const seriesForGraph = useMemo(() => {
    if (telemetry?.throughput?.length) return normalizeThroughput(telemetry.throughput);
    return fallbackSeries;
  }, [telemetry, fallbackSeries]);
  const systemPulsePath = useMemo(() => {
    if (seriesForGraph.length === 0) return "";
    const max = 100;
    const min = 0;
    return seriesForGraph
      .map((value, idx) => {
        const x = (idx / Math.max(seriesForGraph.length - 1, 1)) * 100;
        const clamped = Math.max(min, Math.min(max, value));
        const y = 100 - clamped;
        return `${x},${y}`;
      })
      .join(" ");
  }, [seriesForGraph]);

  const sessionState = sessionInfo?.state ?? "unknown";
  const isExpired = sessionState === "expired";
  const composerDisabled = isExpired;
  const sendGate = sendDisabledReason
    ? sendDisabledReason
    : !allowSend
      ? "Workspace is read-only for messaging."
      : optOutDetected
        ? "Recipient requested opt-out; sending is blocked."
        : isExpired
          ? "24h session window expired. Send an approved template to continue."
          : null;
  const sendBlocked = Boolean(sendGate);
  const isTyping = composerValue.trim().length > 0;
  const aiAssistMode = isTyping || showSlashMenu;

  const handleSelectCanned = (response: CannedResponse) => {
    onComposerChange(response.body);
    textareaRef.current?.focus();
  };

  if (!mounted) {
    return <div className="flex-1 animate-pulse bg-[#050a18]" />;
  }

  if (!thread) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a1229] via-[#050a18] to-[#02060f] p-8 text-center">
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,217,118,0.08),transparent_35%),radial-gradient(circle_at_80%_40%,rgba(68,255,210,0.08),transparent_32%),radial-gradient(circle_at_60%_80%,rgba(225,29,72,0.08),transparent_30%)] opacity-70",
            !animationsEnabled && "hidden"
          )}
        />
        <div className="relative z-10 w-full max-w-4xl space-y-6 rounded-3xl border border-[#d4af37]/20 bg-[#050a18]/60 p-8 shadow-[0_0_36px_rgba(0,0,0,0.45),0_0_24px_rgba(212,175,55,0.15)] backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5f5dc]/50">
                <span className="inline-flex h-2 w-2 animate-ping rounded-full bg-[#22d3ee]" />
                System Pulse
              </p>
              <h3 className="mt-2 text-2xl font-bold text-[#f5f5dc]">Operational Telemetry</h3>
              <p className="mt-1 text-sm text-[#f5f5dc]/60">
                No thread selected. Monitoring live ingress, response health, and AI automation.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {onToggleAnimations && (
                <button
                  onClick={onToggleAnimations}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
                    animationsEnabled
                      ? "border-[#22d3ee]/40 bg-[#0b1d33]/70 text-[#22d3ee] shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                      : "border-[#f5f5dc]/20 bg-[#0b1d33]/40 text-[#f5f5dc]/60 hover:border-[#f5f5dc]/40"
                  )}
                >
                  {animationsEnabled ? "Animations On" : "Animations Off"}
                </button>
              )}
              <div className="rounded-2xl border border-[#22d3ee]/40 bg-[#0b1d33]/80 px-4 py-2 text-left shadow-[0_0_18px_rgba(34,211,238,0.25)]">
                <p className="text-[11px] uppercase tracking-wide text-[#22d3ee]">Live Link</p>
                <p className="font-mono text-lg text-[#f5f5dc]">WHATSAPP-PIPE</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-gradient-to-br from-[#0d2344] to-[#050a18] p-4 text-left shadow-[0_0_22px_rgba(212,175,55,0.15)]">
              <div className="absolute right-4 top-4 h-10 w-10 rounded-full bg-[#d4af37]/20 blur-2xl" />
              <p className="text-xs uppercase tracking-wide text-[#f9d976]">Incoming Today</p>
              <p className="mt-2 text-3xl font-bold text-[#f5f5dc]">
                {telemetryLoading ? "…" : pulseMetrics.incoming}
              </p>
              <p className="text-[11px] text-[#f5f5dc]/50">Messages ingested</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-[#22d3ee]/30 bg-gradient-to-br from-[#0b2a3f] to-[#050a18] p-4 text-left shadow-[0_0_22px_rgba(34,211,238,0.15)]">
              <div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-[#22d3ee]/10 blur-2xl" />
              <p className="text-xs uppercase tracking-wide text-[#22d3ee]">Average Response</p>
              <p className="mt-2 text-3xl font-bold text-[#f5f5dc]">
                {telemetryLoading ? "…" : pulseMetrics.responseMs !== null ? `${pulseMetrics.responseMs} ms` : "—"}
              </p>
              <p className="text-[11px] text-[#f5f5dc]/50">Median operator latency</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-[#10b981]/30 bg-gradient-to-br from-[#0c2f27] to-[#050a18] p-4 text-left shadow-[0_0_22px_rgba(16,185,129,0.15)]">
              <div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-[#10b981]/15 blur-2xl" />
              <p className="text-xs uppercase tracking-wide text-[#10b981]">AI Automation</p>
              <p className="mt-2 text-3xl font-bold text-[#f5f5dc]">
                {telemetryLoading ? "…" : `${pulseMetrics.automation}%`}
              </p>
              <p className="text-[11px] text-[#f5f5dc]/50">Flows autonomously resolved</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#050a18]/70 p-5 shadow-[0_0_18px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d4af37]/10">
                  <Activity className="h-4 w-4 text-[#d4af37]" />
                </div>
                <div className="text-left">
                  <p className="text-xs uppercase tracking-wide text-[#f5f5dc]/50">Throughput Flow</p>
                  <p className="text-sm text-[#f5f5dc]/80">Linear telemetry · refreshed live</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#f5f5dc]/50">
                <span className="flex h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                {telemetryLoading ? "Syncing..." : "Live feed"}
                {telemetry?.generatedAt && (
                  <span className="text-[10px] text-[#f5f5dc]/40">
                    Updated {formatTime(telemetry.generatedAt)}
                  </span>
                )}
              </div>
            </div>
            <div className="relative h-40 overflow-hidden rounded-xl border border-[#d4af37]/20 bg-gradient-to-b from-[#0a1229] to-[#050a18]">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                <defs>
                  <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f9d976" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#e11d48" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                <polyline
                  fill="none"
                  stroke="url(#pulseGradient)"
                  strokeWidth="2.4"
                  points={systemPulsePath}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <polyline
                  fill="url(#pulseGradient)"
                  opacity="0.08"
                  points={`${systemPulsePath} 100,100 0,100`}
                />
              </svg>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(249,217,118,0.06),transparent_45%),radial-gradient(circle_at_80%_50%,rgba(34,211,238,0.08),transparent_40%)]" />
              <div className="absolute left-0 top-1/2 h-px w-full bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col bg-gradient-to-b from-[#0a1229] to-[#050a18]">
      <div className="pointer-events-none absolute inset-0 batik-pattern opacity-[0.03]" aria-hidden="true" />

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
            <p className="font-semibold text-[#f5f5dc]">{thread.contact?.display_name ?? thread.external_thread_id}</p>
            <p className="text-xs text-[#f5f5dc]/40">{thread.contact?.phone ?? "No phone"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sessionInfo && (
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide",
                sessionInfo.state === "active"
                  ? "bg-[#10b981]/20 text-[#10b981]"
                  : sessionInfo.state === "expired"
                    ? "bg-[#e11d48]/20 text-[#e11d48]"
                    : "bg-[#6b7280]/20 text-[#e5e7eb]"
              )}
            >
              {sessionInfo.state === "active"
                ? "Session Active"
                : sessionInfo.state === "expired"
                  ? "Session Expired"
                  : "Session Unknown"}
            </span>
          )}
          {threadStatus && (
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide",
                threadStatus === "escalated"
                  ? "bg-[#e11d48]/20 text-[#e11d48]"
                  : "bg-[#d4af37]/10 text-[#d4af37]"
              )}
            >
              {threadStatus}
            </span>
          )}
          {onEscalate && (
            <button
              onClick={onEscalate}
              disabled={escalating}
              className="flex items-center gap-1 rounded-lg border border-[#e11d48]/40 bg-[#e11d48]/10 px-3 py-1.5 text-xs font-semibold text-[#e11d48] transition-all hover:border-[#e11d48]/70 hover:bg-[#e11d48]/20 disabled:opacity-60"
            >
              {escalating ? (
                <div className="h-3 w-3 animate-spin rounded-full border border-[#e11d48] border-t-transparent" />
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5" />
                  Escalate
                </>
              )}
            </button>
          )}
          {viewingAgents && viewingAgents.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="mr-1 text-xs text-[#f5f5dc]/40">Viewing:</span>
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
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#e11d48]/30 bg-[#e11d48]/10 p-4 text-center text-xs text-[#fecdd3]">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
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
              <MessageBubble key={msg.id} message={msg} onReply={onReply} onStar={onStar} onForward={onForward} />
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-[#d4af37]/10 p-4">
        <div className="mb-3 grid gap-2 md:grid-cols-2">
          <div
            className={cn(
              "flex items-center justify-between rounded-xl border px-3 py-2 text-xs",
              sessionInfo?.active
                ? "border-[#10b981]/30 bg-[#10b981]/10 text-[#d1fae5]"
                : "border-[#e11d48]/30 bg-[#e11d48]/10 text-[#fecdd3]"
            )}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide">Session Window</p>
              <p className="text-[11px] opacity-80">
                {sessionInfo?.active
                  ? `${sessionInfo.remainingMinutes ?? 0}m left • last inbound ${sessionInfo.lastInboundAt ? formatTime(sessionInfo.lastInboundAt) : "unknown"}`
                  : "Expired • send an approved template"}
              </p>
            </div>
            <Clock className="h-4 w-4 flex-shrink-0" />
          </div>
          <div
            className={cn(
              "flex items-center justify-between rounded-xl border px-3 py-2 text-xs",
              optOutDetected
                ? "border-[#e11d48]/30 bg-[#e11d48]/10 text-[#fecdd3]"
                : "border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5f5dc]"
            )}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide">Opt-Out Guard</p>
              <p className="text-[11px] opacity-80">
                {optOutDetected
                  ? "Customer asked to stop. Do not message."
                  : "No opt-out detected. Keep responses compliant."}
              </p>
            </div>
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          </div>
        </div>

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
                    <div className="flex-shrink-0 rounded bg-[#d4af37]/20 px-1.5 py-0.5 font-mono text-[10px] text-[#d4af37]">/{r.shortcut}</div>
                    <p className="line-clamp-2 flex-1 text-xs text-[#f5f5dc]/70">{r.body}</p>
                  </button>
                ))
              ) : (
                <p className="px-2 py-4 text-center text-xs text-[#f5f5dc]/30">No matching responses</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {sendGate && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#e11d48]/30 bg-[#e11d48]/10 px-4 py-2 text-xs text-[#f5f5dc]">
            <span className="flex-1">{sendGate}</span>
            {sendDisabledCtaHref && (
              <Link
                href={sendDisabledCtaHref}
                className="rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1 text-[11px] font-semibold text-[#d4af37] transition-all hover:bg-[#d4af37]/20"
              >
                {sendDisabledCtaLabel ?? "Fix in Connections"}
              </Link>
            )}
            {isExpired && onOpenTemplates && (
              <button
                onClick={onOpenTemplates}
                className="rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1 text-[11px] font-semibold text-[#d4af37] transition-all hover:bg-[#d4af37]/20"
              >
                Send Template
              </button>
            )}
          </div>
        )}

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
              className="flex items-center gap-1.5 rounded-lg border border-[#e11d48]/30 bg-gradient-to-r from-[#e11d48]/10 to-[#d4af37]/10 px-3 py-1.5 text-xs font-semibold text-[#e11d48] transition-all hover:from-[#e11d48]/20 hover:to-[#d4af37]/20 disabled:cursor-not-allowed disabled:opacity-60"
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

        <div
          className={cn(
            "relative z-10 flex items-end gap-3 rounded-2xl border border-transparent p-1 transition-all",
            aiAssistMode && "border-[#22d3ee]/30 shadow-[0_0_24px_rgba(34,211,238,0.15)]"
          )}
        >
          {aiAssistMode && (
            <div className="absolute -top-4 right-16 flex items-center gap-2 rounded-full border border-[#22d3ee]/40 bg-[#0a1229]/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#22d3ee] shadow-[0_0_12px_rgba(34,211,238,0.2)]">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[#22d3ee]" />
              AI Suggestion Mode
            </div>
          )}
          <div className="flex gap-1">
            <button title="Attach file" className="rounded-lg p-2 text-[#f5f5dc]/40 hover:bg-[#f5f5dc]/10 hover:text-[#f5f5dc]">
              <Paperclip className="h-5 w-5" />
            </button>
            <button title="Attach image" className="rounded-lg p-2 text-[#f5f5dc]/40 hover:bg-[#f5f5dc]/10 hover:text-[#f5f5dc]">
              <ImageIcon className="h-5 w-5" />
            </button>
          </div>
          <div className={cn("relative flex-1 transition-all", aiAssistMode && "shadow-[0_0_20px_rgba(34,211,238,0.12)]")}>
            <button
              onClick={onGenerateAIDraft}
              disabled={aiDraftLoading}
              title="Draft with Gigaviz AI"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-lg p-1.5 text-[#e11d48] transition-all hover:bg-[#e11d48]/10 hover:shadow-[0_0_12px_rgba(225,29,72,0.4)] disabled:opacity-50"
            >
              <Wand2 className={cn("h-4 w-4", aiDraftLoading && "animate-pulse")} />
            </button>
            <textarea
              ref={textareaRef}
              value={composerValue}
              onChange={(e) => onComposerChange(e.target.value)}
              disabled={composerDisabled}
              placeholder={
                optOutDetected
                  ? "Opt-out detected. Do not message this contact."
                  : isExpired
                    ? "Session expired. Send a template to resume."
                    : "Type a message, use / for canned responses"
              }
              rows={1}
              className={cn(
                "w-full resize-none rounded-2xl border border-[#d4af37]/20 bg-[#0a1229] pl-10 pr-12 py-3 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 disabled:cursor-not-allowed disabled:border-[#e11d48]/40 disabled:bg-[#0a1229]/60",
                aiAssistMode && "border-[#22d3ee]/40 bg-[#0f1f3a]/90 shadow-[0_0_28px_rgba(34,211,238,0.2)]"
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !showSlashMenu) {
                  e.preventDefault();
                  if (!sendBlocked) onSend();
                }
                if (e.key === "Escape" && showSlashMenu) {
                  onComposerChange("");
                }
              }}
            />
            <button title="Add emoji" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#f5f5dc]/40 hover:text-[#f5f5dc]">
              <Smile className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={onSend}
            disabled={!composerValue.trim() || sending || showSlashMenu || sendBlocked || composerDisabled}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl transition-all",
              composerValue.trim() && !showSlashMenu && !sendBlocked && !composerDisabled
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

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   MESSAGE BUBBLE - Enhanced Imperium Aesthetics
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

interface MessageBubbleProps {
  message: Message;
  onReply?: (id: string) => void;
  onStar?: (id: string) => void;
  onForward?: (id: string) => void;
}

function MessageBubble({ message, onReply, onStar, onForward }: MessageBubbleProps) {
  const isOutbound = ["out", "outbound", "outgoing"].includes(message.direction);
  const text = message.text_body ?? (message.content_json as { text?: string })?.text ?? "";
  // Derive status: if null but outbound with sent_at, treat as 'sent'
  const rawStatus = message.status?.toLowerCase() ?? null;
  const derivedStatus = rawStatus ?? (isOutbound && message.sent_at ? "sent" : null);
  const statusUpdatedAt = message.status_updated_at ?? message.sent_at ?? message.created_at ?? null;
  const timestamp = message.created_at ?? message.wa_timestamp;
  const isTemplate = message.msg_type === "template";
  const errorReason = message.error_reason ?? message.error_message ?? null;

  const statusMeta = (() => {
    if (!isOutbound) return null;
    const updatedAtLabel = statusUpdatedAt ? new Date(statusUpdatedAt).toLocaleString() : null;

    switch (derivedStatus) {
      case "sending":
      case "pending":
      case "queued":
        return {
          label: derivedStatus === "queued" ? "Queued" : "Sending",
          icon: <Clock className="h-3 w-3 animate-pulse text-[#9ca3af]" />,
          tooltip: updatedAtLabel ? `${derivedStatus === "queued" ? "Queued" : "Sending"} · ${updatedAtLabel}` : "Queued for delivery",
        } as const;
      case "sent":
        return {
          label: "Sent",
          icon: <Check className="h-3 w-3 text-[#9ca3af]" />,
          tooltip: updatedAtLabel ? `Sent · ${updatedAtLabel}` : "Sent to WhatsApp",
        } as const;
      case "delivered":
        return {
          label: "Delivered",
          icon: <CheckCheck className="h-3 w-3 text-[#e5e7eb]" />,
          tooltip: updatedAtLabel ? `Delivered · ${updatedAtLabel}` : "Delivered to device",
        } as const;
      case "read":
      case "seen":
        return {
          label: "Read",
          icon: <CheckCheck className="h-3 w-3 text-[#38bdf8]" />,
          tooltip: updatedAtLabel ? `Read · ${updatedAtLabel}` : "Read by recipient",
        } as const;
      case "failed":
      case "undelivered":
      case "error":
        return {
          label: "Failed",
          icon: <AlertCircle className="h-3 w-3 text-[#e11d48]" />,
          tooltip: errorReason
            ? `Failed: ${errorReason}`
            : updatedAtLabel
              ? `Failed · ${updatedAtLabel}`
              : "Delivery failed",
        } as const;
      default:
        // If still no status, show pending clock for outbound
        return {
          label: derivedStatus ? derivedStatus : "Pending",
          icon: derivedStatus ? <Check className="h-3 w-3 text-[#9ca3af]" /> : <Clock className="h-3 w-3 text-[#9ca3af]" />,
          tooltip: updatedAtLabel ? `Status: ${derivedStatus ?? "pending"} · ${updatedAtLabel}` : "Awaiting delivery status",
        } as const;
    }
  })();

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
            <button title="Play audio" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e11d48] text-white hover:bg-[#e11d48]/80">
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
          {isTemplate && <span className="rounded-full border border-current px-2 py-[2px] text-[9px] uppercase">Template</span>}
          {statusMeta && (
            <span className="inline-flex items-center gap-1" title={statusMeta.tooltip}>
              <span className="opacity-70">{statusMeta.label}</span>
              {statusMeta.icon}
            </span>
          )}
          {statusMeta?.label === "Failed" && errorReason && (
            <span className="truncate text-[#fca5a5]" title={errorReason}>
              {errorReason}
            </span>
          )}
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
                title="Reply"
                className="rounded p-1.5 text-[#f5f5dc]/60 hover:bg-[#f5f5dc]/10 hover:text-[#f5f5dc]"
              >
                <Reply className="h-3.5 w-3.5" />
              </button>
            )}
            {onStar && (
              <button
                onClick={() => onStar(message.id)}
                title="Star message"
                className="rounded p-1.5 text-[#f5f5dc]/60 hover:bg-[#f5f5dc]/10 hover:text-[#d4af37]"
              >
                <Star className="h-3.5 w-3.5" />
              </button>
            )}
            {onForward && (
              <button
                onClick={() => onForward(message.id)}
                title="Forward"
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

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   COLUMN 3: CRM SIDEBAR with Team Notes & Media Gallery
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

interface CRMSidebarProps {
  contact: ContactDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLabels?: (labels: string[]) => void;
  onAddNote?: (body: string) => void;
  onToggleVIP?: () => void;
  mediaItems?: MediaItem[];
  sentimentScore?: number;
  sentimentLabel?: string;
  sentimentText?: string;
  nowMs?: number;
}

export function CRMSidebar({
  contact,
  isOpen,
  onClose,
  onUpdateLabels,
  onAddNote,
  onToggleVIP,
  mediaItems = [],
  sentimentScore,
  sentimentLabel,
  sentimentText,
  nowMs = 0,
}: CRMSidebarProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteValue, setNoteValue] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "media">("details");
  const profileAura = useMemo(() => {
    if (!contact) {
      return {
        label: "New Lead",
        ring: "bg-gradient-to-br from-[#0f172a] via-[#0a1229] to-[#050a18] shadow-[0_0_22px_rgba(34,211,238,0.05)]",
        chip: "border-[#22d3ee]/40 bg-[#22d3ee]/10 text-[#22d3ee]",
      };
    }
    if (contact.is_vip) {
      return {
        label: "VIP",
        ring: "bg-gradient-to-br from-[#f9d976] via-[#d4af37] to-[#a5720d] shadow-[0_0_22px_rgba(212,175,55,0.45)]",
        chip: "border-[#d4af37]/50 bg-[#d4af37]/15 text-[#d4af37]",
      };
    }
    if (contact.labels?.some((l) => l.toLowerCase().includes("verified"))) {
      return {
        label: "Verified",
        ring: "bg-gradient-to-br from-[#22d3ee] via-[#0ea5e9] to-[#0b4f7f] shadow-[0_0_22px_rgba(34,211,238,0.35)]",
        chip: "border-[#22d3ee]/50 bg-[#22d3ee]/15 text-[#22d3ee]",
      };
    }
    return {
      label: "New Lead",
      ring: "bg-gradient-to-br from-[#4ade80] via-[#22d3ee] to-[#0ea5e9] shadow-[0_0_22px_rgba(74,222,128,0.25)]",
      chip: "border-[#4ade80]/40 bg-[#4ade80]/10 text-[#4ade80]",
    };
  }, [contact]);
  const moodScore = useMemo(() => {
    if (typeof sentimentScore === "number") return Math.max(5, Math.min(95, Math.round(sentimentScore)));
    if (!contact) return 48;
    const base = contact.is_vip ? 72 : 58;
    const activityBoost = (contact.activity_timeline?.length ?? 0) * 3;
    const notesBoost = (contact.notes?.length ?? 0) * 2;
    const lastSeenMs = contact.last_seen_at ? new Date(contact.last_seen_at).getTime() : null;
    const recencyPenalty =
      lastSeenMs && Number.isFinite(lastSeenMs)
        ? Math.min(18, (nowMs - lastSeenMs) / (1000 * 60 * 60 * 24))
        : 0;
    return Math.min(95, Math.max(12, Math.round(base + activityBoost + notesBoost - recencyPenalty)));
  }, [contact, sentimentScore, nowMs]);
  const moodLabel =
    sentimentLabel ??
    (moodScore >= 70 ? "Calm" : moodScore >= 45 ? "Neutral" : "Alert");
  const lastInteraction = contact?.activity_timeline?.[0];
  const quickStats = useMemo(
    () => [
      {
        label: "Contact ID",
        value: contact?.id ? contact.id : "n/a",
        accent: "#d4af37",
        monospace: true,
      },
      {
        label: "Last Interaction",
        value:
          lastInteraction?.description ??
          (contact?.last_seen_at && !Number.isNaN(new Date(contact.last_seen_at).getTime())
            ? formatTime(contact.last_seen_at)
            : "No recent touch"),
        accent: "#22d3ee",
      },
      {
        label: "Status",
        value: profileAura.label,
        accent: "#4ade80",
      },
      {
        label: "Mood",
        value: `${moodScore}% ${moodLabel}`,
        accent: moodScore >= 70 ? "#22c55e" : moodScore >= 45 ? "#eab308" : "#ef4444",
      },
    ],
    [contact, lastInteraction, profileAura.label, moodLabel, moodScore]
  );

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
              title="Close sidebar"
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
                  <div className="mb-6 flex flex-col items-center text-center gap-3">
                    <div className="relative flex flex-col items-center gap-3 pb-2">
                      <div className={cn("relative h-24 w-24 rounded-full p-[3px] transition-all", profileAura.ring)}>
                        <div
                          className={cn(
                            "flex h-full w-full items-center justify-center rounded-full text-2xl font-bold",
                            contact.is_vip
                              ? "bg-gradient-to-br from-[#d4af37] to-[#b8962e] text-[#050a18]"
                              : "bg-[#0f1b33] text-[#f5f5dc]"
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
                      <div className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide", profileAura.chip)}>
                        {profileAura.label}
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-[#f5f5dc]">{contact.display_name ?? "Unknown"}</h4>
                    {contact.phone && (
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <p className="max-w-[180px] truncate font-mono text-xs text-[#f5f5dc]/60">
                                {formatPhoneShort(contact.phone ?? "")}
                              </p>
                              <button
                                type="button"
                                aria-label="Copy phone number"
                                className="rounded p-1 text-[#f5f5dc]/60 transition hover:bg-[#f5f5dc]/10 hover:text-[#f5f5dc]"
                                onClick={() => navigator.clipboard.writeText(contact.phone ?? "")}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">{contact.phone}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
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

                  {/* Customer Mood Scan */}
                  <div className="mb-6 space-y-3 rounded-2xl border border-[#d4af37]/10 bg-[#050a18]/70 p-4 shadow-[0_0_14px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-1 items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#0c2f27]">
                          <Activity className="h-4 w-4 text-[#10b981]" />
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#10b981] leading-tight">Customer Mood Scan</p>
                          <p className="text-[11px] text-[#f5f5dc]/60 leading-snug">AI-toned sentiment trajectory</p>
                          <p className="text-[11px] text-[#f5f5dc]/70 leading-snug">{moodLabel}</p>
                        </div>
                      </div>
                      <span className="self-center shrink-0 rounded-full bg-[#10b981]/15 px-3 py-1.5 text-xs font-semibold text-[#10b981]">
                        {moodScore}%
                      </span>
                    </div>
                    <div className="relative h-3 overflow-hidden rounded-full bg-[#0a1229]">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#22c55e] via-[#eab308] to-[#ef4444] transition-all"
                        style={{ width: `${moodScore}%` }}
                      />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.15),transparent_35%)] opacity-40" />
                    </div>
                    <div className="flex justify-between px-0.5 text-[10px] uppercase tracking-wide text-[#f5f5dc]/40">
                      <span>Calm</span>
                      <span>Neutral</span>
                      <span>Alert</span>
                    </div>
                    {sentimentText && (
                      <p className="line-clamp-2 pt-1 text-center text-[11px] italic text-[#f5f5dc]/60">
                        “{sentimentText.slice(0, 140)}{sentimentText.length > 140 ? "…" : ""}”
                      </p>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
                    {quickStats.map((stat) => {
                      const isLastInteraction = stat.label.toLowerCase() === "last interaction";
                      const isContactId = stat.label.toLowerCase() === "contact id";
                      return (
                        <div
                        key={stat.label}
                        className={cn(
                          "flex min-h-[110px] flex-col items-center justify-center rounded-xl border border-[#d4af37]/15 bg-[#0a1229]/70 px-4 py-4 text-center shadow-[0_0_12px_rgba(0,0,0,0.25)] backdrop-blur",
                          isLastInteraction && "col-span-2 md:col-span-1"
                        )}
                      >
                        <p className="text-[10px] uppercase tracking-wide text-[#f5f5dc]/50">{stat.label}</p>
                        <p
                          className={cn(
                            "mt-2 text-sm font-semibold leading-snug",
                            stat.monospace ? "font-mono text-xs" : "",
                            stat.accent ? "" : "text-[#f5f5dc]"
                          )}
                          style={{ color: stat.accent }}
                        >
                          <span
                            className={cn(
                              "block max-w-[140px]",
                              isContactId ? "truncate" : "line-clamp-2"
                            )}
                            title={stat.value}
                          >
                            {stat.value}
                          </span>
                        </p>
                      </div>
                      );
                    })}
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
                        <button title="Add label" className="text-[#f5f5dc]/40 hover:text-[#f5f5dc]">
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
                              {note.author_name ?? "Team"} ΓÇó {formatTime(note.created_at)}
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
                            <button title="Download" className="rounded-full bg-[#d4af37] p-2 text-[#050a18] hover:bg-[#f9d976]">
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

interface DemoChecklistPanelProps {
  sessionInfo: SessionInfo | null;
  optOutDetected?: boolean;
  allowSend: boolean;
  threadStatus?: string | null;
}

export function DemoChecklistPanel({ sessionInfo, optOutDetected, allowSend, threadStatus }: DemoChecklistPanelProps) {
  const items = [
    { label: "24h session active", ok: sessionInfo?.state === "active" },
    { label: "No opt-out detected", ok: !optOutDetected },
    { label: "Workspace can send", ok: allowSend },
    { label: "Thread not escalated", ok: threadStatus !== "escalated" },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 rounded-2xl border border-[#d4af37]/20 bg-[#050a18]/95 p-4 shadow-2xl backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#f5f5dc]">Demo Checklist</p>
        <span className="text-[10px] uppercase tracking-wide text-[#f5f5dc]/40">Compliance</span>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs text-[#f5f5dc]/80">
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border",
                item.ok
                  ? "border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981]"
                  : "border-[#e11d48]/40 bg-[#e11d48]/10 text-[#e11d48]"
              )}
            >
              {item.ok ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            </div>
            <span className={item.ok ? "" : "text-[#fca5a5]"}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TemplateVariableModalProps {
  isOpen: boolean;
  template: ApprovedTemplate | null;
  variables: string[];
  onChange: (index: number, value: string) => void;
  onSend: () => void;
  onClose: () => void;
  sending?: boolean;
  preview?: string;
}

export function TemplateVariableModal({
  isOpen,
  template,
  variables,
  onChange,
  onSend,
  onClose,
  sending,
  preview,
}: TemplateVariableModalProps) {
  if (!isOpen || !template) return null;

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
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#f5f5dc]/50">Template</p>
            <h3 className="text-lg font-bold text-[#f5f5dc]">{template.name}</h3>
          </div>
          <button title="Close" onClick={onClose} className="rounded-lg p-1 text-[#f5f5dc]/40 hover:text-[#f5f5dc]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          {variables.length === 0 ? (
            <p className="text-sm text-[#f5f5dc]/60">No variables required for this template.</p>
          ) : (
            variables.map((value, idx) => (
              <div key={idx} className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-[#f5f5dc]/50">
                  Variable {idx + 1}
                </label>
                <input
                  value={value}
                  onChange={(e) => onChange(idx, e.target.value)}
                  className="w-full rounded-lg border border-[#d4af37]/30 bg-[#050a18]/60 px-3 py-2 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:border-[#d4af37]/60 focus:outline-none"
                  placeholder="Enter value"
                />
              </div>
            ))
          )}
        </div>

        {preview && (
          <div className="mt-4 rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-3">
            <p className="mb-2 text-[11px] uppercase tracking-wide text-[#f5f5dc]/50">Preview</p>
            <p className="whitespace-pre-wrap text-sm text-[#f5f5dc]/80">{preview}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-[#f5f5dc]/60 hover:text-[#f5f5dc]"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            disabled={sending}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
              sending
                ? "bg-[#f5f5dc]/10 text-[#f5f5dc]/40"
                : "bg-gradient-to-r from-[#d4af37] to-[#b8962e] text-[#050a18] hover:shadow-lg hover:shadow-[#d4af37]/30"
            )}
          >
            {sending ? (
              <div className="h-4 w-4 animate-spin rounded-full border border-[#050a18] border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Template
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   TEMPLATE SHORTCUT MODAL
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

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
          <button title="Close" onClick={onClose} className="rounded-lg p-1 text-[#f5f5dc]/40 hover:text-[#f5f5dc]">
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

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   FOOTER
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

export function ImperiumInboxFooter() {
  return (
    <footer className="border-t border-[#d4af37]/10 bg-[#050a18] py-4 text-center">
      <div className="text-xs leading-relaxed text-[#f5f5dc]/40">
        <p>
          Gigaviz is a Verified Technology Provider for solutions built on the
          WhatsApp Business Platform (Cloud API).
        </p>
        <p className="mt-2">WhatsApp and Meta are trademarks of Meta Platforms, Inc.</p>
      </div>
    </footer>
  );
}

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   HELPERS
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

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

function formatPhoneShort(phone: string): string {
  if (phone.length <= 9) return phone;
  const start = phone.slice(0, 5);
  const end = phone.slice(-4);
  return `${start}\u2026${end}`;
}
