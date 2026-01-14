"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  Loader2Icon,
  MessageSquareIcon,
  PlusIcon,
  ShieldCheckIcon,
  ZapIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { COPY_EN } from "@/lib/copy/en";
import { cn } from "@/lib/utils";

export type HelperConversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type HelperMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

type Mode = "chat" | "copy" | "summary";
type Provider = "auto" | "openai" | "gemini" | "anthropic" | "local";

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  initialConversations: HelperConversation[];
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function HelperClient({ workspaceId, workspaceSlug, workspaceName, initialConversations }: Props) {
  const { toast } = useToast();
  const copy = COPY_EN.helper;
  const [conversations, setConversations] = useState<HelperConversation[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversations[0]?.id ?? null);
  const [messages, setMessages] = useState<HelperMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState("");
  const [composer, setComposer] = useState("");
  const [mode, setMode] = useState<Mode>("chat");
  const [provider, setProvider] = useState<Provider>("auto");
  const [allowAutomation, setAllowAutomation] = useState(true);
  const [monthlyCap, setMonthlyCap] = useState<number>(0);
  const dailySpent = 0;

  const filteredConversations = useMemo(() => {
    if (!query) return conversations;
    const q = query.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, query]);

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
        setMessages(data.messages ?? []);
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

  async function createConversation() {
    setCreating(true);
    try {
      const res = await fetch("/api/helper/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (data.ok && data.conversation) {
        setConversations((prev) => [data.conversation, ...prev]);
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
  }

  async function sendMessage() {
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
      const userMsg = data.message;
      const assistant = data.assistant;
      setMessages((prev) => [...prev, userMsg, ...(assistant ? [assistant] : [])]);
      setComposer("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Send failed";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  const currentConversation = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr_320px] min-h-[70vh]">
      {/* Left panel */}
      <Card className="bg-gigaviz-card/70 border-gigaviz-border/70">
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">{copy.conversations}</CardTitle>
            <Button size="sm" onClick={createConversation} disabled={creating} className="gap-2">
              {creating ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" />}
              {copy.new}
            </Button>
          </div>
          <Input
            placeholder={copy.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-gigaviz-surface/50"
          />
        </CardHeader>
        <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
          {filteredConversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={cn(
                "w-full text-left rounded-lg border p-3 transition-colors",
                selectedId === c.id
                  ? "border-gigaviz-gold/60 bg-gigaviz-gold/10"
                  : "border-gigaviz-border bg-gigaviz-surface/40 hover:border-gigaviz-gold/30"
              )}
            >
              <p className="text-sm font-semibold leading-tight line-clamp-2">{c.title}</p>
              <p className="text-xs text-muted-foreground mt-1">Update {relativeTime(c.updated_at)}</p>
            </button>
          ))}
          {filteredConversations.length === 0 && (
            <p className="text-xs text-muted-foreground">{copy.noConversations}</p>
          )}
        </CardContent>
      </Card>

      {/* Center panel */}
      <Card className="bg-gigaviz-card/70 border-gigaviz-border/70 flex flex-col">
        <CardHeader className="pb-3 border-b border-gigaviz-border/60">
          <CardTitle className="text-base">{copy.title}</CardTitle>
          <CardDescription>{copy.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loadingMessages ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="h-4 w-4 animate-spin" /> {copy.loading}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground">
                <MessageSquareIcon className="h-8 w-8 mb-2" />
                {currentConversation ? copy.noMessages : copy.selectOrCreate}
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="flex flex-col gap-1">
                  <div
                    className={cn(
                      "max-w-3xl rounded-xl px-3 py-2 text-sm",
                      m.role === "user"
                        ? "ml-auto bg-gigaviz-gold text-gigaviz-bg"
                        : "mr-auto border border-gigaviz-border bg-gigaviz-surface/60"
                    )}
                  >
                    <div className="text-[11px] uppercase tracking-wide font-semibold mb-1 text-muted-foreground">
                      {m.role === "user" ? copy.senderLabels.user : copy.senderLabels.assistant}
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground ml-1">{relativeTime(m.created_at)}</p>
                </div>
              ))
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-gigaviz-border/60 pt-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-lg border border-gigaviz-border bg-gigaviz-surface/40 p-1">
                {(["chat", "copy", "summary"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "px-3 py-1 text-xs font-semibold rounded-md",
                      mode === m ? "bg-gigaviz-gold text-gigaviz-bg" : "text-muted-foreground"
                    )}
                  >
                    {m === "chat" ? copy.modes.chat : m === "copy" ? copy.modes.copy : copy.modes.summary}
                  </button>
                ))}
              </div>
              <div className="inline-flex items-center gap-1 rounded-lg border border-gigaviz-border bg-gigaviz-surface/40 p-1">
                {(["auto", "openai", "gemini", "anthropic", "local"] as Provider[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={cn(
                      "px-3 py-1 text-xs font-semibold rounded-md capitalize",
                      provider === p ? "bg-gigaviz-gold text-gigaviz-bg" : "text-muted-foreground"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              placeholder={copy.composerPlaceholder}
              className="min-h-[120px] bg-gigaviz-surface/60"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="gap-1">
                  <ZapIcon className="h-3 w-3" /> {copy.badges.mode} {mode}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <ShieldCheckIcon className="h-3 w-3" /> {copy.badges.provider} {provider}
                </Badge>
              </div>
              <Button onClick={sendMessage} disabled={sending || !composer.trim() || !selectedId} className="gap-2">
                {sending ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <ArrowRightIcon className="h-4 w-4" />}
                {copy.send}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right panel */}
      <Card className="bg-gigaviz-card/70 border-gigaviz-border/70">
        <CardHeader className="pb-3 space-y-1">
          <CardTitle className="text-base">{copy.workspaceControls}</CardTitle>
          <CardDescription>{workspaceName} ({workspaceSlug})</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-gigaviz-border bg-gigaviz-surface/50 p-3">
            <p className="text-xs text-muted-foreground">{copy.todaysBudget}</p>
            <p className="text-lg font-semibold">{dailySpent.toFixed(2)} tokens</p>
            <p className="text-xs text-muted-foreground">{copy.monthlyCap}: {monthlyCap || "-"}</p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gigaviz-border bg-gigaviz-surface/50 p-3">
            <div>
              <p className="text-sm font-semibold">{copy.allowAutomation}</p>
              <p className="text-xs text-muted-foreground">{copy.automationDesc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={allowAutomation}
                onChange={async (e) => {
                  const next = e.target.checked;
                  setAllowAutomation(next);
                  try {
                    await fetch("/api/helper/settings", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ workspaceId, allow_automation: next, monthly_cap: monthlyCap }),
                    });
                  } catch {
                    /* ignore */
                  }
                }}
              />
              <div
                className={cn(
                  "w-10 h-6 rounded-full transition-all",
                  allowAutomation ? "bg-gigaviz-gold" : "bg-gigaviz-border"
                )}
              >
                <span
                  className={cn(
                    "absolute left-1 top-1 h-4 w-4 rounded-full bg-gigaviz-bg transition-transform",
                    allowAutomation ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">{copy.quickPromptsTitle}</p>
            <div className="grid gap-2">
              {copy.quickPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2"
                  onClick={() => setComposer(prompt)}
                >
                  <CheckIcon className="h-4 w-4 text-gigaviz-gold" />
                  {prompt}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gigaviz-border bg-gigaviz-surface/40 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground text-sm">{copy.tipsTitle}</p>
            <ul className="list-disc pl-4 space-y-1">
              {copy.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
            <div className="pt-1 text-[11px]">
              <Link href={`/${workspaceSlug}/dashboard`} className="text-gigaviz-gold hover:text-gigaviz-gold/80">
                {copy.viewAllHubs}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
