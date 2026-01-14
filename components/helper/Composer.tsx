"use client";

import { memo, useRef, useCallback, type KeyboardEvent } from "react";
import { ArrowUpIcon, Loader2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { COPY_EN } from "@/lib/copy/en";
import { cn } from "@/lib/utils";
import { type HelperMode, type HelperProvider } from "./types";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  mode: HelperMode;
  onModeChange: (mode: HelperMode) => void;
  provider: HelperProvider;
  onProviderChange: (provider: HelperProvider) => void;
  disabled: boolean;
  sending: boolean;
};

const modes: HelperMode[] = ["chat", "copy", "summary"];
const providers: HelperProvider[] = ["auto", "openai", "gemini", "anthropic", "local"];

function ComposerComponent({
  value,
  onChange,
  onSend,
  mode,
  onModeChange,
  provider,
  onProviderChange,
  disabled,
  sending,
}: Props) {
  const copy = COPY_EN.helper;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (value.trim() && !disabled && !sending) {
          onSend();
        }
      }
    },
    [value, disabled, sending, onSend]
  );

  const handleClear = () => {
    onChange("");
    textareaRef.current?.focus();
  };

  const canSend = value.trim().length > 0 && !disabled && !sending;

  return (
    <div className="border-t border-gigaviz-border/60 bg-gigaviz-card/50 p-4 space-y-3">
      {/* Mode & Provider selectors */}
      <div className="flex flex-wrap items-center gap-3">
        <TooltipProvider>
          <Tabs value={mode} onValueChange={(v) => onModeChange(v as HelperMode)}>
            <TabsList className="h-9">
              {modes.map((m) => (
                <Tooltip key={m}>
                  <TooltipTrigger asChild>
                    <TabsTrigger value={m} className="text-xs px-3">
                      {copy.modes[m]}
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {copy.modeDescriptions[m]}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TabsList>
          </Tabs>
        </TooltipProvider>

        <div className="flex items-center gap-1 rounded-lg border border-gigaviz-border bg-gigaviz-surface/40 p-1">
          {providers.map((p) => (
            <button
              key={p}
              onClick={() => onProviderChange(p)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                provider === p
                  ? "bg-gigaviz-gold text-gigaviz-bg"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {copy.providers[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={copy.composerPlaceholder}
          disabled={disabled || sending}
          className="min-h-[100px] max-h-[240px] resize-none bg-gigaviz-surface/60 pr-24"
          rows={3}
        />

        {/* Actions */}
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          {value.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClear}
              disabled={sending}
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">{copy.clear}</span>
            </Button>
          )}
          <Button
            size="icon"
            className="h-8 w-8"
            onClick={onSend}
            disabled={!canSend}
          >
            {sending ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUpIcon className="h-4 w-4" />
            )}
            <span className="sr-only">{copy.send}</span>
          </Button>
        </div>
      </div>

      {/* Hint */}
      <p className="text-[11px] text-muted-foreground/60">{copy.composerHint}</p>
    </div>
  );
}

export const Composer = memo(ComposerComponent);
