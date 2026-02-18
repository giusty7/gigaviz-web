"use client";
import { logger } from "@/lib/logging";

import { useState, useCallback, useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Play,
  StopCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Zap,
  AlertTriangle,
  Filter,
  Search,
  Calendar,
  Eye,
  RotateCcw,
  Download,
  Trash2,
  MoreHorizontal,
  GitBranch,
  Boxes,
  Timer,
  BarChart3,
  Sparkles,
  CircleDot,
  Bot,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TYPES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

interface WorkflowStep {
  id: string;
  name: string;
  type: "trigger" | "action" | "condition" | "ai" | "delay";
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  logs?: string[];
}

interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "running" | "completed" | "failed" | "cancelled";
  triggeredBy: "manual" | "schedule" | "webhook" | "event";
  startedAt: string;
  completedAt?: string;
  duration?: number;
  steps: WorkflowStep[];
  context?: Record<string, unknown>;
  error?: string;
}

interface WorkflowStats {
  totalRuns: number;
  successRate: number;
  avgDuration: number;
  runningNow: number;
  todayRuns: number;
  failedToday: number;
}

interface Props {
  workspaceId: string;
  workspaceSlug: string;
  initialRuns?: WorkflowRun[];
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MOCK DATA
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const mockRuns: WorkflowRun[] = [
  {
    id: "run-1",
    workflowId: "wf-1",
    workflowName: "Welcome New Leads",
    status: "completed",
    triggeredBy: "event",
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 3595000).toISOString(),
    duration: 5000,
    steps: [
      { id: "s1", name: "New Contact Trigger", type: "trigger", status: "completed", duration: 50 },
      { id: "s2", name: "Check Contact Tags", type: "condition", status: "completed", duration: 120 },
      { id: "s3", name: "AI Generate Welcome", type: "ai", status: "completed", duration: 2800, output: { message: "Hello! Welcome to our platform..." } },
      { id: "s4", name: "Send WhatsApp Message", type: "action", status: "completed", duration: 1200, output: { messageId: "wamid.xxx" } },
      { id: "s5", name: "Update CRM", type: "action", status: "completed", duration: 800 },
    ],
  },
  {
    id: "run-2",
    workflowId: "wf-2",
    workflowName: "Follow-up Sequence",
    status: "running",
    triggeredBy: "schedule",
    startedAt: new Date(Date.now() - 120000).toISOString(),
    steps: [
      { id: "s1", name: "Schedule Trigger", type: "trigger", status: "completed", duration: 30 },
      { id: "s2", name: "Fetch Pending Leads", type: "action", status: "completed", duration: 500, output: { count: 5 } },
      { id: "s3", name: "AI Personalize Message", type: "ai", status: "running" },
      { id: "s4", name: "Send Messages", type: "action", status: "pending" },
      { id: "s5", name: "Log Activity", type: "action", status: "pending" },
    ],
  },
  {
    id: "run-3",
    workflowId: "wf-3",
    workflowName: "Abandoned Cart Recovery",
    status: "failed",
    triggeredBy: "webhook",
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    completedAt: new Date(Date.now() - 7150000).toISOString(),
    duration: 50000,
    error: "WhatsApp API rate limit exceeded",
    steps: [
      { id: "s1", name: "Webhook Trigger", type: "trigger", status: "completed", duration: 25 },
      { id: "s2", name: "Lookup Customer", type: "action", status: "completed", duration: 300 },
      { id: "s3", name: "Wait 30 minutes", type: "delay", status: "completed", duration: 1800000 },
      { id: "s4", name: "Send Reminder", type: "action", status: "failed", error: "WhatsApp API rate limit exceeded", duration: 5000 },
    ],
  },
  {
    id: "run-4",
    workflowId: "wf-1",
    workflowName: "Welcome New Leads",
    status: "completed",
    triggeredBy: "event",
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 86395000).toISOString(),
    duration: 5000,
    steps: [
      { id: "s1", name: "New Contact Trigger", type: "trigger", status: "completed", duration: 50 },
      { id: "s2", name: "Check Contact Tags", type: "condition", status: "completed", duration: 120 },
      { id: "s3", name: "AI Generate Welcome", type: "ai", status: "completed", duration: 2800 },
      { id: "s4", name: "Send WhatsApp Message", type: "action", status: "skipped" },
      { id: "s5", name: "Update CRM", type: "action", status: "completed", duration: 800 },
    ],
  },
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HELPER FUNCTIONS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
};

