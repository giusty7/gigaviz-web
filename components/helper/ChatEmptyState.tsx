"use client";

import { memo } from "react";
import { LightbulbIcon, MessageCircleIcon, PenLineIcon, FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COPY_EN } from "@/lib/copy/en";

type Props = {
  onPromptSelect: (prompt: string) => void;
  onCreateConversation: () => void;
  hasConversations: boolean;
};

const promptIcons = [
  <PenLineIcon key="pen" className="h-5 w-5" />,
  <FileTextIcon key="file" className="h-5 w-5" />,
  <MessageCircleIcon key="msg" className="h-5 w-5" />,
  <LightbulbIcon key="bulb" className="h-5 w-5" />,
];

function ChatEmptyStateComponent({
  onPromptSelect,
  onCreateConversation,
  hasConversations,
}: Props) {
  const copy = COPY_EN.helper.emptyState;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="mb-6">
        <div className="h-16 w-16 rounded-2xl bg-gigaviz-gold/10 border border-gigaviz-gold/30 flex items-center justify-center mx-auto mb-4">
          <MessageCircleIcon className="h-8 w-8 text-gigaviz-gold" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{copy.title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{copy.description}</p>
      </div>

      {/* Suggested prompts */}
      <div className="grid gap-3 w-full max-w-md">
        {copy.suggestedPrompts.map((item, idx) => (
          <Button
            key={item.label}
            variant="outline"
            className="justify-start gap-3 h-auto py-3 px-4 text-left"
            onClick={() => {
              if (!hasConversations) {
                onCreateConversation();
              }
              onPromptSelect(item.prompt);
            }}
          >
            <div className="flex-none h-9 w-9 rounded-lg bg-gigaviz-surface flex items-center justify-center text-gigaviz-gold">
              {promptIcons[idx % promptIcons.length]}
            </div>
            <span className="text-sm">{item.label}</span>
          </Button>
        ))}
      </div>

      {!hasConversations && (
        <p className="text-xs text-muted-foreground mt-6">
          {COPY_EN.helper.createFirst}
        </p>
      )}
    </div>
  );
}

export const ChatEmptyState = memo(ChatEmptyStateComponent);
