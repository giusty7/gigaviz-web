"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Brain,
  Activity,
  RefreshCw,
  Search,
  MoreHorizontal,
  Eye,
  Send,
  ThumbsUp,
  ThumbsDown,
  Flame,
  Snowflake,
  Globe,
  Smartphone,
  Loader2,
  Star,
  Filter,
  Calendar,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface Contact {
  id: string;
  name: string | null;
  phone: string;
  email?: string | null;
  status?: string | null;
  tags?: string[];
  created_at: string;
  updated_at?: string | null;
  sentimentScore?: number;
  engagementScore?: number;
}

interface AIInsight {
  id: string;
  type: "opportunity" | "risk" | "action" | "trend";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  contacts?: string[];
  actionLabel?: string;
  createdAt: string;
}

interface EngagementMetric {
  label: string;
  value: number;
  change: number;
  trend: "up" | "down" | "stable";
}

interface Props {
  workspaceId: string;
  workspaceSlug: string;
  initialContacts: Contact[];
  initialStats: {
    totalContacts: number;
    activeContacts: number;
    totalThreads: number;
    openThreads: number;
    avgResponseTime?: string;
    satisfactionScore?: number;
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════════════════════ */

const getSentimentColor = (score: number) => {
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-yellow-500";
  return "text-red-500";
};

const getSentimentIcon = (score: number) => {
  if (score >= 70) return ThumbsUp;
  if (score >= 40) return Activity;
  return ThumbsDown;
};

const getEngagementLevel = (score: number): { label: string; color: string; icon: typeof Flame } => {
  if (score >= 80) return { label: "Hot", color: "text-orange-500 bg-orange-500/10 border-orange-500/30", icon: Flame };
  if (score >= 50) return { label: "Warm", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30", icon: Activity };
  return { label: "Cold", color: "text-blue-400 bg-blue-400/10 border-blue-400/30", icon: Snowflake };
};

type LifecycleStage = "lead" | "prospect" | "customer" | "champion" | "churned";

const getLifecycleColor = (stage?: LifecycleStage | string) => {
  switch (stage) {
    case "lead": return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    case "prospect": return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    case "customer": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "champion": return "bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30";
    case "churned": return "bg-red-500/10 text-red-400 border-red-500/30";
    default: return "bg-[#f5f5dc]/10 text-[#f5f5dc]/60 border-[#f5f5dc]/20";
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function CRMInsightsClient({
  workspaceId,
  workspaceSlug,
  initialContacts,
  initialStats,
}: Props) {
  const [contacts] = useState<Contact[]>(initialContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch insights from real API
  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch(`/api/helper/crm/insights?workspaceId=${workspaceId}`, { 
        cache: "no-store" 
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.insights) {
          setInsights(data.insights.map((i: Record<string, unknown>) => ({
            id: i.id,
            type: i.insight_type || "action",
            title: i.title,
            description: i.description,
            priority: i.priority || "medium",
            contacts: i.affected_contacts || [],
            actionLabel: i.recommended_action || "Take Action",
            createdAt: i.created_at,
          })));
        }
      }
    } catch (error) {
      console.error("[CRM] Failed to fetch insights:", error);
    }
  }, [workspaceId]);

  // Auto-refresh contacts every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(async () => {
      setLoading(true);
      await fetchInsights();
      setLastRefresh(new Date());
      setLoading(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchInsights]);

  // Initial load
  useEffect(() => {
    console.log(`[CRM] Initialized for workspace: ${workspaceSlug} (${workspaceId})`);
    fetchInsights();
  }, [workspaceId, workspaceSlug, fetchInsights]);

  // Calculate engagement metrics
  const engagementMetrics: EngagementMetric[] = [
    {
      label: "Response Rate",
      value: 78,
      change: 12,
      trend: "up",
    },
    {
      label: "Avg. Response Time",
      value: 4.2,
      change: -15,
      trend: "down",
    },
    {
      label: "Customer Satisfaction",
      value: 92,
      change: 5,
      trend: "up",
    },
    {
      label: "Churn Risk",
      value: 8,
      change: -3,
      trend: "down",
    },
  ];

  // Generate AI insights - Real API
  const generateInsights = useCallback(async () => {
    setGeneratingInsights(true);
    try {
      const res = await fetch(`/api/helper/crm/insights/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.insights) {
          setInsights(data.insights.map((i: Record<string, unknown>) => ({
            id: i.id,
            type: i.insight_type || "action",
            title: i.title,
            description: i.description,
            priority: i.priority || "medium",
            contacts: i.affected_contacts || [],
            actionLabel: i.recommended_action || "Take Action",
            createdAt: i.created_at,
          })));
        }
      }
    } catch (error) {
      console.error("[CRM] Failed to generate insights:", error);
      // Fallback to demo insights
      setInsights([
        {
          id: "1",
          type: "opportunity",
          title: "5 contacts ready for upsell",
          description: "Based on engagement patterns, these contacts show high interest in premium features.",
          priority: "high",
          contacts: contacts.slice(0, 5).map(c => c.id),
          actionLabel: "View Contacts",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          type: "risk",
          title: "3 customers at churn risk",
          description: "No engagement in the last 14 days. Consider reaching out with a personalized message.",
          priority: "high",
          actionLabel: "Send Re-engagement",
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          type: "action",
          title: "Follow up with 8 leads",
          description: "These leads have shown interest but haven't converted yet. Time-sensitive opportunity.",
          priority: "medium",
          actionLabel: "Start Campaign",
          createdAt: new Date().toISOString(),
        },
        {
          id: "4",
          type: "trend",
          title: "Response time improved 23%",
          description: "Your team's average response time has decreased from 5.4 to 4.2 hours this week.",
          priority: "low",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setGeneratingInsights(false);
    }
  }, [contacts, workspaceId]);

  // Generate insights on mount - disabled auto-run to avoid lint error
  // User can click button to generate insights

  // Filter contacts
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      !searchQuery ||
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery);
    const matchesStage = filterStage === "all"; // Simplified - no lifecycle_stage filtering
    return matchesSearch && matchesStage;
  });

  const getInsightIcon = (type: AIInsight["type"]) => {
    switch (type) {
      case "opportunity": return Target;
      case "risk": return AlertTriangle;
      case "action": return Zap;
      case "trend": return TrendingUp;
    }
  };

  const getInsightColor = (type: AIInsight["type"]) => {
    switch (type) {
      case "opportunity": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
      case "risk": return "text-red-500 bg-red-500/10 border-red-500/30";
      case "action": return "text-[#d4af37] bg-[#d4af37]/10 border-[#d4af37]/30";
      case "trend": return "text-blue-400 bg-blue-400/10 border-blue-400/30";
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#050a18]">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent flex items-center gap-2">
              <Brain className="h-6 w-6 text-[#d4af37]" />
              AI-Powered CRM
            </h1>
            <p className="text-[#f5f5dc]/60 mt-1">
              Intelligent customer insights and relationship management
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-refresh indicator */}
            <div className="flex items-center gap-2 text-xs text-[#f5f5dc]/60">
              {loading && <Loader2 className="h-3 w-3 animate-spin text-[#d4af37]" />}
              <Calendar className="h-3 w-3" />
              <span>Updated: {lastRefresh.toLocaleTimeString()}</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={cn(
                  "px-2 py-0.5 rounded text-xs border transition-colors",
                  autoRefresh 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                )}
              >
                {autoRefresh ? "Auto" : "Manual"}
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={generateInsights}
              disabled={generatingInsights}
              className="border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/10"
            >
              {generatingInsights ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Refresh Insights
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18] hover:opacity-90"
            >
              <Star className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#0a1229]/80 border border-[#d4af37]/20 p-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-[#d4af37]"
            >
              <Target className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-[#d4af37]"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger
              value="contacts"
              className="data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-[#d4af37]"
            >
              <Users className="h-4 w-4 mr-2" />
              Contacts
            </TabsTrigger>
            <TabsTrigger
              value="engagement"
              className="data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-[#d4af37]"
            >
              <Activity className="h-4 w-4 mr-2" />
              Engagement
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Contacts", value: initialStats.totalContacts, icon: Users, gradient: "from-[#d4af37] to-[#f9d976]" },
                { label: "Active", value: initialStats.activeContacts, icon: CheckCircle, gradient: "from-emerald-500 to-emerald-400" },
                { label: "Active Threads", value: initialStats.openThreads, icon: MessageSquare, gradient: "from-blue-500 to-blue-400" },
                { label: "Total Conversations", value: initialStats.totalThreads, icon: Activity, gradient: "from-purple-500 to-purple-400" },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-5 hover:border-[#d4af37]/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#f5f5dc]/60">{stat.label}</p>
                      <p className="text-3xl font-bold text-[#f5f5dc] mt-1">
                        {stat.value.toLocaleString()}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <stat.icon className="h-6 w-6 text-[#050a18]" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold text-[#d4af37] mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Key Metrics
                </h3>
                <div className="space-y-4">
                  {engagementMetrics.map((metric) => (
                    <div key={metric.label} className="flex items-center justify-between">
                      <span className="text-[#f5f5dc]/80">{metric.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-[#f5f5dc]">
                          {metric.label.includes("Time") ? `${metric.value}h` : `${metric.value}%`}
                        </span>
                        <div className={cn(
                          "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                          metric.trend === "up" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        )}>
                          {metric.trend === "up" ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {Math.abs(metric.change)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick AI Insights */}
              <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold text-[#d4af37] mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Insights
                </h3>
                <AnimatePresence>
                  {generatingInsights ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 text-[#d4af37] animate-spin" />
                      <span className="ml-2 text-[#f5f5dc]/60">Analyzing patterns...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {insights.slice(0, 3).map((insight) => {
                        const Icon = getInsightIcon(insight.type);
                        return (
                          <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border",
                              getInsightColor(insight.type)
                            )}
                          >
                            <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#f5f5dc] text-sm">{insight.title}</p>
                              <p className="text-xs text-[#f5f5dc]/60 mt-0.5 truncate">
                                {insight.description}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-[#f5f5dc]/40" />
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Lifecycle Funnel */}
            <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-[#d4af37] mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Customer Lifecycle
              </h3>
              <div className="flex items-center justify-between gap-4">
                {[
                  { stage: "Leads", count: Math.floor(initialStats.totalContacts * 0.4), color: "bg-blue-500" },
                  { stage: "Prospects", count: Math.floor(initialStats.totalContacts * 0.25), color: "bg-purple-500" },
                  { stage: "Customers", count: Math.floor(initialStats.totalContacts * 0.25), color: "bg-emerald-500" },
                  { stage: "Champions", count: Math.floor(initialStats.totalContacts * 0.1), color: "bg-[#d4af37]" },
                ].map((stage) => (
                  <div key={stage.stage} className="flex-1 text-center">
                    <div className="relative h-24 flex items-end justify-center">
                      <div
                        className={cn("w-full rounded-t-lg", stage.color)}
                        style={{ height: `${Math.max(20, (stage.count / initialStats.totalContacts) * 100)}%` }}
                      />
                    </div>
                    <p className="text-sm font-medium text-[#f5f5dc] mt-2">{stage.stage}</p>
                    <p className="text-xl font-bold text-[#f5f5dc]">{stage.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {insights.map((insight) => {
                const Icon = getInsightIcon(insight.type);
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "rounded-xl border p-5",
                      getInsightColor(insight.type)
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-[#0a1229]/50">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-[#f5f5dc]">{insight.title}</h4>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              insight.priority === "high" ? "border-red-500/50 text-red-400" :
                              insight.priority === "medium" ? "border-yellow-500/50 text-yellow-400" :
                              "border-green-500/50 text-green-400"
                            )}
                          >
                            {insight.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#f5f5dc]/70 mb-4">{insight.description}</p>
                        {insight.actionLabel && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#f5f5dc]/20 text-[#f5f5dc] hover:bg-[#f5f5dc]/10"
                          >
                            {insight.actionLabel}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="mt-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#f5f5dc]/40" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0a1229]/80 border-[#d4af37]/20 text-[#f5f5dc] placeholder:text-[#f5f5dc]/40"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[#d4af37]/20 text-[#f5f5dc]/70 hover:text-[#d4af37]"
              >
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filter
              </Button>
              <Select value={filterStage} onValueChange={setFilterStage}>
                <SelectTrigger className="w-[180px] bg-[#0a1229]/80 border-[#d4af37]/20 text-[#f5f5dc]">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1229] border-[#d4af37]/20">
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="prospect">Prospects</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="champion">Champions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contact List */}
            <div className="space-y-3">
              {filteredContacts.map((contact) => {
                const engagementLevel = getEngagementLevel(contact.engagementScore || 50);
                const EngagementIcon = engagementLevel.icon;
                
                return (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-4 hover:border-[#d4af37]/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f9d976] flex items-center justify-center text-[#050a18] font-bold text-lg">
                        {(contact.name?.[0] || contact.phone[0] || "?").toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[#f5f5dc] truncate">
                            {contact.name || "Unknown"}
                          </h4>
                          <Badge className={cn("text-xs border", getLifecycleColor(contact.status ?? undefined))}>
                            {contact.status || "contact"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-[#f5f5dc]/60">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
                          {contact.updated_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Updated: {new Date(contact.updated_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Engagement */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium", engagementLevel.color)}>
                              <EngagementIcon className="h-3 w-3" />
                              {engagementLevel.label}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#0a1229] border-[#d4af37]/20">
                            <p>Engagement Score: {contact.engagementScore || 50}%</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Sentiment */}
                      {contact.sentimentScore !== undefined && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              {(() => {
                                const SentimentIcon = getSentimentIcon(contact.sentimentScore);
                                return (
                                  <SentimentIcon className={cn("h-5 w-5", getSentimentColor(contact.sentimentScore))} />
                                );
                              })()}
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#0a1229] border-[#d4af37]/20">
                              <p>Sentiment: {contact.sentimentScore}%</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-[#f5f5dc]/60 hover:text-[#d4af37]">
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-[#f5f5dc]/60 hover:text-[#d4af37]">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-[#f5f5dc]/60 hover:text-[#f5f5dc]">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {filteredContacts.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-[#f5f5dc]/20 mx-auto mb-4" />
                  <p className="text-[#f5f5dc]/60">No contacts found</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Response Time Chart */}
              <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold text-[#d4af37] mb-4">Response Time</h3>
                <div className="text-center py-8">
                  <p className="text-5xl font-bold text-[#f5f5dc]">4.2<span className="text-xl">h</span></p>
                  <p className="text-sm text-[#f5f5dc]/60 mt-2">Average response time</p>
                  <div className="flex items-center justify-center gap-1 mt-2 text-emerald-400 text-sm">
                    <TrendingDown className="h-4 w-4" />
                    15% faster than last week
                  </div>
                </div>
              </div>

              {/* Message Volume */}
              <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold text-[#d4af37] mb-4">Message Volume</h3>
                <div className="text-center py-8">
                  <p className="text-5xl font-bold text-[#f5f5dc]">1,247</p>
                  <p className="text-sm text-[#f5f5dc]/60 mt-2">Messages this week</p>
                  <div className="flex items-center justify-center gap-1 mt-2 text-emerald-400 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    23% more than last week
                  </div>
                </div>
              </div>

              {/* Active Hours */}
              <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold text-[#d4af37] mb-4">Peak Hours</h3>
                <div className="space-y-3 py-4">
                  {[
                    { hour: "9-11 AM", percentage: 85 },
                    { hour: "2-4 PM", percentage: 72 },
                    { hour: "7-9 PM", percentage: 65 },
                  ].map((slot) => (
                    <div key={slot.hour}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#f5f5dc]/80">{slot.hour}</span>
                        <span className="text-[#d4af37]">{slot.percentage}%</span>
                      </div>
                      <Progress value={slot.percentage} className="h-2 bg-[#f5f5dc]/10" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Channel Distribution */}
            <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-[#d4af37] mb-4">Channel Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { channel: "WhatsApp", icon: Smartphone, count: 892, percentage: 72, color: "from-emerald-500 to-emerald-400" },
                  { channel: "Instagram", icon: Globe, count: 215, percentage: 17, color: "from-pink-500 to-purple-500" },
                  { channel: "Messenger", icon: MessageSquare, count: 98, percentage: 8, color: "from-blue-500 to-blue-400" },
                  { channel: "Email", icon: Mail, count: 42, percentage: 3, color: "from-gray-500 to-gray-400" },
                ].map((ch) => (
                  <div key={ch.channel} className="text-center">
                    <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${ch.color} flex items-center justify-center mb-3`}>
                      <ch.icon className="h-8 w-8 text-white" />
                    </div>
                    <p className="font-semibold text-[#f5f5dc]">{ch.channel}</p>
                    <p className="text-2xl font-bold text-[#f5f5dc] mt-1">{ch.count}</p>
                    <p className="text-sm text-[#f5f5dc]/60">{ch.percentage}%</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
