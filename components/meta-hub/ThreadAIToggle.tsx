"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  User,
  Sparkles,
  Hand,
  RefreshCw,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface ThreadAIState {
  threadId: string;
  aiEnabled: boolean;
  messageCount: number;
  handedOff: boolean;
  handedOffReason?: string;
}

interface Props {
  threadId: string;
  compact?: boolean;
  onStateChange?: (state: ThreadAIState) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function ThreadAIToggle({ threadId, compact = false, onStateChange }: Props) {
  const t = useTranslations("metaHubUI.threadAI");
  const [state, setState] = useState<ThreadAIState | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [globalEnabled, setGlobalEnabled] = useState(true);

  // Fetch thread AI state
  useEffect(() => {
    async function fetchState() {
      try {
        // Fetch global settings first
        const settingsRes = await fetch(`/api/meta-hub/ai-reply`);
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setGlobalEnabled(settings.enabled ?? false);
        }

        // Fetch thread state
        const res = await fetch(`/api/meta-hub/ai-reply/thread?threadId=${threadId}`);
        if (res.ok) {
          const data = await res.json();
          setState({
            threadId,
            aiEnabled: data.aiEnabled ?? true,
            messageCount: data.messageCount ?? 0,
            handedOff: data.handedOff ?? false,
            handedOffReason: data.handedOffReason,
          });
        } else {
          setState({
            threadId,
            aiEnabled: true,
            messageCount: 0,
            handedOff: false,
          });
        }
      } catch {
        setState({
          threadId,
          aiEnabled: true,
          messageCount: 0,
          handedOff: false,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchState();
  }, [threadId]);

  // Toggle AI for this thread
  const handleToggle = async () => {
    if (!state) return;
    
    try {
      setToggling(true);
      const newEnabled = !state.aiEnabled;

      const res = await fetch(`/api/meta-hub/ai-reply/thread`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          threadId,
          enabled: newEnabled,
        }),
      });

      if (res.ok) {
        const newState = { ...state, aiEnabled: newEnabled };
        setState(newState);
        onStateChange?.(newState);
      }
    } finally {
      setToggling(false);
    }
  };

  // Handoff to human
  const handleHandoff = async () => {
    if (!state) return;

    try {
      setToggling(true);

      const res = await fetch(`/api/meta-hub/ai-reply/thread`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "handoff",
          threadId,
          reason: "Manual handoff by agent",
        }),
      });

