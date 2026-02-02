"use client";

import { useState, useCallback } from "react";
import {
  BookOpenIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  RefreshCwIcon,
  FileTextIcon,
  GlobeIcon,
  HelpCircleIcon,
  BookIcon,
  CodeIcon,
  GraduationCapIcon,
  HistoryIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  Loader2Icon,
  UploadIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type SourceType = "document" | "article" | "faq" | "guide" | "api_docs" | "tutorial" | "changelog";
type SourceStatus = "pending" | "indexed" | "failed";

interface KnowledgeSource {
  id: string;
  source_type: SourceType;
  title: string;
  content_text: string | null;
  url: string | null;
  metadata: Record<string, unknown>;
  status: SourceStatus;
  indexed_at: string | null;
  created_at: string;
}

interface Stats {
  totalSources: number;
  indexedSources: number;
  totalChunks: number;
}

interface Props {
  initialSources: KnowledgeSource[];
  stats: Stats;
}

const SOURCE_TYPES: { value: SourceType; label: string; icon: typeof BookOpenIcon; description: string }[] = [
  { value: "document", label: "Document", icon: FileTextIcon, description: "Product documentation" },
  { value: "article", label: "Article", icon: BookIcon, description: "Help center articles" },
  { value: "faq", label: "FAQ", icon: HelpCircleIcon, description: "Frequently asked questions" },
  { value: "guide", label: "Guide", icon: GraduationCapIcon, description: "Step-by-step tutorials" },
  { value: "api_docs", label: "API Docs", icon: CodeIcon, description: "API reference documentation" },
  { value: "tutorial", label: "Tutorial", icon: GlobeIcon, description: "Interactive tutorials" },
  { value: "changelog", label: "Changelog", icon: HistoryIcon, description: "Release notes & updates" },
];

const STATUS_STYLES: Record<SourceStatus, { icon: typeof CheckCircleIcon; color: string; label: string }> = {
  indexed: { icon: CheckCircleIcon, color: "text-green-500", label: "Indexed" },
  pending: { icon: ClockIcon, color: "text-yellow-500", label: "Pending" },
  failed: { icon: XCircleIcon, color: "text-red-500", label: "Failed" },
};

export function PlatformKnowledgeClient({ initialSources, stats }: Props) {
  const [sources, setSources] = useState<KnowledgeSource[]>(initialSources);
  const [currentStats, setCurrentStats] = useState(stats);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<KnowledgeSource | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [testQuery, setTestQuery] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formType, setFormType] = useState<SourceType>("document");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formUrl, setFormUrl] = useState("");

  const filteredSources = sources.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = useCallback(() => {
    setFormType("document");
    setFormTitle("");
    setFormContent("");
    setFormUrl("");
  }, []);

  const handleAdd = useCallback(async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast({ title: "Title and content are required", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/ops/platform-kb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_type: formType,
          title: formTitle.trim(),
          content_text: formContent.trim(),
          url: formUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add knowledge");
      }

      const { data } = await res.json();
      setSources((prev) => [data, ...prev]);
      setCurrentStats((prev) => ({
        ...prev,
        totalSources: prev.totalSources + 1,
      }));
      setIsAddOpen(false);
      resetForm();
      toast({ title: "Knowledge added successfully" });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to add knowledge",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formType, formTitle, formContent, formUrl, toast, resetForm]);

  const handleDelete = useCallback(async () => {
    if (!selectedSource) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/ops/platform-kb?id=${selectedSource.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }

      setSources((prev) => prev.filter((s) => s.id !== selectedSource.id));
      setCurrentStats((prev) => ({
        ...prev,
        totalSources: Math.max(0, prev.totalSources - 1),
        indexedSources:
          selectedSource.status === "indexed"
            ? Math.max(0, prev.indexedSources - 1)
            : prev.indexedSources,
      }));
      setIsDeleteOpen(false);
      setSelectedSource(null);
      toast({ title: "Knowledge deleted" });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedSource, toast]);

  const handleReindex = useCallback(async (sourceId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ops/platform-kb/reindex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sourceId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reindex");
      }

      setSources((prev) =>
        prev.map((s) =>
          s.id === sourceId ? { ...s, status: "indexed" as SourceStatus, indexed_at: new Date().toISOString() } : s
        )
      );
      toast({ title: "Reindexed successfully" });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to reindex",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleTestSearch = useCallback(async () => {
    if (!testQuery.trim()) return;

    setIsTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ops/platform-kb/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: testQuery.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Search failed");
      }

      const { results } = await res.json();
      if (results.length === 0) {
        setTestResult("No matching knowledge found.");
      } else {
        const formatted = results
          .map((r: { title: string; content: string; similarity: number }, i: number) =>
            `**${i + 1}. ${r.title}** (${Math.round(r.similarity * 100)}% match)\n${r.content.slice(0, 200)}...`
          )
          .join("\n\n");
        setTestResult(formatted);
      }
    } catch (err) {
      setTestResult(`Error: ${err instanceof Error ? err.message : "Search failed"}`);
    } finally {
      setIsTestLoading(false);
    }
  }, [testQuery]);

  const refreshSources = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ops/platform-kb");
      if (!res.ok) throw new Error("Failed to fetch");
      const { data, stats: newStats } = await res.json();
      setSources(data);
      setCurrentStats(newStats);
    } catch {
      toast({ title: "Failed to refresh", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent">
            Platform Knowledge Base
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage Gigaviz documentation that AI uses to answer questions for all workspaces
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTestOpen(true)}
            className="gap-2"
          >
            <SearchIcon className="h-4 w-4" />
            Test Search
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshSources}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCwIcon className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="gap-2 bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18] hover:opacity-90"
          >
            <PlusIcon className="h-4 w-4" />
            Add Knowledge
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#f9d976]">
              <BookOpenIcon className="h-5 w-5 text-[#050a18]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{currentStats.totalSources}</p>
              <p className="text-sm text-muted-foreground">Total Sources</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-400">
              <CheckCircleIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{currentStats.indexedSources}</p>
              <p className="text-sm text-muted-foreground">Indexed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{currentStats.totalChunks}</p>
              <p className="text-sm text-muted-foreground">Indexed Chunks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search knowledge sources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sources List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpenIcon className="h-5 w-5 text-[#d4af37]" />
            Knowledge Sources ({filteredSources.length})
          </CardTitle>
          <CardDescription>
            Content used by AI to answer questions about Gigaviz platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSources.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpenIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p>No knowledge sources yet</p>
              <p className="text-sm mt-1">Add platform documentation to help AI answer questions</p>
              <Button
                onClick={() => setIsAddOpen(true)}
                className="mt-4 gap-2"
                variant="outline"
              >
                <UploadIcon className="h-4 w-4" />
                Add First Source
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSources.map((source) => {
                const typeConfig = SOURCE_TYPES.find((t) => t.value === source.source_type);
                const statusConfig = STATUS_STYLES[source.status];
                const TypeIcon = typeConfig?.icon ?? FileTextIcon;
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/20">
                        <TypeIcon className="h-5 w-5 text-[#d4af37]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{source.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {source.content_text?.slice(0, 100)}...
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                            {typeConfig?.label ?? source.source_type}
                          </span>
                          <span className={cn("text-xs flex items-center gap-1", statusConfig.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(source.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReindex(source.id)}
                        disabled={isLoading}
                        title="Reindex"
                      >
                        <RefreshCwIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedSource(source);
                          setIsDeleteOpen(true);
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5 text-[#d4af37]" />
              Add Platform Knowledge
            </DialogTitle>
            <DialogDescription>
              Add documentation that AI will use to answer questions about Gigaviz
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={formType} onValueChange={(v) => setFormType(v as SourceType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        <span>{type.label}</span>
                        <span className="text-muted-foreground">- {type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                placeholder="e.g., How to Connect WhatsApp Business Account"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                placeholder="Enter the documentation content..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={8}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Reference URL (optional)</label>
              <Input
                placeholder="https://docs.gigaviz.com/..."
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isLoading || !formTitle.trim() || !formContent.trim()}
              className="gap-2 bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18]"
            >
              {isLoading && <Loader2Icon className="h-4 w-4 animate-spin" />}
              Add Knowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Knowledge</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedSource?.title}&quot;? This will remove it from
              the AI&apos;s knowledge base.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading && <Loader2Icon className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Search Dialog */}
      <Dialog open={isTestOpen} onOpenChange={setIsTestOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SearchIcon className="h-5 w-5 text-[#d4af37]" />
              Test Knowledge Search
            </DialogTitle>
            <DialogDescription>
              Test how AI will find relevant knowledge for user questions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., How do I connect WhatsApp?"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTestSearch()}
              />
              <Button onClick={handleTestSearch} disabled={isTestLoading}>
                {isTestLoading ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <SearchIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
            {testResult && (
              <div className="p-4 rounded-lg bg-muted">
                <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
