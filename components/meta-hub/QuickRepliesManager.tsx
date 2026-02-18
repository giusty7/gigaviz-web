"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  PlusIcon, 
  SearchIcon, 
  MoreVerticalIcon, 
  EditIcon, 
  TrashIcon,
  SparklesIcon,
  HashIcon,
  ClockIcon,
} from "lucide-react";


// ============================================================================
// TYPES
// ============================================================================

interface QuickReply {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  shortcut: string | null;
  category: string;
  hasVariables: boolean;
  useCount: number;
  lastUsedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  workspaceId: string;
}

const DEFAULT_CATEGORIES = ["general", "greeting", "pricing", "support", "closing", "faq"];

const VARIABLE_HINTS = [
  { name: "{{contact_name}}", desc: "Contact's display name" },
  { name: "{{contact_phone}}", desc: "Contact's phone number" },
  { name: "{{agent_name}}", desc: "Current agent's name" },
  { name: "{{workspace_name}}", desc: "Workspace name" },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function QuickRepliesManager(_props: Props) {
  const { toast } = useToast();
  const t = useTranslations("metaHubUI.quickReplies");
  
  // State
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formShortcut, setFormShortcut] = useState("");
  const [formCategory, setFormCategory] = useState("general");

  // ============================================================================
  // FETCH DATA
  // ============================================================================

  const fetchQuickReplies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/meta-hub/quick-replies");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuickReplies(data.quickReplies || []);
    } catch (err) {
      toast({
        title: t("errorLoading"),
        description: err instanceof Error ? err.message : t("unknownError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchQuickReplies();
  }, [fetchQuickReplies]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const openCreateDialog = () => {
    setEditingReply(null);
    setFormTitle("");
    setFormContent("");
    setFormShortcut("");
    setFormCategory("general");
    setDialogOpen(true);
  };

  const openEditDialog = (reply: QuickReply) => {
    setEditingReply(reply);
    setFormTitle(reply.title);
    setFormContent(reply.content);
    setFormShortcut(reply.shortcut || "");
    setFormCategory(reply.category);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast({
        title: t("validationError"),
        description: t("titleContentRequired"),
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        title: formTitle.trim(),
        content: formContent.trim(),
        shortcut: formShortcut.trim() || null,
        category: formCategory,
        ...(editingReply ? { id: editingReply.id } : {}),
      };

      const method = editingReply ? "PATCH" : "POST";
      const res = await fetch("/api/meta-hub/quick-replies", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: editingReply ? t("replyUpdated") : t("replyCreated"),
        description: t("replySaved", { title: formTitle }),
      });

      setDialogOpen(false);
      fetchQuickReplies();
    } catch (err) {
      toast({
        title: t("errorSaving"),
        description: err instanceof Error ? err.message : t("unknownError"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reply: QuickReply) => {
    if (!confirm(t("confirmDelete", { title: reply.title }))) return;

    try {
      const res = await fetch(`/api/meta-hub/quick-replies?id=${reply.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: t("replyDeleted"),
        description: t("replyRemoved", { title: reply.title }),
      });

      fetchQuickReplies();
    } catch (err) {
      toast({
        title: t("errorDeleting"),
        description: err instanceof Error ? err.message : t("unknownError"),
        variant: "destructive",
      });
    }
  };

  const insertVariable = (variable: string) => {
    setFormContent(prev => prev + variable);
  };

  // ============================================================================
  // FILTERED DATA
  // ============================================================================

  const categories = [...new Set(quickReplies.map(r => r.category))];
  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categories])];

  const filteredReplies = quickReplies.filter(reply => {
    const matchesSearch = search === "" || 
      reply.title.toLowerCase().includes(search.toLowerCase()) ||
      reply.content.toLowerCase().includes(search.toLowerCase()) ||
      (reply.shortcut?.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || reply.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedReplies = filteredReplies.reduce((acc, reply) => {
    if (!acc[reply.category]) acc[reply.category] = [];
    acc[reply.category].push(reply);
    return acc;
  }, {} as Record<string, QuickReply[]>);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("loading")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-amber-500" />
              {t("title")}
            </CardTitle>
            <CardDescription>
              {t("description")}
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <PlusIcon className="h-4 w-4 mr-2" />
            {t("addReply")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allCategories")}</SelectItem>
                {allCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Empty state */}
          {filteredReplies.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <SparklesIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">{t("noRepliesFound")}</p>
              <p className="text-sm">
                {quickReplies.length === 0 
                  ? t("createFirstReply")
                  : t("adjustSearch")}
              </p>
              {quickReplies.length === 0 && (
                <Button className="mt-4" onClick={openCreateDialog}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {t("createReply")}
                </Button>
              )}
            </div>
          )}

          {/* Grouped list */}
          {Object.entries(groupedReplies).map(([category, replies]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {category}
              </h3>
              <div className="grid gap-2">
                {replies.map(reply => (
                  <QuickReplyCard
                    key={reply.id}
                    reply={reply}
                    onEdit={() => openEditDialog(reply)}
                    onDelete={() => handleDelete(reply)}
                  />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingReply ? t("editReply") : t("createReply")}
            </DialogTitle>
            <DialogDescription>
              {t("dialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("titleLabel")}</Label>
              <Input
                id="title"
                placeholder="e.g., Welcome Message"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortcut">
                {t("shortcutLabel")} <span className="text-muted-foreground">({t("optional")})</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">/</span>
                <Input
                  id="shortcut"
                  placeholder="welcome"
                  value={formShortcut}
                  onChange={(e) => setFormShortcut(e.target.value.replace(/[^a-z0-9_-]/gi, ""))}
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Type /{formShortcut || "shortcut"} in the inbox to insert this reply
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t("categoryLabel")}</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">{t("contentLabel")}</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <HashIcon className="h-3 w-3 mr-1" />
                      {t("insertVariable")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {VARIABLE_HINTS.map(v => (
                      <DropdownMenuItem key={v.name} onClick={() => insertVariable(v.name)}>
                        <code className="text-xs bg-muted px-1 rounded mr-2">{v.name}</code>
                        <span className="text-muted-foreground text-xs">{v.desc}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Textarea
                id="content"
                placeholder="Hello {{contact_name}}! Thank you for reaching out..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("saving") : editingReply ? t("saveChanges") : t("createReply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function QuickReplyCard({
  reply,
  onEdit,
  onDelete,
}: {
  reply: QuickReply;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{reply.title}</h4>
            {reply.shortcut && (
              <Badge variant="secondary" className="text-xs font-mono">
                /{reply.shortcut}
              </Badge>
            )}
            {reply.hasVariables && (
              <Badge variant="outline" className="text-xs">
                <HashIcon className="h-3 w-3 mr-1" />
                Variables
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {reply.content}
          </p>
          {reply.useCount > 0 && (
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>Used {reply.useCount} times</span>
              {reply.lastUsedAt && (
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  Last: {new Date(reply.lastUsedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <EditIcon className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default QuickRepliesManager;
