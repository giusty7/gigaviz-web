"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  MenuIcon,
  XIcon,
  PanelRightIcon,
  MessageCircleIcon,
  PlusIcon,
  SearchIcon,
  Loader2Icon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  LightbulbIcon,
  PenLineIcon,
  FileTextIcon,
  SendIcon,
  StopCircleIcon,
  SparklesIcon,
  BotIcon,
  UserIcon,
  Zap,
  Crown,
  Shield,
  Settings,
  Gauge,
  AlertTriangle,
  ArrowDownIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { COPY_EN } from "@/lib/copy/en";
import { parseSSEStream } from "./use-sse-stream";
import type { HelperConversation, HelperMessage, HelperMode, HelperProvider, MessageStatus } from "./types";
import { relativeTime } from "./types";

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
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const messageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

type ApiConversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type ApiMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  provider_key?: HelperProvider | null;
  status?: MessageStatus | null;
};

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  initialConversations: ApiConversation[];
};

function toLocalConversation(c: ApiConversation): HelperConversation {
  return {
    id: c.id,
    title: c.title,
    messages: [],
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

function toLocalMessage(m: ApiMessage): HelperMessage {
  const providerFromMetadata = typeof m.metadata?.provider === "string" ? m.metadata.provider : null;
  const normalizedProvider =
    providerFromMetadata && providerFromMetadata !== "auto"
      ? (providerFromMetadata as HelperMessage["provider"])
      : m.provider_key && m.provider_key !== "auto"
        ? (m.provider_key as HelperMessage["provider"])
        : undefined;

  return {
    id: m.id,
    role: m.role === "user" ? "user" : "assistant",
    content: m.content,
    timestamp: m.created_at,
    provider: normalizedProvider,
    status: m.status ?? undefined,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM CONVERSATION LIST
   ═══════════════════════════════════════════════════════════════════════════ */

interface ConversationListProps {
  conversations: HelperConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  isCreating?: boolean;
}

function ImperiumConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  isCreating = false,
}: ConversationListProps) {
  const copy = COPY_EN.helper;
  const [query, setQuery] = useState("");
  const [renameDialog, setRenameDialog] = useState<{ id: string; title: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const filtered = query
    ? conversations.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
    : conversations;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex-none space-y-3 p-4 border-b border-[#d4af37]/20">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
            {copy.conversations}
          </h2>
          <Button
            size="sm"
            onClick={onNew}
            disabled={isCreating}
            className="gap-1.5 bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18] hover:from-[#f9d976] hover:to-[#d4af37]"
          >
            {isCreating ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
            {copy.new}
          </Button>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#f5f5dc]/40" />
          <Input
            placeholder={copy.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 border-[#d4af37]/20 bg-[#050a18]/60 text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:border-[#d4af37]/50"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="p-2 space-y-1"
        >
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <MessageSquareIcon className="h-8 w-8 text-[#d4af37]/30 mb-3" />
              <p className="text-sm text-[#f5f5dc]/50">
                {conversations.length === 0 ? copy.noConversations : "No matches found"}
              </p>
            </div>
          ) : (
            filtered.map((c) => (
              <motion.div
                key={c.id}
                variants={itemVariants}
                className={cn(
                  "group relative flex items-start gap-2 rounded-xl border p-3 transition-all cursor-pointer",
                  activeId === c.id
                    ? "border-[#d4af37]/60 bg-[#d4af37]/10 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                    : "border-[#f5f5dc]/10 bg-[#0a1229]/40 hover:border-[#d4af37]/30 hover:bg-[#0a1229]/60"
                )}
                onClick={() => onSelect(c.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight line-clamp-2 text-[#f5f5dc]">
                    {c.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-[#f5f5dc]/40">
                      {copy.updated} {relativeTime(c.updatedAt)}
                    </span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-[#f5f5dc]/50 hover:text-[#d4af37]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="border-[#d4af37]/20 bg-[#0a1229]">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameDialog({ id: c.id, title: c.title });
                      }}
                      className="text-[#f5f5dc] hover:bg-[#d4af37]/10"
                    >
                      <PencilIcon className="h-4 w-4 mr-2 text-[#d4af37]" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDialog(c.id);
                      }}
                      className="text-[#e11d48] hover:bg-[#e11d48]/10"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))
          )}
        </motion.div>
      </ScrollArea>

      {/* Rename Dialog */}
      <Dialog open={!!renameDialog} onOpenChange={() => setRenameDialog(null)}>
        <DialogContent className="border-[#d4af37]/20 bg-[#0a1229]">
          <DialogHeader>
            <DialogTitle className="text-[#f5f5dc]">Rename Conversation</DialogTitle>
          </DialogHeader>
          <Input
            value={renameDialog?.title ?? ""}
            onChange={(e) => setRenameDialog((prev) => prev ? { ...prev, title: e.target.value } : null)}
            className="border-[#d4af37]/20 bg-[#050a18] text-[#f5f5dc]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog(null)} className="border-[#f5f5dc]/20 text-[#f5f5dc]">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (renameDialog) {
                  onRename(renameDialog.id, renameDialog.title);
                  setRenameDialog(null);
                }
              }}
              className="bg-[#d4af37] text-[#050a18] hover:bg-[#f9d976]"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="border-[#e11d48]/20 bg-[#0a1229]">
          <DialogHeader>
            <DialogTitle className="text-[#f5f5dc]">Delete Conversation?</DialogTitle>
            <DialogDescription className="text-[#f5f5dc]/60">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)} className="border-[#f5f5dc]/20 text-[#f5f5dc]">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (deleteDialog) {
                  onDelete(deleteDialog);
                  setDeleteDialog(null);
                }
              }}
              className="bg-[#e11d48] text-white hover:bg-[#e11d48]/80"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM CHAT EMPTY STATE
   ═══════════════════════════════════════════════════════════════════════════ */

interface ChatEmptyStateProps {
  onPromptSelect: (prompt: string) => void;
  onCreateConversation: () => void;
  hasConversations: boolean;
}

const promptIcons = [
  <PenLineIcon key="pen" className="h-5 w-5" />,
  <FileTextIcon key="file" className="h-5 w-5" />,
  <MessageCircleIcon key="msg" className="h-5 w-5" />,
  <LightbulbIcon key="bulb" className="h-5 w-5" />,
];

function ImperiumChatEmptyState({ onPromptSelect, onCreateConversation, hasConversations }: ChatEmptyStateProps) {
  const copy = COPY_EN.helper.emptyState;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center h-full p-6 text-center"
    >
      <motion.div variants={itemVariants} className="mb-6">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 border border-[#d4af37]/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
          <SparklesIcon className="h-10 w-10 text-[#d4af37]" />
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent mb-2">
          {copy.title}
        </h3>
        <p className="text-sm text-[#f5f5dc]/60 max-w-sm">{copy.description}</p>
      </motion.div>

      {/* Suggested prompts */}
      <motion.div variants={containerVariants} className="grid gap-3 w-full max-w-md">
        {copy.suggestedPrompts.map((item, idx) => (
          <motion.button
            key={item.label}
            variants={itemVariants}
            onClick={() => {
              if (!hasConversations) {
                onCreateConversation();
              }
              onPromptSelect(item.prompt);
            }}
            className="group flex items-center gap-3 rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/60 p-4 text-left transition-all hover:border-[#d4af37]/50 hover:bg-[#0a1229]/80 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)]"
          >
            <div className="flex-none h-10 w-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] group-hover:bg-[#d4af37]/20 transition-colors">
              {promptIcons[idx % promptIcons.length]}
            </div>
            <span className="text-sm text-[#f5f5dc] group-hover:text-[#f9d976] transition-colors">
              {item.label}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {!hasConversations && (
        <motion.p variants={itemVariants} className="text-xs text-[#f5f5dc]/40 mt-6">
          {COPY_EN.helper.createFirst}
        </motion.p>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM MESSAGE LIST
   ═══════════════════════════════════════════════════════════════════════════ */

interface MessageListProps {
  messages: HelperMessage[];
  isProcessing: boolean;
  isLoading: boolean;
  onStop: () => void;
}

function ImperiumMessageList({ messages, isProcessing, isLoading, onStop }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll handler to track user position
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    isUserScrolledUp.current = !isAtBottom;
    setShowScrollButton(!isAtBottom && messages.length > 0);
  }, [messages.length]);

  // Track last message count to detect new messages
  const lastMessageCountRef = useRef(messages.length);

  // Auto-scroll only when user is at bottom OR initial load
  useEffect(() => {
    const hasNewMessage = messages.length > lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;

    if (!isUserScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (hasNewMessage) {
      // New message arrived while user is scrolled up - button already shown via handleScroll
    }
  }, [messages.length]);

  // Initial scroll to bottom on mount
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    isUserScrolledUp.current = false;
    setShowScrollButton(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2Icon className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-[#d4af37]/30 scrollbar-track-transparent" 
      ref={scrollRef}
      onScroll={handleScroll}
    >
      <div className="min-h-full flex flex-col justify-end p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              layout
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="flex-none h-8 w-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f9d976] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                  <BotIcon className="h-4 w-4 text-[#050a18]" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  msg.role === "user"
                    ? "bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18]"
                    : "border border-[#d4af37]/20 bg-[#0a1229]/80 text-[#f5f5dc]"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.status === "streaming" && (
                  <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                )}
                {msg.provider && msg.role === "assistant" && (
                  <p className="text-[10px] mt-2 opacity-60">via {msg.provider}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex-none h-8 w-8 rounded-full bg-[#e11d48]/20 border border-[#e11d48]/40 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-[#e11d48]" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToBottom}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4af37] text-[#050a18] shadow-lg shadow-[#d4af37]/30 hover:bg-[#f9d976] transition-colors"
          >
            <ArrowDownIcon className="h-4 w-4" />
            <span className="text-sm font-medium">New messages</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Stop button */}
      {isProcessing && (
        <div className="sticky bottom-4 flex justify-center">
          <Button
            onClick={onStop}
            variant="outline"
            size="sm"
            className="gap-2 border-[#e11d48]/40 bg-[#e11d48]/10 text-[#e11d48] hover:bg-[#e11d48]/20"
          >
            <StopCircleIcon className="h-4 w-4" />
            Stop
          </Button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM COMPOSER
   ═══════════════════════════════════════════════════════════════════════════ */

interface ComposerProps {
  mode: HelperMode;
  provider: HelperProvider;
  value: string;
  onModeChange: (mode: HelperMode) => void;
  onProviderChange: (provider: HelperProvider) => void;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  sending: boolean;
}

function ImperiumComposer({
  mode,
  provider,
  value,
  onModeChange,
  onProviderChange,
  onChange,
  onSend,
  disabled,
  sending,
}: ComposerProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={mode}
          onChange={(e) => onModeChange(e.target.value as HelperMode)}
          title="Select mode"
          className="h-8 rounded-lg border border-[#d4af37]/20 bg-[#050a18] px-3 text-xs text-[#f5f5dc] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30"
        >
          <option value="chat">💬 Chat</option>
          <option value="code">💻 Code</option>
          <option value="research">🔍 Research</option>
        </select>

        <select
          value={provider}
          onChange={(e) => onProviderChange(e.target.value as HelperProvider)}
          title="Select AI provider"
          className="h-8 rounded-lg border border-[#d4af37]/20 bg-[#050a18] px-3 text-xs text-[#f5f5dc] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30"
        >
          <option value="auto">✨ Auto</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="google">Google</option>
        </select>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-[#d4af37]/20 bg-[#050a18] px-4 py-3 text-sm text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:border-[#d4af37]/50 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 disabled:opacity-50"
        />
        <Button
          onClick={onSend}
          disabled={disabled || !value.trim() || sending}
          className="h-auto px-4 bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18] hover:from-[#f9d976] hover:to-[#d4af37] disabled:opacity-50"
        >
          {sending ? (
            <Loader2Icon className="h-5 w-5 animate-spin" />
          ) : (
            <SendIcon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMPERIUM WORKSPACE CONTROLS
   ═══════════════════════════════════════════════════════════════════════════ */

interface WorkspaceControlsProps {
  workspaceName: string;
  workspaceSlug: string;
  dailySpent: number;
  monthlySpent: number;
  monthlyCap: number;
  isOverBudget: boolean;
  allowAutomation: boolean;
  onAutomationChange: (value: boolean) => void;
  onQuickPrompt: (prompt: string) => void;
}

function ImperiumWorkspaceControls({
  workspaceName,
  dailySpent,
  monthlySpent,
  monthlyCap,
  isOverBudget,
  allowAutomation,
  onAutomationChange,
}: WorkspaceControlsProps) {
  const usagePercent = monthlyCap > 0 ? Math.min((monthlySpent / monthlyCap) * 100, 100) : 0;

  return (
    <div className="flex flex-col h-full p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 flex items-center justify-center">
          <Crown className="h-5 w-5 text-[#d4af37]" />
        </div>
        <div>
          <p className="text-xs text-[#f5f5dc]/50">Workspace</p>
          <p className="font-semibold text-[#f5f5dc]">{workspaceName}</p>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-[#d4af37]" />
          <span className="text-xs font-semibold text-[#d4af37]">TOKEN USAGE</span>
        </div>

        {/* Monthly Progress */}
        <div className="rounded-xl border border-[#d4af37]/20 bg-[#050a18]/60 p-4 space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-[#f5f5dc]/60">Monthly</span>
            <span className="text-[#f5f5dc]">
              {monthlySpent.toLocaleString()} / {monthlyCap.toLocaleString()}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#f5f5dc]/10 overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                isOverBudget
                  ? "bg-[#e11d48]"
                  : usagePercent > 80
                  ? "bg-amber-500"
                  : "bg-gradient-to-r from-[#d4af37] to-[#f9d976]"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${usagePercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          {isOverBudget && (
            <div className="flex items-center gap-2 text-xs text-[#e11d48]">
              <AlertTriangle className="h-3 w-3" />
              Budget exceeded
            </div>
          )}
        </div>

        {/* Daily Stats */}
        <div className="rounded-xl border border-[#f5f5dc]/10 bg-[#050a18]/40 p-4">
          <div className="flex justify-between text-xs">
            <span className="text-[#f5f5dc]/60">Today</span>
            <span className="text-[#f5f5dc]">{dailySpent.toLocaleString()} tokens</span>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-[#d4af37]" />
          <span className="text-xs font-semibold text-[#d4af37]">SETTINGS</span>
        </div>

        <div className="rounded-xl border border-[#d4af37]/20 bg-[#050a18]/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#f5f5dc]">Automation</p>
              <p className="text-xs text-[#f5f5dc]/50">Allow automated actions</p>
            </div>
            <Switch
              checked={allowAutomation}
              onCheckedChange={onAutomationChange}
              className="data-[state=checked]:bg-[#d4af37]"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-[#d4af37]/10">
        <div className="flex items-center gap-2 text-xs text-[#f5f5dc]/30">
          <Shield className="h-3 w-3" />
          <span>Powered by Gigaviz Imperium</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN IMPERIUM HELPER CLIENT
   ═══════════════════════════════════════════════════════════════════════════ */

function ImperiumHelperClientComponent({ workspaceId, workspaceSlug, workspaceName, initialConversations }: Props) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const { toast } = useToast();
  const copy = COPY_EN.helper;

  // State
  const [conversations, setConversations] = useState<HelperConversation[]>(
    initialConversations.map(toLocalConversation)
  );
  const [selectedId, setSelectedId] = useState<string | null>(initialConversations[0]?.id ?? null);
  const [messages, setMessages] = useState<HelperMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [composer, setComposer] = useState("");
  const [mode, setMode] = useState<HelperMode>("chat");
  const [provider, setProvider] = useState<HelperProvider>("auto");
  const [allowAutomation, setAllowAutomation] = useState(true);
  const [monthlyCap, setMonthlyCap] = useState<number>(0);
  const [dailySpent, setDailySpent] = useState(0);
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [isOverBudget, setIsOverBudget] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const conversationsWithMessages = useMemo(() => {
    return conversations.map((c) =>
      c.id === selectedId ? { ...c, messages } : c
    );
  }, [conversations, selectedId, messages]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/helper/settings?workspaceId=${workspaceId}`, { cache: "no-store" });
      const data = await res.json();
      if (data?.settings) {
        setAllowAutomation(Boolean(data.settings.allow_automation));
        setMonthlyCap(Number(data.settings.monthly_cap ?? 0));
      }
    } catch { /* ignore */ }
  }, [workspaceId]);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch(`/api/helper/usage?workspaceId=${workspaceId}`, { cache: "no-store" });
      const data = await res.json();
      if (data?.ok) {
        setDailySpent(data.today?.total ?? 0);
        setMonthlySpent(data.monthly?.total ?? 0);
        setMonthlyCap(data.monthly?.cap ?? 0);
        setIsOverBudget(Boolean(data.monthly?.isOverBudget));
      }
    } catch { /* ignore */ }
  }, [workspaceId]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(
        `/api/helper/messages?conversationId=${conversationId}&workspaceId=${workspaceId}`
      );
      const data = await res.json();
      if (data.ok) {
        setMessages((data.messages ?? []).map(toLocalMessage));
      }
    } catch {
      toast({ title: "Failed to load messages", variant: "destructive" });
    } finally {
      setLoadingMessages(false);
    }
  }, [workspaceId, toast]);

  useEffect(() => {
    if (!selectedId) return;
    void fetchMessages(selectedId);
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    void fetchSettings();
    void fetchUsage();
  }, [fetchSettings, fetchUsage]);

  const handleNewConversation = useCallback(async () => {
    setCreating(true);
    setLeftOpen(false);
    try {
      const res = await fetch("/api/helper/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (data.ok && data.conversation) {
        setConversations((prev) => [toLocalConversation(data.conversation), ...prev]);
        setSelectedId(data.conversation.id);
        setMessages([]);
      } else {
        throw new Error(data?.error || "Failed to create conversation");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create conversation";
      toast({ title: message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }, [workspaceId, toast]);

  const handleSelectConversation = useCallback((id: string) => {
    setSelectedId(id);
    setLeftOpen(false);
  }, []);

  const handleRenameConversation = useCallback(async (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c))
    );
    try {
      await fetch(`/api/helper/conversations/${id}?workspaceId=${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
    } catch {
      toast({ title: "Failed to rename conversation", variant: "destructive" });
    }
  }, [workspaceId, toast]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) {
      setSelectedId(conversations.find((c) => c.id !== id)?.id ?? null);
    }
    try {
      await fetch(`/api/helper/conversations/${id}?workspaceId=${workspaceId}`, {
        method: "DELETE",
      });
    } catch {
      toast({ title: "Failed to delete conversation", variant: "destructive" });
    }
  }, [selectedId, conversations, workspaceId, toast]);

  const handleSend = useCallback(async () => {
    if (!selectedId || !composer.trim()) return;
    if (isOverBudget) {
      toast({ title: "Monthly token budget exceeded", variant: "destructive" });
      return;
    }

    const content = composer.trim();
    setComposer("");
    setSending(true);

    const tempUserId = `temp-user-${Date.now()}`;
    const userMsg: HelperMessage = {
      id: tempUserId,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      status: "done",
    };

    const tempAssistantId = `temp-assistant-${Date.now()}`;
    const assistantMsg: HelperMessage = {
      id: tempAssistantId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      status: "streaming",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(`/api/helper/conversations/${selectedId}/messages/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          content,
          providerKey: provider,
          modeKey: mode,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      let realAssistantId: string | null = null;
      let realUserMsgId: string | null = null;
      let accumulatedContent = "";

      for await (const event of parseSSEStream(response)) {
        if (abortController.signal.aborted) break;

        switch (event.event) {
          case "meta": {
            const meta = event.data as { assistantMessageId?: string; userMessageId?: string };
            realAssistantId = meta.assistantMessageId ?? null;
            realUserMsgId = meta.userMessageId ?? null;
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id === tempUserId && realUserMsgId) return { ...m, id: realUserMsgId };
                if (m.id === tempAssistantId && realAssistantId) return { ...m, id: realAssistantId };
                return m;
              })
            );
            break;
          }
          case "delta": {
            const delta = event.data as { text?: string };
            if (delta.text) {
              accumulatedContent += delta.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === (realAssistantId ?? tempAssistantId)
                    ? { ...m, content: accumulatedContent }
                    : m
                )
              );
            }
            break;
          }
          case "done": {
            const done = event.data as { status?: string; provider?: string };
            setMessages((prev) =>
              prev.map((m) =>
                m.id === (realAssistantId ?? tempAssistantId)
                  ? { ...m, status: "done", provider: done.provider as HelperMessage["provider"] }
                  : m
              )
            );
            void fetchUsage();
            break;
          }
          case "error": {
            const error = event.data as { code?: string; message?: string; provider?: string | null };
            toast({
              title: error.message ?? "Streaming failed",
              variant: "destructive",
            });
            const providerFromError = (error.provider ?? undefined) as HelperMessage["provider"];
            setMessages((prev) =>
              prev.map((m) =>
                m.id === (realAssistantId ?? tempAssistantId)
                  ? {
                      ...m,
                      status: "error",
                      provider: providerFromError ?? m.provider ?? (provider === "auto" ? undefined : provider),
                      content: accumulatedContent || error.message || "Error occurred",
                    }
                  : m
              )
            );
            break;
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantId ? { ...m, status: "cancelled" } : m
          )
        );
      } else {
        const message = err instanceof Error ? err.message : "Send failed";
        toast({ title: message, variant: "destructive" });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantId ? { ...m, status: "error", content: "Failed to send" } : m
          )
        );
      }
    } finally {
      setSending(false);
      abortControllerRef.current = null;
    }
  }, [selectedId, composer, workspaceId, mode, provider, toast, isOverBudget, fetchUsage]);

  const handleStopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleSuggestedPrompt = useCallback((prompt: string) => {
    setComposer(prompt);
  }, []);

  const handleQuickPrompt = useCallback((prompt: string) => {
    setComposer(prompt);
    setRightOpen(false);
  }, []);

  const handleAutomationChange = useCallback(async (value: boolean) => {
    setAllowAutomation(value);
    try {
      await fetch("/api/helper/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, allow_automation: value, monthly_cap: monthlyCap }),
      });
    } catch { /* ignore */ }
  }, [workspaceId, monthlyCap]);

  if (!mounted) {
    return (
      <div className="flex h-full w-full bg-[#050a18]">
        <div className="flex-1 flex items-center justify-center">
          <Loader2Icon className="h-8 w-8 animate-spin text-[#d4af37]" />
        </div>
      </div>
    );
  }

  const leftPanelContent = (
    <ImperiumConversationList
      conversations={conversationsWithMessages}
      activeId={selectedId}
      onSelect={handleSelectConversation}
      onNew={handleNewConversation}
      onRename={handleRenameConversation}
      onDelete={handleDeleteConversation}
      isCreating={creating}
    />
  );

  const rightPanelContent = (
    <ImperiumWorkspaceControls
      workspaceName={workspaceName}
      workspaceSlug={workspaceSlug}
      dailySpent={dailySpent}
      monthlySpent={monthlySpent}
      monthlyCap={monthlyCap}
      isOverBudget={isOverBudget}
      allowAutomation={allowAutomation}
      onAutomationChange={handleAutomationChange}
      onQuickPrompt={handleQuickPrompt}
    />
  );

  return (
    <div className="flex h-full w-full bg-[#050a18]">
      {/* Cyber-Batik Background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 L30 0 L60 30 L30 60 Z' fill='none' stroke='%23d4af37' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Mobile header with menu buttons */}
      <div className="fixed top-16 left-0 right-0 z-40 lg:hidden flex items-center justify-between p-2 bg-[#0a1229] border-b border-[#d4af37]/20">
        <Sheet open={leftOpen} onOpenChange={setLeftOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-[#f5f5dc]">
              <MenuIcon className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 bg-[#0a1229] border-[#d4af37]/20">
            <div className="flex items-center justify-between p-4 border-b border-[#d4af37]/20">
              <span className="font-semibold text-[#d4af37]">{copy.conversations}</span>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="text-[#f5f5dc]">
                  <XIcon className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
            {leftPanelContent}
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#d4af37]" />
          <span className="font-semibold text-sm bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
            {copy.title}
          </span>
        </div>

        <Sheet open={rightOpen} onOpenChange={setRightOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-[#f5f5dc]">
              <PanelRightIcon className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0 bg-[#0a1229] border-[#d4af37]/20">
            <div className="flex items-center justify-between p-4 border-b border-[#d4af37]/20">
              <span className="font-semibold text-[#d4af37]">{copy.workspaceControls}</span>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="text-[#f5f5dc]">
                  <XIcon className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
            {rightPanelContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex h-full w-full relative z-10">
        {/* Left panel - conversations */}
        <aside className="w-72 xl:w-80 border-r border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl shrink-0">
          {leftPanelContent}
        </aside>

        {/* Center - chat area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#050a18] relative h-full overflow-hidden">
          <div className="flex-1 relative min-h-0">
            {messages.length > 0 ? (
              <ImperiumMessageList
                messages={messages}
                isProcessing={sending}
                isLoading={loadingMessages}
                onStop={handleStopStreaming}
              />
            ) : (
              <ImperiumChatEmptyState
                onPromptSelect={handleSuggestedPrompt}
                onCreateConversation={handleNewConversation}
                hasConversations={conversations.length > 0}
              />
            )}
          </div>
          <div className="flex-shrink-0 border-t border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl">
            <ImperiumComposer
              mode={mode}
              provider={provider}
              value={composer}
              onModeChange={setMode}
              onProviderChange={setProvider}
              onChange={setComposer}
              onSend={handleSend}
              disabled={!selectedId}
              sending={sending}
            />
          </div>
        </main>

        {/* Right panel - workspace controls */}
        <aside className="w-72 xl:w-80 border-l border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl shrink-0">
          {rightPanelContent}
        </aside>
      </div>

      {/* Mobile layout */}
      <div className="flex lg:hidden flex-col h-full w-full pt-14 relative z-10">
        <main className="flex-1 flex flex-col min-w-0 bg-[#050a18] relative h-full overflow-hidden">
          <div className="flex-1 relative min-h-0">
            {messages.length > 0 ? (
              <ImperiumMessageList
                messages={messages}
                isProcessing={sending}
                isLoading={loadingMessages}
                onStop={handleStopStreaming}
              />
            ) : (
              <ImperiumChatEmptyState
                onPromptSelect={handleSuggestedPrompt}
                onCreateConversation={handleNewConversation}
                hasConversations={conversations.length > 0}
              />
            )}
          </div>
          <div className="flex-shrink-0 border-t border-[#d4af37]/20 bg-[#0a1229]/80">
            <ImperiumComposer
              mode={mode}
              provider={provider}
              value={composer}
              onModeChange={setMode}
              onProviderChange={setProvider}
              onChange={setComposer}
              onSend={handleSend}
              disabled={!selectedId}
              sending={sending}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export const ImperiumHelperClient = memo(ImperiumHelperClientComponent);
