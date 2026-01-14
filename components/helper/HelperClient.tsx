"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { MenuIcon, XIcon, PanelRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { COPY_EN } from "@/lib/copy/en";
import { ConversationList } from "./ConversationList";
import { MessageList } from "./MessageList";
import { ChatEmptyState } from "./ChatEmptyState";
import { Composer } from "./Composer";
import { WorkspaceControls } from "./WorkspaceControls";
import type { HelperConversation, HelperMessage, HelperMode, HelperProvider } from "./types";

// Re-export types for backward compatibility
export type { HelperConversation, HelperMessage };

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
};

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  initialConversations: ApiConversation[];
};

// Convert API conversation to local format
function toLocalConversation(c: ApiConversation): HelperConversation {
  return {
    id: c.id,
    title: c.title,
    messages: [],
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

// Convert API message to local format
function toLocalMessage(m: ApiMessage): HelperMessage {
  return {
    id: m.id,
    role: m.role === "user" ? "user" : "assistant",
    content: m.content,
    timestamp: m.created_at,
  };
}

function HelperClientComponent({ workspaceId, workspaceSlug, workspaceName, initialConversations }: Props) {
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
  const [dailySpent] = useState(0);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  // Derived state for ConversationList (with messages attached)
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
    } catch {
      /* ignore */
    }
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
  }, [fetchSettings]);

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
    // TODO: Persist to API
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) {
      setSelectedId(conversations.find((c) => c.id !== id)?.id ?? null);
    }
    // TODO: Persist to API
  }, [selectedId, conversations]);

  const handleSend = useCallback(async () => {
    if (!selectedId || !composer.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/helper/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          conversationId: selectedId,
          content: composer,
          role: "user",
          mode,
          provider,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data?.error || "Failed to send message");
      const userMsg = toLocalMessage(data.message);
      const assistant = data.assistant ? toLocalMessage(data.assistant) : null;
      setMessages((prev) => [...prev, userMsg, ...(assistant ? [assistant] : [])]);
      setComposer("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Send failed";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }, [selectedId, composer, workspaceId, mode, provider, toast]);

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
    } catch {
      /* ignore */
    }
  }, [workspaceId, monthlyCap]);

  // Render left panel content
  const leftPanelContent = (
    <ConversationList
      conversations={conversationsWithMessages}
      activeId={selectedId}
      onSelect={handleSelectConversation}
      onNew={handleNewConversation}
      onRename={handleRenameConversation}
      onDelete={handleDeleteConversation}
      isCreating={creating}
    />
  );

  // Render right panel content
  const rightPanelContent = (
    <WorkspaceControls
      workspaceName={workspaceName}
      workspaceSlug={workspaceSlug}
      dailySpent={dailySpent}
      monthlyCap={monthlyCap}
      allowAutomation={allowAutomation}
      onAutomationChange={handleAutomationChange}
      onQuickPrompt={handleQuickPrompt}
    />
  );

  return (
    <div className="flex h-full w-full bg-gigaviz-bg -mx-4 -mt-6 md:-mx-6 lg:-mx-8" style={{ minHeight: "calc(100vh - 80px)" }}>
      {/* Mobile header with menu buttons */}
      <div className="fixed top-16 left-0 right-0 z-40 lg:hidden flex items-center justify-between p-2 bg-gigaviz-surface border-b border-gigaviz-border">
        <Sheet open={leftOpen} onOpenChange={setLeftOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Open conversations</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <div className="flex items-center justify-between p-4 border-b border-gigaviz-border">
              <span className="font-semibold">{copy.conversations}</span>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <XIcon className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
            {leftPanelContent}
          </SheetContent>
        </Sheet>

        <span className="font-medium text-sm">{copy.title}</span>

        <Sheet open={rightOpen} onOpenChange={setRightOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <PanelRightIcon className="h-5 w-5" />
              <span className="sr-only">Open controls</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0">
            <div className="flex items-center justify-between p-4 border-b border-gigaviz-border">
              <span className="font-semibold">{copy.workspaceControls}</span>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <XIcon className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
            {rightPanelContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex h-full w-full">
        {/* Left panel - conversations */}
        <aside className="w-72 xl:w-80 border-r border-gigaviz-border bg-gigaviz-surface shrink-0">
          {leftPanelContent}
        </aside>

        {/* Center - chat area */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            {messages.length > 0 ? (
              <MessageList messages={messages} isProcessing={sending} isLoading={loadingMessages} />
            ) : (
              <ChatEmptyState
                onPromptSelect={handleSuggestedPrompt}
                onCreateConversation={handleNewConversation}
                hasConversations={conversations.length > 0}
              />
            )}
          </div>
          <div className="border-t border-gigaviz-border">
            <Composer
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
        <aside className="w-72 xl:w-80 border-l border-gigaviz-border bg-gigaviz-surface shrink-0">
          {rightPanelContent}
        </aside>
      </div>

      {/* Mobile layout */}
      <div className="flex lg:hidden flex-col h-full w-full pt-14">
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {messages.length > 0 ? (
              <MessageList messages={messages} isProcessing={sending} isLoading={loadingMessages} />
            ) : (
              <ChatEmptyState
                onPromptSelect={handleSuggestedPrompt}
                onCreateConversation={handleNewConversation}
                hasConversations={conversations.length > 0}
              />
            )}
          </div>
          <div className="border-t border-gigaviz-border">
            <Composer
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

export const HelperClient = memo(HelperClientComponent);