      if (res.ok) {
        const newState = { ...state, handedOff: true, aiEnabled: false };
        setState(newState);
        onStateChange?.(newState);
      }
    } finally {
      setToggling(false);
    }
  };

  // Reset thread state
  const handleReset = async () => {
    if (!state) return;

    try {
      setToggling(true);

      const res = await fetch(`/api/meta-hub/ai-reply/thread`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset",
          threadId,
        }),
      });

      if (res.ok) {
        const newState = {
          ...state,
          aiEnabled: true,
          handedOff: false,
          messageCount: 0,
          handedOffReason: undefined,
        };
        setState(newState);
        onStateChange?.(newState);
      }
    } finally {
      setToggling(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#f5f5dc]/40">
        <Loader2 className="h-4 w-4 animate-spin" />
        {!compact && <span className="text-xs">{t("loading")}</span>}
      </div>
    );
  }

  // Global AI disabled
  if (!globalEnabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-lg bg-[#0a1229]/60 border border-[#f5f5dc]/10",
              "text-[#f5f5dc]/40"
            )}>
              <Bot className="h-4 w-4" />
              {!compact && <span className="text-xs">{t("aiOff")}</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-[#0a1229] border-[#d4af37]/20 max-w-xs">
            <p className="text-sm">
              {t("globalDisabledTooltip")}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!state) return null;

  // Compact mode - just a toggle button
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              disabled={toggling || state.handedOff}
              className={cn(
                "p-2 h-8 w-8",
                state.aiEnabled && !state.handedOff
                  ? "text-[#d4af37] hover:text-[#f9d976] hover:bg-[#d4af37]/10"
                  : "text-[#f5f5dc]/40 hover:text-[#f5f5dc]/60 hover:bg-[#f5f5dc]/5"
              )}
            >
              {toggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : state.handedOff ? (
                <User className="h-4 w-4" />
              ) : state.aiEnabled ? (
                <Bot className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4 opacity-50" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-[#0a1229] border-[#d4af37]/20">
            {state.handedOff 
              ? t("handedOffTooltip")
              : state.aiEnabled 
                ? t("aiActiveTooltip") 
                : t("aiInactiveTooltip")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full mode with popover
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 transition-all duration-200",
            state.handedOff
              ? "border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
              : state.aiEnabled
                ? "border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/10"
                : "border-[#f5f5dc]/20 text-[#f5f5dc]/60 hover:bg-[#f5f5dc]/5"
          )}
        >
          {state.handedOff ? (
            <>
              <User className="h-4 w-4" />
              {t("humanAgent")}
            </>
          ) : state.aiEnabled ? (
            <>
              <Bot className="h-4 w-4" />
              <Sparkles className="h-3 w-3" />
              {t("aiActive")}
            </>
          ) : (
            <>
              <Bot className="h-4 w-4 opacity-50" />
              {t("aiInactive")}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 p-4 bg-[#0a1229] border-[#d4af37]/20"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className={cn(
                "h-5 w-5",
                state.aiEnabled && !state.handedOff ? "text-[#d4af37]" : "text-[#f5f5dc]/40"
              )} />
              <span className="font-medium text-[#f5f5dc]">{t("responseMode")}</span>
            </div>
            {state.messageCount > 0 && (
              <Badge variant="outline" className="text-xs border-[#f5f5dc]/20 text-[#f5f5dc]/60">
                {t("aiRepliesCount", { count: state.messageCount })}
              </Badge>
            )}
          </div>

          {/* Handed Off State */}
          {state.handedOff ? (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-orange-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-400">{t("handedOffTitle")}</p>
                  <p className="text-xs text-[#f5f5dc]/60 mt-1">
                    {state.handedOffReason || t("handedOffDefault")}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={toggling}
                className="w-full mt-3 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
              >
                {toggling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {t("reactivateAI")}
              </Button>
            </div>
          ) : (
            <>
              {/* Toggle Switch */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#050a18]/50">
                <div className="flex items-center gap-2">
                  {state.aiEnabled ? (
                    <Sparkles className="h-4 w-4 text-[#d4af37]" />
                  ) : (
                    <User className="h-4 w-4 text-[#f5f5dc]/60" />
                  )}
                  <span className="text-sm text-[#f5f5dc]">
                    {state.aiEnabled ? t("aiResponding") : t("manual")}
                  </span>
                </div>
                <Switch
                  checked={state.aiEnabled}
                  onCheckedChange={handleToggle}
                  disabled={toggling}
                />
              </div>

              {/* Mode Description */}
              <div className="text-xs text-[#f5f5dc]/50 flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                {state.aiEnabled ? (
                  <span>{t("aiAutoRespondInfo")}</span>
                ) : (
                  <span>{t("manualRespondInfo")}</span>
                )}
              </div>

              {/* Handoff Button */}
              {state.aiEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHandoff}
                  disabled={toggling}
                  className="w-full border-[#f5f5dc]/20 text-[#f5f5dc]/70 hover:text-[#f5f5dc] hover:bg-[#f5f5dc]/5"
                >
                  <Hand className="h-4 w-4 mr-2" />
                  {t("handoffButton")}
                </Button>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE STATUS INDICATOR
   For showing in message bubbles when AI responded
   ═══════════════════════════════════════════════════════════════════════════ */

export function AIGeneratedBadge({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("metaHubUI.threadAI");

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Sparkles className="h-3 w-3 text-[#d4af37]/60" />
          </TooltipTrigger>
          <TooltipContent className="bg-[#0a1229] border-[#d4af37]/20">
            {t("aiBadgeTooltip")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-[10px] px-1.5 py-0 gap-1 border-[#d4af37]/30 text-[#d4af37]/70 bg-[#d4af37]/5"
    >
      <Sparkles className="h-2.5 w-2.5" />
      AI
    </Badge>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   GLOBAL AI STATUS BAR
   Shows at top of inbox when AI is enabled globally
   ═══════════════════════════════════════════════════════════════════════════ */

export function AIStatusBar({ workspaceSlug }: { workspaceSlug: string }) {
  const t = useTranslations("metaHubUI.threadAI");
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [stats, setStats] = useState<{ todayReplies: number; successRate: number } | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/meta-hub/ai-reply?includeStats=true`);
        if (res.ok) {
          const data = await res.json();
          setEnabled(data.settings?.enabled ?? false);
          if (data.stats) {
            setStats({
              todayReplies: data.stats.totalReplies,
              successRate: data.stats.successRate,
            });
          }
        }
      } catch {
        setEnabled(false);
      }
    }

    fetchStatus();
  }, []);

  if (enabled === null) return null;

  return (
    <AnimatePresence>
      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-[#d4af37]/20 bg-gradient-to-r from-[#d4af37]/5 to-[#f9d976]/5"
        >
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bot className="h-4 w-4 text-[#d4af37]" />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <span className="text-sm text-[#d4af37] font-medium">{t("aiAutoReplyActive")}</span>
              </div>
              {stats && (
                <div className="flex items-center gap-3 text-xs text-[#f5f5dc]/50">
                  <span>{t("repliesToday", { count: stats.todayReplies })}</span>
                  <span>•</span>
                  <span>{t("successRate", { rate: stats.successRate })}</span>
                </div>
              )}
            </div>
            <a
              href={`/${workspaceSlug}/meta-hub/ai-reply`}
              className="text-xs text-[#d4af37] hover:text-[#f9d976] transition-colors"
            >
              {t("settings")}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