const getStatusIcon = (status: WorkflowRun["status"] | WorkflowStep["status"]) => {
  switch (status) {
    case "running": return RefreshCw;
    case "completed": return CheckCircle;
    case "failed": return XCircle;
    case "cancelled": return StopCircle;
    case "pending": return Clock;
    case "skipped": return ChevronRight;
    default: return CircleDot;
  }
};

const getStatusColor = (status: WorkflowRun["status"] | WorkflowStep["status"]) => {
  switch (status) {
    case "running": return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    case "completed": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "failed": return "text-red-400 bg-red-500/10 border-red-500/30";
    case "cancelled": return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    case "pending": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    case "skipped": return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    default: return "text-[#f5f5dc]/60 bg-[#f5f5dc]/10";
  }
};

const getTriggerIcon = (trigger: WorkflowRun["triggeredBy"]) => {
  switch (trigger) {
    case "manual": return Play;
    case "schedule": return Clock;
    case "webhook": return Zap;
    case "event": return Activity;
  }
};

const getStepIcon = (type: WorkflowStep["type"]) => {
  switch (type) {
    case "trigger": return Zap;
    case "action": return Play;
    case "condition": return GitBranch;
    case "ai": return Bot;
    case "delay": return Timer;
  }
};

// Hydration-safe mount check
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN COMPONENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function WorkflowHistoryClient({
  workspaceId,
  workspaceSlug,
  initialRuns = mockRuns,
}: Props) {
  // Hydration-safe check for client-side rendering
  const isMounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const t = useTranslations("helperUI.workflowHistory");

  const [runs, setRuns] = useState<WorkflowRun[]>(initialRuns);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTrigger, setFilterTrigger] = useState<string>("all");
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewingRun, setViewingRun] = useState<WorkflowRun | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Set initial date only on client to avoid hydration mismatch
  useEffect(() => {
    if (!lastRefresh) {
      setLastRefresh(new Date());
    }
  }, [lastRefresh]);

  // Fetch workflow runs from real API
  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch(`/api/helper/workflows/runs?workspaceId=${workspaceId}`, { 
        cache: "no-store" 
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.runs) {
          setRuns(data.runs.map((r: Record<string, unknown>) => ({
            id: r.id,
            workflowId: r.workflow_id,
            workflowName: (r.workflow as { name?: string })?.name || "Workflow",
            status: r.status,
            triggeredBy: r.triggered_by || "manual",
            startedAt: r.started_at,
            completedAt: r.completed_at,
            duration: r.duration_ms,
            steps: r.steps || [],
            context: r.context,
            error: r.error,
          })));
          setLastRefresh(new Date());
        }
      }
    } catch (error) {
      logger.error("[Workflow History] Failed to fetch:", error);
    }
  }, [workspaceId]);

  // Auto-refresh running workflows every 5 seconds
  useEffect(() => {
    const hasRunning = runs.some((r) => r.status === "running");
    if (!hasRunning) return;

    const interval = setInterval(() => {
      fetchRuns();
    }, 5000);

    return () => clearInterval(interval);
  }, [runs, fetchRuns]);

  // Initial load
  useEffect(() => {
    logger.info(`[Workflow History] Initialized for workspace: ${workspaceSlug} (${workspaceId})`);
    fetchRuns();
  }, [workspaceId, workspaceSlug, fetchRuns]);

  // Calculate stats
  const stats: WorkflowStats = {
    totalRuns: runs.length,
    successRate: runs.length > 0 
      ? Math.round((runs.filter(r => r.status === "completed").length / runs.length) * 100) 
      : 0,
    avgDuration: runs.length > 0
      ? Math.round(runs.filter(r => r.duration).reduce((sum, r) => sum + (r.duration || 0), 0) / runs.filter(r => r.duration).length)
      : 0,
    runningNow: runs.filter(r => r.status === "running").length,
    todayRuns: runs.filter(r => new Date(r.startedAt).toDateString() === new Date().toDateString()).length,
    failedToday: runs.filter(r => 
      r.status === "failed" && 
      new Date(r.startedAt).toDateString() === new Date().toDateString()
    ).length,
  };

  // Filter runs
  const filteredRuns = runs.filter(run => {
    const matchesSearch = !searchQuery || 
      run.workflowName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || run.status === filterStatus;
    const matchesTrigger = filterTrigger === "all" || run.triggeredBy === filterTrigger;
    return matchesSearch && matchesStatus && matchesTrigger;
  });

  const retryRun = useCallback(async (runId: string) => {
    setLoading(true);
    try {
      const run = runs.find(r => r.id === runId);
      if (run) {
        await fetch(`/api/helper/workflows/runs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId,
            workflow_id: run.workflowId,
            triggered_by: "manual",
          }),
        });
        await fetchRuns();
      }
    } catch (error) {
      logger.error("[Workflow] Retry failed:", error);
    } finally {
      setLoading(false);
    }
  }, [runs, workspaceId, fetchRuns]);

  const cancelRun = useCallback(async (runId: string) => {
    setRuns(prev => prev.map(r => 
      r.id === runId ? { ...r, status: "cancelled" as const } : r
    ));
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#050a18]">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent flex items-center gap-2">
              <Activity className="h-6 w-6 text-[#d4af37]" />
              {t("title")}
            </h1>
            <p className="text-[#f5f5dc]/60 mt-1">
              {t("subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Loading & Last refresh indicator */}
            <div className="flex items-center gap-2 text-xs text-[#f5f5dc]/60">
              {loading && <Loader2 className="h-3 w-3 animate-spin text-[#d4af37]" />}
              <Clock className="h-3 w-3" />
              <span>{t("refreshRuns")}: {isMounted && lastRefresh ? lastRefresh.toLocaleTimeString() : "--:--:--"}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-[#f5f5dc]/20 text-[#f5f5dc]/70 hover:text-[#d4af37]"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {t("totalRuns")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("refreshRuns")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#f5f5dc]/20 text-[#f5f5dc] hover:bg-[#f5f5dc]/10"
            >
              <Download className="h-4 w-4 mr-2" />
              {t("exportRuns")}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: t("totalRuns"), value: stats.totalRuns, icon: Boxes, gradient: "from-[#d4af37] to-[#f9d976]" },
            { label: t("successfulRuns"), value: `${stats.successRate}%`, icon: CheckCircle, gradient: "from-emerald-500 to-emerald-400" },
            { label: t("averageDuration"), value: formatDuration(stats.avgDuration), icon: Timer, gradient: "from-cyan-500 to-cyan-400" },
            { label: t("statusRunning"), value: stats.runningNow, icon: RefreshCw, gradient: "from-blue-500 to-blue-400", animated: stats.runningNow > 0 },
            { label: t("filterByWorkflow"), value: stats.todayRuns, icon: Calendar, gradient: "from-purple-500 to-purple-400" },
            { label: t("failedRuns"), value: stats.failedToday, icon: AlertTriangle, gradient: "from-red-500 to-red-400" },
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

        {/* Filters */}
        {isMounted && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#f5f5dc]/40" />
              <Input
                placeholder={t("searchRuns")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#0a1229]/80 border-[#d4af37]/20 text-[#f5f5dc]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-[#d4af37]/20 text-[#f5f5dc]/70 hover:text-[#d4af37]"
            >
              <Filter className="h-4 w-4 mr-2" />
              {t("filterByStatus")}
            </Button>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px] bg-[#0a1229]/80 border-[#d4af37]/20 text-[#f5f5dc]">
                <SelectValue placeholder={t("status")} />
              </SelectTrigger>
              <SelectContent className="bg-[#0a1229] border-[#d4af37]/20">
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="running">{t("statusRunning")}</SelectItem>
                <SelectItem value="completed">{t("statusSuccess")}</SelectItem>
                <SelectItem value="failed">{t("statusFailed")}</SelectItem>
                <SelectItem value="cancelled">{t("statusCancelled")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTrigger} onValueChange={setFilterTrigger}>
              <SelectTrigger className="w-[150px] bg-[#0a1229]/80 border-[#d4af37]/20 text-[#f5f5dc]">
                <SelectValue placeholder={t("trigger")} />
              </SelectTrigger>
              <SelectContent className="bg-[#0a1229] border-[#d4af37]/20">
                <SelectItem value="all">{t("allWorkflows")}</SelectItem>
                <SelectItem value="manual">{t("trigger")}: Manual</SelectItem>
                <SelectItem value="schedule">{t("trigger")}: Schedule</SelectItem>
                <SelectItem value="webhook">{t("trigger")}: Webhook</SelectItem>
                <SelectItem value="event">{t("trigger")}: Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Runs List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredRuns.map((run) => {
              const StatusIcon = getStatusIcon(run.status);
              const TriggerIcon = getTriggerIcon(run.triggeredBy);
              const isExpanded = expandedRun === run.id;
              const completedSteps = run.steps.filter(s => s.status === "completed").length;
              const progress = (completedSteps / run.steps.length) * 100;

              return (
                <motion.div
                  key={run.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl overflow-hidden"
                >
                  {/* Run Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-[#f5f5dc]/5 transition-colors"
                    onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Status Icon */}
                      <div className={cn("p-2 rounded-lg border", getStatusColor(run.status))}>
                        <StatusIcon className={cn("h-5 w-5", run.status === "running" && "animate-spin")} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-[#f5f5dc]">{run.workflowName}</h4>
                          <Badge className={cn("text-xs border", getStatusColor(run.status))}>
                            {run.status}
                          </Badge>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-xs border-[#f5f5dc]/20 text-[#f5f5dc]/60">
                                  <TriggerIcon className="h-3 w-3 mr-1" />
                                  {run.triggeredBy}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#0a1229] border-[#d4af37]/20">
                                {t("trigger")}: {run.triggeredBy}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-[#f5f5dc]/60">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {isMounted ? new Date(run.startedAt).toLocaleString() : "--"}
                          </span>
                          {run.duration && (
                            <span className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {formatDuration(run.duration)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Boxes className="h-3 w-3" />
                            {completedSteps}/{run.steps.length} {t("steps")}
                          </span>
                        </div>
                      </div>

                      {/* Progress (for running) */}
                      {run.status === "running" && (
                        <div className="w-32 hidden sm:block">
                          <Progress value={progress} className="h-2 bg-[#050a18]" />
                          <p className="text-xs text-[#f5f5dc]/40 mt-1 text-center">{Math.round(progress)}%</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {run.status === "failed" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-[#d4af37] hover:bg-[#d4af37]/10"
                                  onClick={(e) => { e.stopPropagation(); retryRun(run.id); }}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#0a1229] border-[#d4af37]/20">{t("retryRun")}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {run.status === "running" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-red-400 hover:bg-red-500/10"
                                  onClick={(e) => { e.stopPropagation(); cancelRun(run.id); }}
                                >
                                  <StopCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#0a1229] border-[#d4af37]/20">{t("cancelRun")}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-[#f5f5dc]/60"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Error Message */}
                    {run.error && (
                      <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <p className="text-sm text-red-400 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                          {run.error}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Steps Detail (Expanded) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-[#d4af37]/10"
                      >
                        <div className="p-4 space-y-3">
                          <h5 className="text-sm font-medium text-[#d4af37] mb-3">{t("steps")}</h5>
                          {run.steps.map((step, idx) => {
                            const StepStatusIcon = getStatusIcon(step.status);
                            const StepTypeIcon = getStepIcon(step.type);
                            return (
                              <div 
                                key={step.id}
                                className={cn(
                                  "flex items-start gap-3 p-3 rounded-lg border transition-all",
                                  step.status === "running" && "bg-blue-500/5 border-blue-500/30",
                                  step.status === "completed" && "bg-emerald-500/5 border-emerald-500/20",
                                  step.status === "failed" && "bg-red-500/5 border-red-500/30",
                                  step.status === "pending" && "bg-[#f5f5dc]/5 border-[#f5f5dc]/10",
                                  step.status === "skipped" && "bg-[#f5f5dc]/5 border-[#f5f5dc]/10 opacity-60",
                                )}
                              >
                                {/* Step Number */}
                                <div className="h-6 w-6 rounded-full bg-[#f5f5dc]/10 flex items-center justify-center text-xs text-[#f5f5dc]/60 flex-shrink-0">
                                  {idx + 1}
                                </div>

                                {/* Step Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <StepTypeIcon className="h-4 w-4 text-[#d4af37]" />
                                    <span className="font-medium text-[#f5f5dc]">{step.name}</span>
                                    <Badge className={cn("text-xs border", getStatusColor(step.status))}>
                                      <StepStatusIcon className={cn("h-3 w-3 mr-1", step.status === "running" && "animate-spin")} />
                                      {step.status}
                                    </Badge>
                                  </div>
                                  {step.duration && (
                                    <p className="text-xs text-[#f5f5dc]/40 mt-1">
                                      {t("duration")}: {formatDuration(step.duration)}
                                    </p>
                                  )}
                                  {step.error && (
                                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      {step.error}
                                    </p>
                                  )}
                                  {step.output && (
                                    <div className="mt-2 p-2 rounded bg-[#050a18]/50 border border-[#f5f5dc]/10">
                                      <p className="text-xs text-[#f5f5dc]/60 font-mono">
                                        {JSON.stringify(step.output, null, 2)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredRuns.length === 0 && (
            <div className="text-center py-12 rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80">
              <Activity className="h-12 w-12 text-[#f5f5dc]/20 mx-auto mb-4" />
              <p className="text-[#f5f5dc]/60">{t("noRuns")}</p>
              <p className="text-sm text-[#f5f5dc]/40 mt-1">{t("noRunsDesc")}</p>
            </div>
          )}
        </div>
      </div>

      {/* View Run Detail Modal */}
      <Dialog open={!!viewingRun} onOpenChange={(open) => !open && setViewingRun(null)}>
        <DialogContent className="bg-[#0a1229] border-[#d4af37]/20 text-[#f5f5dc] max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#d4af37] flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t("runDetails")}
            </DialogTitle>
          </DialogHeader>
          {viewingRun && (
            <div className="space-y-4 py-4">
              {/* Run Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-[#050a18]/50">
                  <p className="text-xs text-[#f5f5dc]/60">{t("workflowName")}</p>
                  <p className="font-medium text-[#f5f5dc] flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#d4af37]" />
                    {viewingRun.workflowName}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#050a18]/50">
                  <p className="text-xs text-[#f5f5dc]/60">{t("status")}</p>
                  <Badge className={cn("text-xs border mt-1", getStatusColor(viewingRun.status))}>
                    {viewingRun.status}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-[#050a18]/50">
                  <p className="text-xs text-[#f5f5dc]/60">{t("startedAt")}</p>
                  <p className="font-medium text-[#f5f5dc]">
                    {isMounted ? new Date(viewingRun.startedAt).toLocaleString() : "--"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#050a18]/50">
                  <p className="text-xs text-[#f5f5dc]/60">{t("duration")}</p>
                  <p className="font-medium text-[#f5f5dc]">
                    {viewingRun.duration ? formatDuration(viewingRun.duration) : t("statusRunning")}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {viewingRun.status === "failed" && (
                  <Button 
                    className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18]"
                    onClick={() => { retryRun(viewingRun.id); setViewingRun(null); }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {t("retryRun")}
                  </Button>
                )}
                <Button variant="outline" className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("close")}
                </Button>
                <Button variant="outline" className="flex-1 border-[#f5f5dc]/20">
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  {t("viewDetails")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
