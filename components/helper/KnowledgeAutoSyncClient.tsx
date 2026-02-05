"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Database,
  RefreshCw,
  Plus,
  Settings,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Link,
  FileText,
  Globe,
  Trash2,
  Edit2,
  Eye,
  Download,
  Zap,
  Calendar,
  TrendingUp,
  Sparkles,
  Brain,
  FileType,
  Layers,
  Server,
  Activity,
  BarChart3,
  Play,
  Pause,
  Timer,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface KnowledgeSource {
  id: string;
  name: string;
  type: "url" | "file" | "text" | "api" | "notion" | "confluence";
  url?: string;
  status: "active" | "syncing" | "error" | "pending";
  autoSync: boolean;
  syncInterval: "hourly" | "daily" | "weekly" | "manual";
  lastSyncAt?: string;
  nextSyncAt?: string;
  chunkCount: number;
  tokenCount: number;
  created_at: string;
  error?: string;
  syncHistory?: SyncEvent[];
}

interface SyncEvent {
  id: string;
  timestamp: string;
  status: "success" | "failed" | "partial";
  chunksAdded: number;
  chunksUpdated: number;
  chunksDeleted: number;
  duration: number;
  error?: string;
}

interface KBStats {
  totalSources: number;
  activeSources: number;
  totalChunks: number;
  totalTokens: number;
  syncingNow: number;
  errorCount: number;
  lastSyncAt: string | null;
}

