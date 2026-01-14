"use client";

import { memo, useRef, useEffect, useState } from "react";
import { CopyIcon, CheckIcon, UserIcon, BotIcon, Loader2Icon, SquareIcon, AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { COPY_EN } from "@/lib/copy/en";
import { cn } from "@/lib/utils";
import { type HelperMessage, relativeTime } from "./types";

type MessageBubbleProps = {
  message: HelperMessage;
  onStop?: () => void;
};

function MessageBubble({ message, onStop }: MessageBubbleProps) {
  const copy = COPY_EN.helper;
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isStreaming = message.status === "streaming";
  const isError = message.status === "error";
  const isCancelled = message.status === "cancelled";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-none h-8 w-8 rounded-full flex items-center justify-center",
          isUser
            ? "bg-gigaviz-gold text-gigaviz-bg"
            : isError
              ? "bg-destructive/20 border border-destructive/40"
              : "bg-gigaviz-surface border border-gigaviz-border"
        )}
      >
        {isUser ? (
          <UserIcon className="h-4 w-4" />
        ) : isError ? (
          <AlertCircleIcon className="h-4 w-4 text-destructive" />
        ) : (
          <BotIcon className="h-4 w-4 text-gigaviz-gold" />
        )}
      </div>

      {/* Bubble */}
      <div className="flex flex-col gap-1 max-w-[80%] lg:max-w-[70%]">
        <div
          className={cn(
            "relative rounded-2xl px-4 py-3 text-sm",
            isUser
              ? "bg-gigaviz-gold text-gigaviz-bg rounded-tr-sm"
              : isError
                ? "bg-destructive/10 border border-destructive/30 rounded-tl-sm"
                : isCancelled
                  ? "bg-muted/50 border border-gigaviz-border/60 rounded-tl-sm"
                  : "bg-gigaviz-surface/80 border border-gigaviz-border/60 rounded-tl-sm"
          )}
        >
          {/* Message content */}
          <p className="whitespace-pre-wrap leading-relaxed">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-gigaviz-gold/70 ml-0.5 animate-pulse" />
            )}
          </p>

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gigaviz-border/30">
              <Loader2Icon className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{copy.processing}</span>
              {onStop && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs ml-auto"
                  onClick={onStop}
                >
                  <SquareIcon className="h-3 w-3 mr-1" />
                  Stop
                </Button>
              )}
            </div>
          )}

          {/* Status badges */}
          {isCancelled && (
            <p className="text-xs text-muted-foreground mt-2 italic">Cancelled</p>
          )}
          {isError && !message.content && (
            <p className="text-xs text-destructive">Failed to generate response</p>
          )}

          {/* Copy button for assistant (not streaming) */}
          {!isUser && !isStreaming && message.content && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-2 -top-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-gigaviz-card border border-gigaviz-border shadow-sm"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <CopyIcon className="h-3.5 w-3.5" />
                    )}
                    <span className="sr-only">{copy.copied}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {copied ? copy.copied : "Copy"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Timestamp */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "text-[11px] text-muted-foreground/60 px-1",
                  isUser ? "text-right" : "text-left"
                )}
              >
                {relativeTime(message.timestamp)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {new Date(message.timestamp).toLocaleString()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

type Props = {
  messages: HelperMessage[];
  isLoading?: boolean;
  isProcessing?: boolean;
  onStop?: () => void;
};

function MessageListComponent({ messages, isLoading = false, isProcessing = false, onStop }: Props) {
  const helperCopy = COPY_EN.helper;
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);

  // Track user scroll position
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    isUserScrolledUp.current = !isAtBottom;
  };

  // Auto-scroll to bottom on new messages (unless user scrolled up)
  useEffect(() => {
    if (scrollRef.current && !isUserScrolledUp.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Check if any message is currently streaming
  const hasStreamingMessage = messages.some((m) => m.status === "streaming");

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1" ref={scrollRef} onScrollCapture={handleScroll}>
      <div className="p-4 space-y-4">
        {messages.map((m) => (
          <MessageBubble 
            key={m.id} 
            message={m} 
            onStop={m.status === "streaming" ? onStop : undefined}
          />
        ))}

        {/* Processing indicator (only when not streaming in messages) */}
        {isProcessing && !hasStreamingMessage && (
          <div className="flex gap-3">
            <div className="flex-none h-8 w-8 rounded-full bg-gigaviz-surface border border-gigaviz-border flex items-center justify-center">
              <BotIcon className="h-4 w-4 text-gigaviz-gold" />
            </div>
            <div className="bg-gigaviz-surface/80 border border-gigaviz-border/60 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                {helperCopy.processing}
              </div>
            </div>          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export const MessageList = memo(MessageListComponent);