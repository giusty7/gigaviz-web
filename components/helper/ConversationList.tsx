"use client";

import { memo, useState } from "react";
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  Loader2Icon,
  MessageSquareIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { type HelperConversation, relativeTime } from "./types";

type Props = {
  conversations: HelperConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  isCreating?: boolean;
};

function ConversationListComponent({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  isCreating = false,
}: Props) {
  const t = useTranslations("helperUI.imperiumHelper");
  const [query, setQuery] = useState("");
  const [renameDialog, setRenameDialog] = useState<{ id: string; title: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const filtered = query
    ? conversations.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
    : conversations;

  const handleRename = () => {
    if (renameDialog) {
      onRename(renameDialog.id, renameDialog.title);
      setRenameDialog(null);
    }
  };

  const handleDelete = () => {
    if (deleteDialog) {
      onDelete(deleteDialog);
      setDeleteDialog(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex-none space-y-3 p-4 border-b border-gigaviz-border/60">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">{t("conversations")}</h2>
          <Button
            size="sm"
            onClick={onNew}
            disabled={isCreating}
            className="gap-1.5"
          >
            {isCreating ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
            {t("new")}
          </Button>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-gigaviz-surface/50"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <MessageSquareIcon className="h-8 w-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {conversations.length === 0 ? t("noConversations") : t("noMatchesFound")}
              </p>
              {conversations.length === 0 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={onNew}
                  disabled={isCreating}
                  className="mt-2"
                >
                  {t("createFirst")}
                </Button>
              )}
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "group relative flex items-start gap-2 rounded-lg border p-3 transition-colors cursor-pointer",
                  activeId === c.id
                    ? "border-gigaviz-gold/60 bg-gigaviz-gold/10"
                    : "border-transparent bg-gigaviz-surface/40 hover:border-gigaviz-gold/30 hover:bg-gigaviz-surface/60"
                )}
                onClick={() => onSelect(c.id)}
                onKeyDown={(e) => e.key === "Enter" && onSelect(c.id)}
                tabIndex={0}
                role="button"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight line-clamp-2">
                    {c.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-muted-foreground">
                      {t("updated")} {relativeTime(c.updatedAt)}
                    </span>
                    {c.lastSnippet && (
                      <span className="text-xs text-muted-foreground/60 truncate max-w-[100px]">
                        · {c.lastSnippet}
                      </span>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontalIcon className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameDialog({ id: c.id, title: c.title });
                      }}
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      {t("rename")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDialog(c.id);
                      }}
                      className="text-rose-400"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      {t("delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Rename Dialog */}
      <Dialog open={!!renameDialog} onOpenChange={() => setRenameDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rename")}</DialogTitle>
          </DialogHeader>
          <Input
            value={renameDialog?.title ?? ""}
            onChange={(e) =>
              setRenameDialog((prev) => (prev ? { ...prev, title: e.target.value } : null))
            }
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog(null)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleRename}>{t("confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("deleteConfirmDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const ConversationList = memo(ConversationListComponent);