interface Props {
  workspaceId: string;
  workspaceSlug: string;
  initialSources?: KnowledgeSource[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════════════════ */

const mockSources: KnowledgeSource[] = [
  {
    id: "kb-1",
    name: "Product Documentation",
    type: "url",
    url: "https://docs.example.com",
    status: "active",
    autoSync: true,
    syncInterval: "daily",
    lastSyncAt: new Date(Date.now() - 3600000).toISOString(),
    nextSyncAt: new Date(Date.now() + 82800000).toISOString(),
    chunkCount: 245,
    tokenCount: 125000,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    syncHistory: [
      { id: "s1", timestamp: new Date(Date.now() - 3600000).toISOString(), status: "success", chunksAdded: 5, chunksUpdated: 12, chunksDeleted: 0, duration: 45000 },
      { id: "s2", timestamp: new Date(Date.now() - 90000000).toISOString(), status: "success", chunksAdded: 0, chunksUpdated: 3, chunksDeleted: 0, duration: 32000 },
    ],
  },
  {
    id: "kb-2",
    name: "FAQ Knowledge Base",
    type: "file",
    status: "syncing",
    autoSync: true,
    syncInterval: "weekly",
    lastSyncAt: new Date(Date.now() - 86400000).toISOString(),
    chunkCount: 89,
    tokenCount: 45000,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: "kb-3",
    name: "Company Policies",
    type: "notion",
    url: "https://notion.so/workspace",
    status: "active",
    autoSync: false,
    syncInterval: "manual",
    lastSyncAt: new Date(Date.now() - 259200000).toISOString(),
    chunkCount: 156,
    tokenCount: 78000,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "kb-4",
    name: "API Integration Docs",
    type: "api",
    url: "https://api.example.com/docs",
    status: "error",
    autoSync: true,
    syncInterval: "hourly",
    lastSyncAt: new Date(Date.now() - 7200000).toISOString(),
    chunkCount: 67,
    tokenCount: 34000,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    error: "API authentication failed - token expired",
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════════════════════ */

const getSourceIcon = (type: KnowledgeSource["type"]) => {
  switch (type) {
    case "url": return Globe;
    case "file": return FileText;
    case "text": return FileType;
    case "api": return Server;
    case "notion": return Layers;
    case "confluence": return BookOpen;
  }
};

const getStatusConfig = (status: KnowledgeSource["status"]) => {
  switch (status) {
    case "active": return { label: "Active", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle };
    case "syncing": return { label: "Syncing", color: "text-blue-400 bg-blue-500/10 border-blue-500/30", icon: RefreshCw };
    case "error": return { label: "Error", color: "text-red-400 bg-red-500/10 border-red-500/30", icon: XCircle };
    case "pending": return { label: "Pending", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30", icon: Clock };
  }
};

const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
};

const getTimeAgo = (date: string): string => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const getTimeUntil = (date: string): string => {
  const seconds = Math.floor((new Date(date).getTime() - Date.now()) / 1000);
  if (seconds < 0) return "overdue";
  if (seconds < 60) return "soon";
  if (seconds < 3600) return `in ${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `in ${Math.floor(seconds / 3600)}h`;
  return `in ${Math.floor(seconds / 86400)}d`;
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function KnowledgeAutoSyncClient({
  workspaceId,
  workspaceSlug,
  initialSources = mockSources,
}: Props) {
  const [sources, setSources] = useState<KnowledgeSource[]>(initialSources);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("sources");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<KnowledgeSource | null>(null);
  const [syncing, setSyncing] = useState<Set<string>>(new Set());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const hasFetched = useRef(false);

  // Fetch sync jobs from API
  const fetchSyncJobs = useCallback(async () => {
    try {
      const res = await fetch(`/api/helper/knowledge/sync?workspaceId=${workspaceId}`, { 
        cache: "no-store" 
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.jobs) {
          // Update sources with sync status from jobs
          type SyncJob = { source_id: string; status: string; completed_at?: string };
          const jobsBySource = new Map<string, SyncJob>(
            (data.jobs as SyncJob[]).map((j) => [j.source_id, j])
          );
          setSources(prev => prev.map(source => {
            const job = jobsBySource.get(source.id);
            if (job) {
              return {
                ...source,
                status: job.status === "running" ? "syncing" as const : source.status,
                lastSyncAt: job.completed_at || source.lastSyncAt,
              };
            }
            return source;
          }));
        }
      }
    } catch (error) {
      console.error("[Knowledge] Failed to fetch sync jobs:", error);
    }
  }, [workspaceId]);

  // Fetch on workspace change and auto-sync every 60 seconds
  useEffect(() => {
    // Initial fetch via interval trick
    if (!hasFetched.current) {
      hasFetched.current = true;
      const timer = setTimeout(() => void fetchSyncJobs(), 0);
      return () => clearTimeout(timer);
    }
    
    const interval = setInterval(() => {
      void fetchSyncJobs();
      setLastCheck(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchSyncJobs]);

  // Log workspace on init
  useEffect(() => {
    console.log(`[Knowledge] Initialized for workspace: ${workspaceSlug} (${workspaceId})`);
  }, [workspaceId, workspaceSlug]);

  // Calculate stats
  const stats: KBStats = {
    totalSources: sources.length,
    activeSources: sources.filter(s => s.status === "active").length,
    totalChunks: sources.reduce((sum, s) => sum + s.chunkCount, 0),
    totalTokens: sources.reduce((sum, s) => sum + s.tokenCount, 0),
    syncingNow: sources.filter(s => s.status === "syncing").length,
    errorCount: sources.filter(s => s.status === "error").length,
    lastSyncAt: sources.filter(s => s.lastSyncAt).sort((a, b) => 
      new Date(b.lastSyncAt!).getTime() - new Date(a.lastSyncAt!).getTime()
    )[0]?.lastSyncAt || null,
  };

  // Filter sources
  const filteredSources = sources.filter(source => {
    const matchesSearch = !searchQuery || 
      source.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || source.status === filterStatus;
    const matchesType = filterType === "all" || source.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Sync a source - Real API
  const syncSource = useCallback(async (sourceId: string) => {
    setSyncing(prev => new Set([...prev, sourceId]));
    setSources(prev => prev.map(s => 
      s.id === sourceId ? { ...s, status: "syncing" as const } : s
    ));

    try {
      const res = await fetch(`/api/helper/knowledge/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          source_id: sourceId,
        }),
      });
      
