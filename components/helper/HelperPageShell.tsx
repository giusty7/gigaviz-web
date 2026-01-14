"use client";

import { memo, useState, useCallback, useEffect, useMemo } from "react";
import { MenuIcon, XIcon, PanelRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { ConversationList } from "./ConversationList";
import { MessageList } from "./MessageList";
import { ChatEmptyState } from "./ChatEmptyState";
import { Composer } from "./Composer";
import { WorkspaceControls } from "./WorkspaceControls";
import {
  HelperConversation,
  HelperMessage,
  HelperMode,
  HelperProvider,
  generateId,
  loadConversations,
  saveConversations,
} from "./types";
import { COPY_EN } from "@/lib/copy/en";

type Props = {
  workspaceName: string;
  workspaceSlug: string;
};

function HelperPageShellComponent({ workspaceName, workspaceSlug }: Props) {
  const copy = COPY_EN.helper;
  const storageKey = `helper-conversations-${workspaceSlug}`;

  // State with lazy initialization from localStorage
  const [conversations, setConversations] = useState<HelperConversation[]>(() => {
    if (typeof window === "undefined") return [];
    return loadConversations(storageKey);
  });
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = loadConversations(storageKey);
    return saved.length > 0 ? saved[0].id : null;
  });
  const [mode, setMode] = useState<HelperMode>("chat");
  const [provider, setProvider] = useState<HelperProvider>("auto");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [dailySpent] = useState(42.5);
  const [monthlyCap] = useState(10000);
  const [allowAutomation, setAllowAutomation] = useState(false);

  // Save conversations to localStorage when they change
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(storageKey, conversations);
    }
  }, [conversations, storageKey]);

  // Derived state
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  // Handlers
  const handleNewConversation = useCallback(() => {
    const newConv: HelperConversation = {
      id: generateId(),
      title: `${copy.newConversation} ${conversations.length + 1}`,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    setLeftOpen(false);
  }, [conversations.length, copy.newConversation]);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveId(id);
    setLeftOpen(false);
  }, []);

  const handleRenameConversation = useCallback((id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c
      )
    );
  }, []);

  const handleDeleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(conversations[1]?.id ?? null);
    }
  }, [activeId, conversations]);

  const handleSuggestedPrompt = useCallback((prompt: string) => {
    setInput(prompt);
  }, []);

  const handleQuickPrompt = useCallback((prompt: string) => {
    setInput(prompt);
    setRightOpen(false);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;

    const userMessage: HelperMessage = {
      id: generateId(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
      mode,
      provider: provider === "auto" ? undefined : provider,
    };

    // If no active conversation, create one
    if (!activeId) {
      const newConv: HelperConversation = {
        id: generateId(),
        title: input.trim().slice(0, 40) + (input.trim().length > 40 ? "..." : ""),
        messages: [userMessage],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
      setInput("");
      
      // Simulate assistant response
      setSending(true);
      setTimeout(() => {
        const assistantMessage: HelperMessage = {
          id: generateId(),
          role: "assistant",
          content: `This is a demo response to: "${userMessage.content}"\n\nIn production, this would call the actual AI service.`,
          timestamp: new Date().toISOString(),
          mode,
          provider: "openai",
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === newConv.id
              ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: new Date().toISOString() }
              : c
          )
        );
        setSending(false);
      }, 1500);
      return;
    }

    // Add message to existing conversation
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, userMessage], updatedAt: new Date().toISOString() }
          : c
      )
    );
    setInput("");
    setSending(true);

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: HelperMessage = {
        id: generateId(),
        role: "assistant",
        content: `This is a demo response to: "${userMessage.content}"\n\nIn production, this would call the actual AI service.`,
        timestamp: new Date().toISOString(),
        mode,
        provider: "openai",
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: new Date().toISOString() }
            : c
        )
      );
      setSending(false);
    }, 1500);
  }, [input, sending, activeId, mode, provider]);

  // Render left panel content
  const leftPanelContent = (
    <ConversationList
      conversations={conversations}
      activeId={activeId}
      onSelect={handleSelectConversation}
      onNew={handleNewConversation}
      onRename={handleRenameConversation}
      onDelete={handleDeleteConversation}
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
      onAutomationChange={setAllowAutomation}
      onQuickPrompt={handleQuickPrompt}
    />
  );

  return (
    <div className="flex h-full w-full bg-gigaviz-bg">
      {/* Mobile header with menu buttons */}
      <div className="fixed top-0 left-0 right-0 z-40 lg:hidden flex items-center justify-between p-2 bg-gigaviz-surface border-b border-gigaviz-border">
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
            {activeConversation && activeConversation.messages.length > 0 ? (
              <MessageList messages={activeConversation.messages} isProcessing={sending} />
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
              value={input}
              onModeChange={setMode}
              onProviderChange={setProvider}
              onChange={setInput}
              onSend={handleSend}
              disabled={false}
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
            {activeConversation && activeConversation.messages.length > 0 ? (
              <MessageList messages={activeConversation.messages} isProcessing={sending} />
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
              value={input}
              onModeChange={setMode}
              onProviderChange={setProvider}
              onChange={setInput}
              onSend={handleSend}
              disabled={false}
              sending={sending}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export const HelperPageShell = memo(HelperPageShellComponent);