"use client";

import { memo, useRef, useEffect } from "react";
import { CopyIcon, CheckIcon, UserIcon, BotIcon, Loader2Icon } from "lucide-react";
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
import { useState } from "react";

type MessageBubbleProps = {
  message: HelperMessage;
};

function MessageBubble({ message }: MessageBubbleProps) {
  const copy = COPY_EN.helper;
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

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
            : "bg-gigaviz-surface border border-gigaviz-border"
        )}
      >
        {isUser ? (
          <UserIcon className="h-4 w-4" />
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
              : "bg-gigaviz-surface/80 border border-gigaviz-border/60 rounded-tl-sm"
          )}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

          {/* Copy button for assistant */}
          {!isUser && (
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
};

function MessageListComponent({ messages, isLoading = false, isProcessing = false }: Props) {
  const helperCopy = COPY_EN.helper;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isProcessing]);

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
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="p-4 space-y-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {/* Processing indicator */}
        {isProcessing && (
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