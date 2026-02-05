"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpenIcon,
  MessageCircleIcon,
  UploadIcon,
  SearchIcon,
  TrashIcon,
  RefreshCwIcon,
  Loader2Icon,
  CheckCircleIcon,
  FileIcon,
  GlobeIcon,
  DatabaseIcon,
  SparklesIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
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

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

type SourceType = 
  | "kb_article"
  | "wa_conversation"
  | "uploaded_document"
  | "helper_conversation"
  | "contact"
  | "product_data";

type KnowledgeSource = {
  id: string;
  source_type: SourceType;
  source_id: string;
  title: string | null;
  content_text: string;
  metadata: Record<string, unknown> | null;
  indexed_at: string | null;
  is_active: boolean | null;
  created_at: string;
};

type SearchResult = {
  id: string;
  sourceType: SourceType;
  title: string | null;
  contentText: string;
  similarity: number;
};

type Props = {
  workspaceId: string;
  initialSources: KnowledgeSource[];
};

/* ═══════════════════════════════════════════════════════════════════════════
   SOURCE TYPE METADATA
   ═══════════════════════════════════════════════════════════════════════════ */

const SOURCE_TYPE_META: Record<SourceType, { label: string; icon: React.ReactNode; color: string }> = {
  kb_article: {
    label: "Knowledge Article",
    icon: <BookOpenIcon className="h-4 w-4" />,
    color: "text-blue-400",
  },
  uploaded_document: {
    label: "Uploaded Document",
    icon: <FileIcon className="h-4 w-4" />,
    color: "text-purple-400",
  },
  wa_conversation: {
    label: "WhatsApp Conversation",
    icon: <MessageCircleIcon className="h-4 w-4" />,
    color: "text-green-400",
  },
  helper_conversation: {
    label: "Helper Chat",
    icon: <SparklesIcon className="h-4 w-4" />,
    color: "text-[#d4af37]",
  },
  contact: {
    label: "Contact Info",
    icon: <GlobeIcon className="h-4 w-4" />,
    color: "text-cyan-400",
  },
  product_data: {
    label: "Product Data",
    icon: <DatabaseIcon className="h-4 w-4" />,
    color: "text-orange-400",
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function KnowledgeBaseClient({ workspaceId, initialSources }: Props) {
  const { toast } = useToast();
  const [sources, setSources] = useState<KnowledgeSource[]>(initialSources);
  const [loading, setLoading] = useState(false);
  
  // Add article modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addContent, setAddContent] = useState("");
  const [addType, setAddType] = useState<SourceType>("kb_article");
  const [adding, setAdding] = useState(false);
  
  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load sources
  const refreshSources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/helper/knowledge/sources?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.sources) {
        setSources(data.sources);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load sources", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, toast]);

  // Add new knowledge article
  const handleAddSource = async () => {
    if (!addTitle.trim() || !addContent.trim()) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/helper/knowledge/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          sourceType: addType,
          title: addTitle.trim(),
          content: addContent.trim(),
        }),
      });

      const data = await res.json();
      if (data.ok) {
        toast({ title: "✅ Added", description: "Knowledge source indexed successfully" });
        setShowAddModal(false);
        setAddTitle("");
        setAddContent("");
        await refreshSources();
      } else {
        toast({ title: "Error", description: data.error || "Failed to add source", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to add source", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  // Delete source
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/helper/knowledge/sources?id=${deleteId}&workspaceId=${workspaceId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.ok) {
        toast({ title: "🗑️ Deleted", description: "Source removed from knowledge base" });
        setSources((prev) => prev.filter((s) => s.id !== deleteId));
        setDeleteId(null);
      } else {
        toast({ title: "Error", description: data.error || "Failed to delete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  // Search knowledge base
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/helper/knowledge/search?workspaceId=${workspaceId}&query=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch {
      toast({ title: "Error", description: "Search failed", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  // Stats
  const totalSources = sources.length;
  const indexedSources = sources.filter((s) => s.indexed_at).length;
  const sourceTypeGroups = sources.reduce(
    (acc, s) => {
      acc[s.source_type] = (acc[s.source_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="h-full flex flex-col space-y-6 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f9d976]/10 shadow-lg shadow-[#d4af37]/10">
            <BookOpenIcon className="h-6 w-6 text-[#d4af37]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5dc]">Knowledge Base</h1>
            <p className="text-sm text-[#f5f5dc]/60">
              Teach your AI assistant about your business
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshSources}
            disabled={loading}
            className="border-[#d4af37]/30 text-[#f5f5dc]"
          >
            {loading ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="h-4 w-4" />
            )}
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18] hover:opacity-90"
          >
            <UploadIcon className="mr-2 h-4 w-4" />
            Add Knowledge
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-4">
          <p className="text-xs uppercase tracking-wider text-[#f5f5dc]/40">Total Sources</p>
          <p className="mt-1 text-2xl font-bold text-[#d4af37]">{totalSources}</p>
        </div>
        <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-4">
          <p className="text-xs uppercase tracking-wider text-[#f5f5dc]/40">Indexed</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{indexedSources}</p>
        </div>
        <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-4">
          <p className="text-xs uppercase tracking-wider text-[#f5f5dc]/40">Articles</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">{sourceTypeGroups.kb_article || 0}</p>
        </div>
        <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-4">
          <p className="text-xs uppercase tracking-wider text-[#f5f5dc]/40">Documents</p>
          <p className="mt-1 text-2xl font-bold text-purple-400">{sourceTypeGroups.uploaded_document || 0}</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#f5f5dc] flex items-center gap-2">
          <SearchIcon className="h-5 w-5 text-[#d4af37]" />
          Test Knowledge Search
        </h2>
        <div className="flex gap-3">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Ask a question to test if AI can find the answer..."
            className="flex-1 border-[#d4af37]/30 bg-[#050a18] text-[#f5f5dc]"
          />
          <Button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="bg-[#d4af37] text-[#050a18] hover:bg-[#f9d976]"
          >
            {searching ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
          </Button>
        </div>

        {/* Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              <p className="text-sm text-[#f5f5dc]/60">{searchResults.length} relevant sources found:</p>
              {searchResults.map((result) => {
                const meta = SOURCE_TYPE_META[result.sourceType];
                return (
                  <div
                    key={result.id}
                    className="rounded-xl border border-[#d4af37]/20 bg-[#050a18]/60 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={meta?.color}>{meta?.icon}</span>
                        <span className="font-medium text-[#f5f5dc]">{result.title || "Untitled"}</span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                        {Math.round(result.similarity * 100)}% match
                      </span>
                    </div>
                    <p className="text-sm text-[#f5f5dc]/70 line-clamp-3">{result.contentText}</p>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sources List */}
      <div className="flex-1 rounded-2xl border border-[#d4af37]/20 bg-[#0a1229]/80 p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#f5f5dc]">Knowledge Sources</h2>
        
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpenIcon className="h-12 w-12 text-[#f5f5dc]/20 mb-4" />
            <p className="text-[#f5f5dc]/60">No knowledge sources yet</p>
            <p className="text-sm text-[#f5f5dc]/40 mt-1">
              Add articles, FAQs, or product info to make your AI smarter
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="mt-4 bg-[#d4af37] text-[#050a18]"
            >
              <UploadIcon className="mr-2 h-4 w-4" />
              Add First Source
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((source) => {
              const meta = SOURCE_TYPE_META[source.source_type];
              return (
                <motion.div
                  key={source.id}
                  layout
                  className="flex items-start justify-between rounded-xl border border-[#d4af37]/20 bg-[#050a18]/60 p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={meta?.color}>{meta?.icon}</span>
                      <span className="font-medium text-[#f5f5dc] truncate">
                        {source.title || "Untitled"}
                      </span>
                      {source.indexed_at ? (
                        <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <AlertTriangleIcon className="h-4 w-4 text-amber-400" />
                      )}
                    </div>
                    <p className="text-sm text-[#f5f5dc]/50 line-clamp-2">{source.content_text}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#f5f5dc]/40">
                      <span>{meta?.label}</span>
                      <span>•</span>
                      <span>{new Date(source.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(source.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="border-[#d4af37]/20 bg-[#0a1229]">
          <DialogHeader>
            <DialogTitle className="text-[#f5f5dc]">Add Knowledge Source</DialogTitle>
            <DialogDescription className="text-[#f5f5dc]/60">
              Add information that your AI assistant should know about.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#f5f5dc]/60">Source Type</label>
              <Select value={addType} onValueChange={(v) => setAddType(v as SourceType)}>
                <SelectTrigger className="mt-1 border-[#d4af37]/30 bg-[#050a18] text-[#f5f5dc]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#d4af37]/20 bg-[#0a1229]">
                  <SelectItem value="kb_article">📚 Knowledge Article</SelectItem>
                  <SelectItem value="uploaded_document">📄 Document</SelectItem>
                  <SelectItem value="product_data">📦 Product Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-[#f5f5dc]/60">Title</label>
              <Input
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                placeholder="e.g., Pricing FAQ, Return Policy, Product Guide..."
                className="mt-1 border-[#d4af37]/30 bg-[#050a18] text-[#f5f5dc]"
              />
            </div>
            <div>
              <label className="text-sm text-[#f5f5dc]/60">Content</label>
              <Textarea
                value={addContent}
                onChange={(e) => setAddContent(e.target.value)}
                placeholder="Enter the knowledge content here..."
                rows={8}
                className="mt-1 border-[#d4af37]/30 bg-[#050a18] text-[#f5f5dc]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSource}
              disabled={adding || !addTitle.trim() || !addContent.trim()}
              className="bg-[#d4af37] text-[#050a18] hover:bg-[#f9d976]"
            >
              {adding ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add to Knowledge Base
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="border-[#d4af37]/20 bg-[#0a1229]">
          <DialogHeader>
            <DialogTitle className="text-[#f5f5dc]">Delete Source?</DialogTitle>
            <DialogDescription className="text-[#f5f5dc]/60">
              This will permanently remove this source from your knowledge base. The AI will no longer be able to use this information.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
