"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  TrendingUp,
  Zap,
  Star,
  Filter,
  Search,
  Plus,
  RefreshCw,
  Download,
  Upload,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Brain,
  Flame,
  Snowflake,
  ThermometerSun,
  Eye,
  Send,
  Trophy,
  ExternalLink,
  Activity,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface Lead {
  id: string;
  name: string | null;
  phone: string;
  email?: string | null;
  source: string | null;
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  score: number;
  aiScore?: number;
  aiReason?: string;
  tags?: string[];
  created_at: string;
  last_activity_at?: string | null;
  estimated_value?: number;
  probability?: number;
  next_action?: string;
  next_action_date?: string;
  notes?: string;
}

interface LeadStats {
  total: number;
  new: number;
  qualified: number;
  won: number;
  lost: number;
  conversionRate: number;
  avgScore: number;
  pipelineValue: number;
}

interface AIRecommendation {
  id: string;
  type: "hot_lead" | "follow_up" | "nurture" | "risk";
  leadId: string;
  leadName: string;
  message: string;
  action: string;
  priority: "high" | "medium" | "low";
}

interface Props {
  workspaceId: string;
  workspaceSlug: string;
  initialLeads: Lead[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════════════════════ */

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-[#d4af37]";
  if (score >= 40) return "text-yellow-500";
  return "text-red-500";
};

const getScoreGradient = (score: number) => {
  if (score >= 80) return "from-emerald-500 to-emerald-400";
  if (score >= 60) return "from-[#d4af37] to-[#f9d976]";
  if (score >= 40) return "from-yellow-500 to-yellow-400";
  return "from-red-500 to-red-400";
};

const getTemperature = (score: number): { label: string; icon: typeof Flame; color: string } => {
  if (score >= 80) return { label: "Hot", icon: Flame, color: "text-orange-500 bg-orange-500/10 border-orange-500/30" };
  if (score >= 50) return { label: "Warm", icon: ThermometerSun, color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30" };
  return { label: "Cold", icon: Snowflake, color: "text-blue-400 bg-blue-400/10 border-blue-400/30" };
};

const getStatusConfig = (status: Lead["status"]) => {
  switch (status) {
    case "new": return { label: "New", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: Plus };
    case "contacted": return { label: "Contacted", color: "bg-purple-500/10 text-purple-400 border-purple-500/30", icon: Phone };
    case "qualified": return { label: "Qualified", color: "bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30", icon: CheckCircle };
    case "proposal": return { label: "Proposal", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", icon: Mail };
    case "won": return { label: "Won", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: Trophy };
    case "lost": return { label: "Lost", color: "bg-red-500/10 text-red-400 border-red-500/30", icon: XCircle };
    default: return { label: status, color: "bg-[#f5f5dc]/10 text-[#f5f5dc]/60", icon: Activity };
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function LeadsManagerClient({
  workspaceId,
  workspaceSlug,
  initialLeads,
}: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTemperature, setFilterTemperature] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("score");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState("pipeline");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch leads from real API
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/helper/leads?workspaceId=${workspaceId}`, { 
        cache: "no-store" 
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.leads) {
          setLeads(data.leads);
          setLastUpdate(new Date());
        }
      }
    } catch (error) {
      console.error("[Leads] Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Auto-refresh leads every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchLeads, 60000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  // Initial load
  useEffect(() => {
    console.log(`[Leads] Initialized for workspace: ${workspaceSlug} (${workspaceId})`);
  }, [workspaceId, workspaceSlug]);

  // Calculate stats
  const stats: LeadStats = {
    total: leads.length,
    new: leads.filter(l => l.status === "new").length,
    qualified: leads.filter(l => l.status === "qualified").length,
    won: leads.filter(l => l.status === "won").length,
    lost: leads.filter(l => l.status === "lost").length,
    conversionRate: leads.length > 0 ? Math.round((leads.filter(l => l.status === "won").length / leads.length) * 100) : 0,
    avgScore: leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length) : 0,
    pipelineValue: leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0),
  };

  // AI Analysis - Real API
  const runAIAnalysis = useCallback(async () => {
    setAnalyzing(true);
    try {
      // Score each lead using real AI API
      const scoredLeads = await Promise.all(
        leads.slice(0, 10).map(async (lead) => {
          try {
            const res = await fetch(`/api/helper/leads/score`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                lead_id: lead.id,
                workspaceId 
              }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.ok && data.lead) {
                return {
                  ...lead,
                  ...data.lead,
                  aiScore: data.lead.score,
                  aiReason: data.analysis?.summary || data.lead.ai_summary,
                };
              }
            }
            return lead;
          } catch {
            return lead;
          }
        })
      );

      // Update leads with scored ones
      setLeads(prev => {
        const updatedMap = new Map(scoredLeads.map(l => [l.id, l]));
        return prev.map(lead => updatedMap.get(lead.id) || lead);
      });

      // Generate recommendations from scored leads
      const hotLeads = scoredLeads.filter(l => l.score >= 75);
      const warmLeads = scoredLeads.filter(l => l.score >= 50 && l.score < 75);
      const coldLeads = scoredLeads.filter(l => l.score < 50);

      const newRecs: AIRecommendation[] = [];
      
      if (hotLeads[0]) {
        newRecs.push({
          id: "hot-1",
          type: "hot_lead",
          leadId: hotLeads[0].id,
          leadName: hotLeads[0].name || "Lead",
          message: hotLeads[0].aiReason || "High conversion probability detected.",
          action: "Schedule a demo call today",
          priority: "high",
        });
      }
      
      if (warmLeads[0]) {
        newRecs.push({
          id: "warm-1",
          type: "follow_up",
          leadId: warmLeads[0].id,
          leadName: warmLeads[0].name || "Lead",
          message: warmLeads[0].aiReason || "Lead needs follow-up attention.",
          action: "Send a personalized follow-up",
          priority: "high",
        });
      }
      
      if (coldLeads[0]) {
        newRecs.push({
          id: "cold-1",
          type: "nurture",
          leadId: coldLeads[0].id,
          leadName: coldLeads[0].name || "Lead",
          message: coldLeads[0].aiReason || "Lead needs nurturing.",
          action: "Add to email drip campaign",
          priority: "medium",
        });
      }

      setRecommendations(newRecs);
    } catch (error) {
      console.error("[Leads] AI analysis failed:", error);
    } finally {
      setAnalyzing(false);
    }
  }, [leads, workspaceId]);

  // Note: Auto-analysis disabled - user triggers via button click

  // Filter and sort leads
  const filteredLeads = leads
    .filter(lead => {
      const matchesSearch = !searchQuery ||
        lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery);
      const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
      const temp = getTemperature(lead.score);
      const matchesTemp = filterTemperature === "all" || temp.label.toLowerCase() === filterTemperature;
      return matchesSearch && matchesStatus && matchesTemp;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "score": return b.score - a.score;
        case "value": return (b.estimated_value || 0) - (a.estimated_value || 0);
        case "recent": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: return 0;
      }
    });

  const getRecommendationIcon = (type: AIRecommendation["type"]) => {
    switch (type) {
      case "hot_lead": return Flame;
      case "follow_up": return Clock;
      case "nurture": return Sparkles;
      case "risk": return AlertTriangle;
    }
  };

  const getRecommendationColor = (type: AIRecommendation["type"]) => {
    switch (type) {
      case "hot_lead": return "text-orange-500 bg-orange-500/10 border-orange-500/30";
      case "follow_up": return "text-blue-400 bg-blue-400/10 border-blue-400/30";
      case "nurture": return "text-purple-400 bg-purple-400/10 border-purple-400/30";
      case "risk": return "text-red-500 bg-red-500/10 border-red-500/30";
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-[#050a18] via-[#0a1229] to-[#050a18]">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f9d976] bg-clip-text text-transparent flex items-center gap-2">
              <Target className="h-6 w-6 text-[#d4af37]" />
              AI Lead Scoring
            </h1>
            <p className="text-[#f5f5dc]/60 mt-1">
              Intelligent lead qualification and conversion tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Loading & Update indicator */}
            <div className="flex items-center gap-2 text-xs text-[#f5f5dc]/60">
              {loading && <Loader2 className="h-3 w-3 animate-spin text-[#d4af37]" />}
              <Calendar className="h-3 w-3" />
              <span>Updated: {lastUpdate.toLocaleTimeString()}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runAIAnalysis}
              disabled={analyzing}
              className="border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/10"
            >
              {analyzing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              AI Analyze
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#f5f5dc]/20 text-[#f5f5dc] hover:bg-[#f5f5dc]/10"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#f5f5dc]/20 text-[#f5f5dc] hover:bg-[#f5f5dc]/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18] hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Leads", value: stats.total, icon: Target, gradient: "from-[#d4af37] to-[#f9d976]" },
            { label: "New", value: stats.new, icon: Plus, gradient: "from-blue-500 to-blue-400" },
            { label: "Qualified", value: stats.qualified, icon: CheckCircle, gradient: "from-purple-500 to-purple-400" },
            { label: "Won", value: stats.won, icon: Trophy, gradient: "from-emerald-500 to-emerald-400" },
            { label: "Conversion", value: `${stats.conversionRate}%`, icon: TrendingUp, gradient: "from-cyan-500 to-cyan-400" },
            { label: "Avg Score", value: stats.avgScore, icon: Star, gradient: "from-orange-500 to-orange-400" },
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
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className="h-4 w-4 text-[#050a18]" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#0a1229]/80 border border-[#d4af37]/20 p-1">
            <TabsTrigger value="pipeline" className="data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-[#d4af37]">
              <Activity className="h-4 w-4 mr-2" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-[#d4af37]">
              <Brain className="h-4 w-4 mr-2" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-[#d4af37]/20 data-[state=active]:text-[#d4af37]">
              <Trophy className="h-4 w-4 mr-2" />
              Top Leads
            </TabsTrigger>
          </TabsList>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="mt-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#f5f5dc]/40" />
                <Input
                  placeholder="Search leads..."
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
                Advanced
              </Button>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px] bg-[#0a1229]/80 border-[#d4af37]/20 text-[#f5f5dc]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1229] border-[#d4af37]/20">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTemperature} onValueChange={setFilterTemperature}>
                <SelectTrigger className="w-[130px] bg-[#0a1229]/80 border-[#d4af37]/20 text-[#f5f5dc]">
                  <SelectValue placeholder="Temperature" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1229] border-[#d4af37]/20">
                  <SelectItem value="all">All Temps</SelectItem>
                  <SelectItem value="hot">🔥 Hot</SelectItem>
                  <SelectItem value="warm">🌡️ Warm</SelectItem>
                  <SelectItem value="cold">❄️ Cold</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-[#0a1229]/80 border-[#d4af37]/20 text-[#f5f5dc]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1229] border-[#d4af37]/20">
                  <SelectItem value="score">Score (High)</SelectItem>
                  <SelectItem value="value">Value (High)</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lead List */}
            <div className="space-y-3">
              {filteredLeads.map((lead, idx) => {
                const temp = getTemperature(lead.score);
                const TempIcon = temp.icon;
                const statusConfig = getStatusConfig(lead.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedLead(lead)}
                    className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl p-4 hover:border-[#d4af37]/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {/* Score Circle */}
                      <div className="relative">
                        <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${getScoreGradient(lead.score)} p-0.5`}>
                          <div className="h-full w-full rounded-full bg-[#0a1229] flex items-center justify-center">
                            <span className={`text-lg font-bold ${getScoreColor(lead.score)}`}>
                              {lead.score}
                            </span>
                          </div>
                        </div>
                        {lead.aiScore && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#d4af37] flex items-center justify-center">
                                  <Sparkles className="h-3 w-3 text-[#050a18]" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#0a1229] border-[#d4af37]/20">
                                <p>AI Score: {lead.aiScore}</p>
                                <p className="text-xs text-[#f5f5dc]/60">{lead.aiReason}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>

                      {/* Lead Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[#f5f5dc] truncate">
                            {lead.name || "Unknown Lead"}
                          </h4>
                          <Badge className={cn("text-xs border", statusConfig.color)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          <Badge className={cn("text-xs border", temp.color)}>
                            <TempIcon className="h-3 w-3 mr-1" />
                            {temp.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-[#f5f5dc]/60">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </span>
                          {lead.source && (
                            <span className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {lead.source}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(lead.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Value & Probability */}
                      {lead.estimated_value && (
                        <div className="text-right hidden sm:block">
                          <p className="text-lg font-bold text-[#f5f5dc]">
                            ${lead.estimated_value.toLocaleString()}
                          </p>
                          {lead.probability && (
                            <p className="text-xs text-[#f5f5dc]/60">
                              {lead.probability}% probability
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-[#f5f5dc]/60 hover:text-[#d4af37]">
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-[#f5f5dc]/60 hover:text-[#d4af37]">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-[#f5f5dc]/60 hover:text-[#f5f5dc]">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* AI Reason (if available) */}
                    {lead.aiReason && (
                      <div className="mt-3 pt-3 border-t border-[#f5f5dc]/10">
                        <p className="text-xs text-[#f5f5dc]/60 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-[#d4af37]" />
                          AI: {lead.aiReason}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {filteredLeads.length === 0 && (
                <div className="text-center py-12 rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80">
                  <Target className="h-12 w-12 text-[#f5f5dc]/20 mx-auto mb-4" />
                  <p className="text-[#f5f5dc]/60">No leads found matching your filters</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai-insights" className="mt-6 space-y-6">
            <AnimatePresence>
              {analyzing ? (
                <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80">
                  <RefreshCw className="h-8 w-8 text-[#d4af37] animate-spin mb-4" />
                  <p className="text-[#f5f5dc]/60">Analyzing your leads with AI...</p>
                  <p className="text-sm text-[#f5f5dc]/40 mt-2">This may take a few seconds</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {recommendations.map((rec) => {
                    const Icon = getRecommendationIcon(rec.type);
                    return (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "rounded-xl border p-5",
                          getRecommendationColor(rec.type)
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-[#0a1229]/50">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-[#f5f5dc]">{rec.leadName}</h4>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  rec.priority === "high" ? "border-red-500/50 text-red-400" :
                                  rec.priority === "medium" ? "border-yellow-500/50 text-yellow-400" :
                                  "border-green-500/50 text-green-400"
                                )}
                              >
                                {rec.priority} priority
                              </Badge>
                            </div>
                            <p className="text-sm text-[#f5f5dc]/70 mb-4">{rec.message}</p>
                            <Button
                              size="sm"
                              className="bg-[#d4af37]/20 text-[#d4af37] hover:bg-[#d4af37]/30 border border-[#d4af37]/40"
                            >
                              {rec.action}
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-6">
            <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl overflow-hidden">
              <div className="p-4 border-b border-[#d4af37]/10">
                <h3 className="font-semibold text-[#d4af37] flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Top Performing Leads
                </h3>
              </div>
              <div className="divide-y divide-[#d4af37]/10">
                {leads
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 10)
                  .map((lead, idx) => (
                    <div key={lead.id} className="flex items-center gap-4 p-4 hover:bg-[#f5f5dc]/5">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm",
                        idx === 0 ? "bg-gradient-to-br from-[#d4af37] to-[#f9d976] text-[#050a18]" :
                        idx === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-[#050a18]" :
                        idx === 2 ? "bg-gradient-to-br from-orange-400 to-orange-500 text-[#050a18]" :
                        "bg-[#f5f5dc]/10 text-[#f5f5dc]/60"
                      )}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#f5f5dc]">{lead.name || "Unknown"}</p>
                        <p className="text-sm text-[#f5f5dc]/60">{lead.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${getScoreColor(lead.score)}`}>{lead.score}</p>
                        <p className="text-xs text-[#f5f5dc]/40">score</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Lead Modal */}
      {/* Add Lead Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-[#0a1229] border-[#d4af37]/20 text-[#f5f5dc]">
          <DialogHeader>
            <DialogTitle className="text-[#d4af37]">Add New Lead</DialogTitle>
            <DialogDescription className="text-[#f5f5dc]/60">
              Add a new lead to your pipeline. AI will automatically score it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="Lead name" className="bg-[#050a18] border-[#d4af37]/20" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input placeholder="+62..." className="bg-[#050a18] border-[#d4af37]/20" />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select>
                <SelectTrigger className="bg-[#050a18] border-[#d4af37]/20">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1229] border-[#d4af37]/20">
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." className="bg-[#050a18] border-[#d4af37]/20" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="border-[#f5f5dc]/20">
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18]">
              <Sparkles className="h-4 w-4 mr-2" />
              Add & Score with AI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Modal */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="bg-[#0a1229] border-[#d4af37]/20 text-[#f5f5dc] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#d4af37] flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Lead Details
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 py-4">
              {/* Score Display */}
              <div className="flex items-center justify-center">
                <div className={`h-24 w-24 rounded-full bg-gradient-to-br ${getScoreGradient(selectedLead.score)} p-1`}>
                  <div className="h-full w-full rounded-full bg-[#0a1229] flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${getScoreColor(selectedLead.score)}`}>
                      {selectedLead.score}
                    </span>
                    <span className="text-xs text-[#f5f5dc]/60">Score</span>
                  </div>
                </div>
              </div>

              {/* Lead Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#050a18]/50">
                  <Zap className="h-4 w-4 text-[#d4af37]" />
                  <div>
                    <p className="text-sm text-[#f5f5dc]/60">Name</p>
                    <p className="font-medium text-[#f5f5dc]">{selectedLead.name || "Unknown"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#050a18]/50">
                  <Phone className="h-4 w-4 text-[#d4af37]" />
                  <div>
                    <p className="text-sm text-[#f5f5dc]/60">Phone</p>
                    <p className="font-medium text-[#f5f5dc]">{selectedLead.phone}</p>
                  </div>
                </div>
                {selectedLead.email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#050a18]/50">
                    <Mail className="h-4 w-4 text-[#d4af37]" />
                    <div>
                      <p className="text-sm text-[#f5f5dc]/60">Email</p>
                      <p className="font-medium text-[#f5f5dc]">{selectedLead.email}</p>
                    </div>
                  </div>
                )}
                {selectedLead.aiReason && (
                  <div className="p-3 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/20">
                    <p className="text-sm text-[#d4af37] flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Analysis
                    </p>
                    <p className="text-sm text-[#f5f5dc]/80 mt-1">{selectedLead.aiReason}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#f9d976] text-[#050a18]">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" className="flex-1 border-[#f5f5dc]/20">
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  More Actions
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
