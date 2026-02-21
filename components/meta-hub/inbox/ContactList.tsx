"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Search,
  MessageSquare,
  X,
  Plus,
  Crown,
  Inbox,
  Bell,
  UserCheck,
  Tag,
  Bookmark,
  ChevronDown,
  Trash2,
  CheckCircle2,
  Users,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/hooks/use-hydrated";
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
import type { Thread, FilterState, SavedView, WorkspaceMember } from "./types";
import { listVariants, listItemVariants, formatTime } from "./constants";

/* ═════════════════════════════════════════════════════════════════════
   COLUMN 1: CONTACT LIST with Smart Filter Tabs
   ═════════════════════════════════════════════════════════════════════ */

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
  const t = useTranslations("metaHubUI.inbox.contactList");
  const mounted = useHydrated();
  const [showSaveViewDialog, setShowSaveViewDialog] = useState(false);
  const [showViewsDropdown, setShowViewsDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [newViewName, setNewViewName] = useState("");

  // Preset views
  const presetViews: SavedView[] = [
    { id: "preset-open", name: t("presetOpen"), filters: { status: "open" } },
    { id: "preset-unassigned", name: t("presetUnassigned"), filters: { assigned: "unassigned" } },
    { id: "preset-my-threads", name: t("presetMyThreads"), filters: { assigned: currentUserId || "" } },
    { id: "preset-urgent", name: t("presetUrgent"), filters: { showVipOnly: true, quickTab: "unread" } },
    { id: "preset-needs-reply", name: t("presetNeedsReply"), filters: { quickTab: "unread", status: "open" } },
  ];

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
            {t("tabAll")}
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
            {t("tabUnread")}
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
            {t("tabMine")}
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
            {t("showing")} <span className="font-semibold text-[#f9d976]">{quickTabFiltered.length}</span> {t("of")}{" "}
            <span className="font-semibold">{threads.length}</span> {t("threads")}
          </span>
          {(filter.status !== "all" || filter.search || filter.showVipOnly || (filter.tags && filter.tags.length > 0)) && (
            <button
              onClick={() => onFilterChange({ status: "all", search: "", showVipOnly: false, tags: [] })}
              className="flex items-center gap-1 text-[#e11d48] hover:underline"
            >
              <X className="h-3 w-3" />
              {t("clearAll")}
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
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-[#d4af37]/20 bg-[#050a18] py-2.5 pl-10 pr-4 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
            />
          </div>

          {/* Saved Views Dropdown */}
          <DropdownMenu open={showViewsDropdown} onOpenChange={setShowViewsDropdown}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-xl border border-[#d4af37]/20 bg-[#050a18] px-3 py-2.5 text-sm font-medium text-[#f9d976] transition-all hover:bg-[#d4af37]/10 hover:border-[#d4af37]/40">
                <Bookmark className="h-4 w-4" />
                <span className="hidden sm:inline">{t("views")}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#0a1229] border-[#d4af37]/20">
              <DropdownMenuLabel className="text-[#f5f5dc]/50 text-xs">{t("presetViews")}</DropdownMenuLabel>
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
                  <DropdownMenuLabel className="text-[#f5f5dc]/50 text-xs">{t("myViews")}</DropdownMenuLabel>
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
                {t("saveCurrentView")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Dropdown */}
          <DropdownMenu open={showSortDropdown} onOpenChange={setShowSortDropdown}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-xl border border-[#d4af37]/20 bg-[#050a18] px-3 py-2.5 text-sm font-medium text-[#f9d976] transition-all hover:bg-[#d4af37]/10">
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">{t("sort")}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#0a1229] border-[#d4af37]/20">
              {[
                { value: "newest", label: t("newestFirst") },
                { value: "oldest", label: t("oldestFirst") },
                { value: "recent_reply", label: t("recentReply") },
                { value: "unread_first", label: t("unreadFirst") },
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
            {t("vipFilter")}
          </button>

          {/* Tags Dropdown */}
          {availableTags.length > 0 && (
            <DropdownMenu open={showTagDropdown} onOpenChange={setShowTagDropdown}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all bg-[#f5f5dc]/5 text-[#f5f5dc]/50 hover:bg-[#f5f5dc]/10">
                  <Tag className="h-3 w-3" />
                  {t("tags")}
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
                  {t("assigned")}
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
                  {t("assignedAll")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onFilterChange({ assigned: "unassigned" })}
                  className={cn(
                    "cursor-pointer text-[#f5f5dc]",
                    filter.assigned === "unassigned" && "bg-[#d4af37]/20 text-[#f9d976]"
                  )}
                >
                  {t("unassigned")}
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
                    {member.user_id === currentUserId && <span className="ml-2 text-[#10b981]">({t("you")})</span>}
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
              {selectedThreadIds.size} {t("selected")}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onBulkAction?.("status", "open")}
                className="h-7 px-2 text-xs text-[#f5f5dc]"
              >
                {t("bulkOpen")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onBulkAction?.("status", "closed")}
                className="h-7 px-2 text-xs text-[#f5f5dc]"
              >
                {t("bulkClose")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onBulkAction?.("assign", currentUserId)}
                className="h-7 px-2 text-xs text-[#f5f5dc]"
              >
                {t("bulkAssignToMe")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Save View Dialog */}
      {showSaveViewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSaveViewDialog(false)}>
          <div className="w-full max-w-md rounded-xl border border-[#d4af37]/20 bg-[#0a1229] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-[#f9d976]">{t("saveViewTitle")}</h3>
            <Input
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder={t("viewNamePlaceholder")}
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
                {t("cancel")}
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
                {t("saveView")}
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
            <p className="text-sm text-[#f5f5dc]/40">{t("noConversations")}</p>
            <p className="mt-1 text-xs text-[#f5f5dc]/30">
              {filter.quickTab === "unread" && t("allCaughtUp")}
              {filter.quickTab === "assigned" && t("noAssigned")}
              {filter.quickTab === "all" && t("startConversation")}
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

/* ═══════ CONTACT CARD ═══════ */

interface ContactCardProps {
  thread: Thread;
  isSelected: boolean;
  onClick: () => void;
  slaHours?: number;
  nowMs?: number;
}

function ContactCard({ thread, isSelected, onClick, slaHours = 24, nowMs = 0 }: ContactCardProps) {
  const t = useTranslations("metaHubUI.inbox.contactCard");
  const hasUnread = (thread.unread_count ?? 0) > 0;
  const isVip = thread.contact?.is_vip ?? false;
  const fullId = thread.contact?.display_name ?? thread.external_thread_id ?? t("unknown");
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
        <p className="mt-0.5 truncate text-xs text-[#f5f5dc]/50">{thread.last_message_preview ?? t("noMessages")}</p>
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