      if (res.ok) {
        // Wait a bit then check status
        await new Promise(resolve => setTimeout(resolve, 2000));
        await fetchSyncJobs();
      }
    } catch (error) {
      console.error("[Knowledge] Sync failed:", error);
    }

    setSources(prev => prev.map(s => 
      s.id === sourceId ? { 
        ...s, 
        status: "active" as const,
        lastSyncAt: new Date().toISOString(),
      } : s
    ));
    setSyncing(prev => {
      const next = new Set(prev);
      next.delete(sourceId);
      return next;
    });
  }, [workspaceId, fetchSyncJobs]);

  // Toggle auto-sync
  const toggleAutoSync = useCallback((sourceId: string) => {
    setSources(prev => prev.map(s => 
      s.id === sourceId ? { ...s, autoSync: !s.autoSync } : s
    ));
  }, []);

  // Sync all sources
  const syncAll = useCallback(async () => {
    for (const source of sources.filter(s => s.status !== "syncing")) {
      await syncSource(source.id);
    }
  }, [sources, syncSource]);

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#050a18]">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent flex items-center gap-2">
              <Database className="h-6 w-6 text-[#d4af37]" />
              Knowledge Base Auto-Sync
            </h1>
            <p className="text-[#f5f5dc]/60 mt-1">
              Manage your AI knowledge sources and sync schedules
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Loading & Last check indicator */}
            <div className="flex items-center gap-2 text-xs text-[#f5f5dc]/60">
              {loading && <Loader2 className="h-3 w-3 animate-spin text-[#d4af37]" />}
              <Clock className="h-3 w-3" />
              <span>Checked: {lastCheck.toLocaleTimeString()}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-[#f5f5dc]/20 text-[#f5f5dc]/70 hover:text-[#d4af37]"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={syncAll}
              disabled={syncing.size > 0}
              className="border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/10"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", syncing.size > 0 && "animate-spin")} />
              Sync All
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18] hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Sources", value: stats.totalSources, icon: Database, gradient: "from-[#d4af37] to-[#f9d976]" },
            { label: "Active", value: stats.activeSources, icon: CheckCircle, gradient: "from-emerald-500 to-emerald-400" },
            { label: "Total Chunks", value: stats.totalChunks, icon: Layers, gradient: "from-purple-500 to-purple-400" },
            { label: "Total Tokens", value: formatTokens(stats.totalTokens), icon: Brain, gradient: "from-cyan-500 to-cyan-400" },
            { label: "Syncing", value: stats.syncingNow, icon: RefreshCw, gradient: "from-blue-500 to-blue-400", animated: stats.syncingNow > 0 },
            { label: "Errors", value: stats.errorCount, icon: AlertTriangle, gradient: "from-red-500 to-red-400" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#f5f5dc]/60">{stat.label}</p>
                  <p className="text-2xl font-bold text-[#f5f5dc] mt-1">{stat.value}</p>
                </div>
                <div className={cn("p-2 rounded-lg bg-gradient-to-br", stat.gradient)}>
                  <stat.icon className={cn("h-4 w-4 text-[#050a18]", stat.animated && "animate-spin")} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#0a1229]/80 border border-[#d4af37]/20 p-1">
            <TabsTrigger value="sources" className="data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-[#d4af37]">
              <Database className="h-4 w-4 mr-2" />
              Sources
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-[#d4af37]">
              <Calendar className="h-4 w-4 mr-2" />
              Sync Schedule
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-[#d4af37]">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Sources Tab */}
          <TabsContent value="sources" className="mt-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#f5f5dc]/40" />
                <Input
                  placeholder="Search sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0a1229]/80 border-[#d4af37]/20 text-[#f5f5dc]"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px] bg-[#0a1229]/80 border-[#d4af37]/20 text-[#f5f5dc]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1229] border-[#d4af37]/20">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="syncing">Syncing</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px] bg-[#0a1229]/80 border-[#d4af37]/20 text-[#f5f5dc]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1229] border-[#d4af37]/20">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="notion">Notion</SelectItem>
                  <SelectItem value="confluence">Confluence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sources List */}
            <div className="space-y-3">
              {filteredSources.map((source, idx) => {
                const TypeIcon = getSourceIcon(source.type);
                const statusConfig = getStatusConfig(source.status);
                const StatusIcon = statusConfig.icon;
                const isSyncing = syncing.has(source.id) || source.status === "syncing";

                return (
                  <motion.div
                    key={source.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-4 hover:border-[#d4af37]/40 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {/* Type Icon */}
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/10 flex items-center justify-center">
                        <TypeIcon className="h-6 w-6 text-[#d4af37]" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-[#f5f5dc]">{source.name}</h4>
                          <Badge className={cn("text-xs border", statusConfig.color)}>
                            <StatusIcon className={cn("h-3 w-3 mr-1", isSyncing && "animate-spin")} />
                            {statusConfig.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-[#f5f5dc]/20 text-[#f5f5dc]/60">
                            {source.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-[#f5f5dc]/60">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {source.chunkCount} chunks
                          </span>
                          <span className="flex items-center gap-1">
                            <Brain className="h-3 w-3" />
                            {formatTokens(source.tokenCount)} tokens
                          </span>
                          {source.lastSyncAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Synced {getTimeAgo(source.lastSyncAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Auto-Sync Toggle */}
                      <div className="hidden sm:flex flex-col items-center gap-1">
                        <Switch
                          checked={source.autoSync}
                          onCheckedChange={() => toggleAutoSync(source.id)}
                          className="data-[state=checked]:bg-[#d4af37]"
                        />
                        <span className="text-xs text-[#f5f5dc]/40">Auto-sync</span>
                      </div>

                      {/* Next Sync */}
                      {source.autoSync && source.nextSyncAt && (
                        <div className="hidden lg:block text-right">
                          <p className="text-xs text-[#f5f5dc]/40">Next sync</p>
                          <p className="text-sm text-[#f5f5dc]/60">{getTimeUntil(source.nextSyncAt)}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => syncSource(source.id)}
                                disabled={isSyncing}
                                className="h-8 w-8 text-[#d4af37] hover:bg-[#d4af37]/10"
                              >
                                <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#0a1229] border-[#d4af37]/20">Sync Now</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setSelectedSource(source)}
                                className="h-8 w-8 text-[#f5f5dc]/60 hover:text-[#f5f5dc]"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#0a1229] border-[#d4af37]/20">Settings</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#0a1229] border-[#d4af37]/20">Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {/* Error Message */}
                    {source.error && (
                      <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <p className="text-sm text-red-400 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                          {source.error}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {filteredSources.length === 0 && (
                <div className="text-center py-12 rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80">
                  <Database className="h-12 w-12 text-[#f5f5dc]/20 mx-auto mb-4" />
                  <p className="text-[#f5f5dc]/60">No knowledge sources found</p>
                  <Button
                    size="sm"
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Source
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="mt-6">
            <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl overflow-hidden">
              <div className="p-4 border-b border-[#d4af37]/10 flex items-center justify-between">
                <h3 className="font-semibold text-[#d4af37] flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Sync Schedule
                </h3>
                <Badge variant="outline" className="text-xs border-[#f5f5dc]/20 text-[#f5f5dc]/60">
                  {sources.filter(s => s.autoSync).length} auto-sync enabled
                </Badge>
              </div>
              <div className="divide-y divide-[#d4af37]/10">
                {sources
                  .filter(s => s.autoSync)
                  .sort((a, b) => {
                    if (!a.nextSyncAt) return 1;
                    if (!b.nextSyncAt) return -1;
                    return new Date(a.nextSyncAt).getTime() - new Date(b.nextSyncAt).getTime();
                  })
                  .map((source) => {
                    const TypeIcon = getSourceIcon(source.type);
                    return (
                      <div key={source.id} className="flex items-center gap-4 p-4 hover:bg-[#f5f5dc]/5">
                        <div className="h-10 w-10 rounded-lg bg-[#d4af37]/10 flex items-center justify-center">
                          <TypeIcon className="h-5 w-5 text-[#d4af37]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[#f5f5dc]">{source.name}</p>
                          <p className="text-sm text-[#f5f5dc]/60">
                            Syncs {source.syncInterval} • Last: {source.lastSyncAt ? getTimeAgo(source.lastSyncAt) : "Never"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-[#d4af37]">
                            {source.nextSyncAt ? getTimeUntil(source.nextSyncAt) : "Calculating..."}
                          </p>
                          <p className="text-xs text-[#f5f5dc]/40">Next sync</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Token Distribution */}
              <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-6">
                <h3 className="font-semibold text-[#d4af37] mb-4 flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Token Distribution
                </h3>
                <div className="space-y-4">
                  {sources.slice(0, 5).map((source) => {
                    const percentage = (source.tokenCount / stats.totalTokens) * 100;
                    return (
                      <div key={source.id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-[#f5f5dc]">{source.name}</span>
                          <span className="text-[#f5f5dc]/60">{formatTokens(source.tokenCount)}</span>
                        </div>
                        <Progress value={percentage} className="h-2 bg-[#050a18]" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sync Activity */}
              <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#d4af37] flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Sync Activity
                  </h3>
                  <Button variant="outline" size="sm" className="border-[#f5f5dc]/20 text-[#f5f5dc]/70">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                <div className="space-y-3">
                  {sources
                    .filter(s => s.lastSyncAt)
                    .sort((a, b) => new Date(b.lastSyncAt!).getTime() - new Date(a.lastSyncAt!).getTime())
                    .slice(0, 5)
                    .map((source) => {
                      return (
                        <div key={source.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#050a18]/50">
                          <div className={cn("h-2 w-2 rounded-full", 
                            source.status === "active" ? "bg-emerald-500" :
                            source.status === "error" ? "bg-red-500" : "bg-yellow-500"
                          )} />
                          <Link className="h-3 w-3 text-[#f5f5dc]/40" />
                          <span className="text-sm text-[#f5f5dc] flex-1">{source.name}</span>
                          <span className="text-xs text-[#f5f5dc]/40">{getTimeAgo(source.lastSyncAt!)}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Source Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-[#0a1229] border-[#d4af37]/20 text-[#f5f5dc]">
          <DialogHeader>
            <DialogTitle className="text-[#d4af37]">Add Knowledge Source</DialogTitle>
            <DialogDescription className="text-[#f5f5dc]/60">
              Connect a new data source for AI to learn from.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Source Name</Label>
              <Input placeholder="e.g., Product Documentation" className="bg-[#050a18] border-[#d4af37]/20" />
            </div>
            <div className="space-y-2">
              <Label>Source Type</Label>
              <Select>
                <SelectTrigger className="bg-[#050a18] border-[#d4af37]/20">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1229] border-[#d4af37]/20">
                  <SelectItem value="url">URL / Website</SelectItem>
                  <SelectItem value="file">File Upload</SelectItem>
                  <SelectItem value="api">API Endpoint</SelectItem>
                  <SelectItem value="notion">Notion</SelectItem>
                  <SelectItem value="confluence">Confluence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL / Endpoint</Label>
              <Input placeholder="https://..." className="bg-[#050a18] border-[#d4af37]/20" />
            </div>
            <div className="space-y-2">
              <Label>Sync Interval</Label>
              <Select>
                <SelectTrigger className="bg-[#050a18] border-[#d4af37]/20">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1229] border-[#d4af37]/20">
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="manual">Manual Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="border-[#f5f5dc]/20">
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18]">
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Source Detail Modal */}
      <Dialog open={!!selectedSource} onOpenChange={(open) => !open && setSelectedSource(null)}>
        <DialogContent className="bg-[#0a1229] border-[#d4af37]/20 text-[#f5f5dc] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#d4af37] flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Source Details
            </DialogTitle>
          </DialogHeader>
          {selectedSource && (
            <div className="space-y-4 py-4">
              {/* Source Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-[#050a18]/50">
                  <p className="text-xs text-[#f5f5dc]/60">Name</p>
                  <p className="font-medium text-[#f5f5dc] flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#d4af37]" />
                    {selectedSource.name}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#050a18]/50">
                  <p className="text-xs text-[#f5f5dc]/60">Type</p>
                  <p className="font-medium text-[#f5f5dc] flex items-center gap-2">
                    <FileType className="h-4 w-4 text-[#d4af37]" />
                    {selectedSource.type}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#050a18]/50">
                  <p className="text-xs text-[#f5f5dc]/60">Chunks</p>
                  <p className="font-medium text-[#f5f5dc]">{selectedSource.chunkCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#050a18]/50">
                  <p className="text-xs text-[#f5f5dc]/60">Tokens</p>
                  <p className="font-medium text-[#f5f5dc]">{formatTokens(selectedSource.tokenCount)}</p>
                </div>
              </div>

              {/* Sync Info */}
              <div className="p-3 rounded-lg bg-[#050a18]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#f5f5dc]/60 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Last Sync
                  </span>
                  <span className="text-sm text-[#f5f5dc]">
                    {selectedSource.lastSyncAt ? new Date(selectedSource.lastSyncAt).toLocaleString() : "Never"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#f5f5dc]/60 flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Interval
                  </span>
                  <span className="text-sm text-[#f5f5dc]">{selectedSource.syncInterval}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#f5f5dc]/60 flex items-center gap-2">
                    {selectedSource.autoSync ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    Auto-Sync
                  </span>
                  <Badge className={cn(
                    "text-xs border",
                    selectedSource.autoSync 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                      : "bg-gray-500/10 text-gray-400 border-gray-500/30"
                  )}>
                    {selectedSource.autoSync ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              {/* Analytics preview */}
              <div className="p-3 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/20">
                <p className="text-sm text-[#d4af37] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Usage Analytics
                </p>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex items-center gap-1 text-xs text-[#f5f5dc]/60">
                    <BarChart3 className="h-3 w-3" />
                    <span>Queries: 142</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#f5f5dc]/60">
                    <Zap className="h-3 w-3" />
                    <span>Hit Rate: 87%</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18]"
                  onClick={() => { syncSource(selectedSource.id); setSelectedSource(null); }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
                <Button variant="outline" className="border-[#f5f5dc]/20">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
