"use client";
import { logger } from "@/lib/logging";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  MessageSquare,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TYPES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

interface AgentProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface AgentStatus {
  id: string;
  workspace_id: string;
  user_id: string;
  status: "online" | "away" | "busy" | "offline";
  current_thread_id: string | null;
  is_typing: boolean;
  last_activity: string;
  profiles: AgentProfile;
}

interface AgentStatusPanelProps {
  workspaceId: string;
  currentUserId?: string;
  onAgentClick?: (agent: AgentStatus) => void;
  compact?: boolean;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   STATUS COLORS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const statusConfig = {
  online: {
    color: "bg-emerald-500",
    pulse: true,
    label: "Online",
  },
  away: {
    color: "bg-yellow-500",
    pulse: false,
    label: "Away",
  },
  busy: {
    color: "bg-red-500",
    pulse: false,
    label: "Busy",
  },
  offline: {
    color: "bg-gray-500",
    pulse: false,
    label: "Offline",
  },
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN COMPONENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function AgentStatusPanel({
  workspaceId,
  currentUserId,
  onAgentClick,
  compact = false,
}: AgentStatusPanelProps) {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [summary, setSummary] = useState({ online: 0, away: 0, busy: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [myStatus, setMyStatus] = useState<"online" | "away" | "busy" | "offline">("online");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Update `now` periodically for time calculations
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch(`/api/meta/agents/status?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error("Failed to fetch agents");
      const data = await res.json();
      setAgents(data.agents || []);
      setSummary(data.summary || { online: 0, away: 0, busy: 0, total: 0 });
      
      // Set current user's status from response
      if (currentUserId) {
        const myAgent = (data.agents || []).find((a: AgentStatus) => a.user_id === currentUserId);
        if (myAgent) setMyStatus(myAgent.status);
      }
    } catch (error) {
      logger.error("Error fetching agent status:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, currentUserId]);

  useEffect(() => {
    fetchAgents();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchAgents, 30000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  const updateMyStatus = async (newStatus: "online" | "away" | "busy" | "offline") => {
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/meta/agents/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          status: newStatus,
        }),
      });
      
      if (res.ok) {
        setMyStatus(newStatus);
        fetchAgents(); // Refresh to see updated team stats
      } else {
        logger.error("Failed to update status");
      }
    } catch (error) {
      logger.error("Error updating status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const onlineAgents = agents.filter((a) => a.status === "online");
  const busyAgents = agents.filter((a) => a.status === "busy");
  const awayAgents = agents.filter((a) => a.status === "away");

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 px-4 py-3">
        <div className="h-4 w-4 animate-pulse rounded-full bg-[#f5f5dc]/10" />
        <div className="h-3 w-16 animate-pulse rounded bg-[#f5f5dc]/10" />
      </div>
    );
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-[#f5f5dc]/60 hover:text-[#f5f5dc]"
            >
              <div className="relative">
                <Users className="h-4 w-4" />
                {summary.online > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">
                    {summary.online}
                  </span>
                )}
              </div>
              <span className="text-xs">{summary.total} agents</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="border-[#d4af37]/20 bg-[#0a1229]">
            <div className="space-y-1 text-xs">
              <p className="text-emerald-400">{summary.online} online</p>
              <p className="text-yellow-400">{summary.away} away</p>
              <p className="text-red-400">{summary.busy} busy</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="rounded-xl border border-[#d4af37]/20 bg-[#0a1229]/80 backdrop-blur-xl">
      {/* Header with Personal Status */}
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        {/* Left: Personal Status Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#f5f5dc]/50">Your Status:</span>
          <div className="flex gap-1">
            {(["online", "away", "busy", "offline"] as const).map((status) => (
              <button
                key={status}
                onClick={() => updateMyStatus(status)}
                disabled={updatingStatus}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all",
                  myStatus === status
                    ? "bg-[#d4af37]/20 text-[#d4af37] ring-1 ring-[#d4af37]/40"
                    : "bg-[#f5f5dc]/5 text-[#f5f5dc]/60 hover:bg-[#f5f5dc]/10 hover:text-[#f5f5dc]"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", statusConfig[status].color)} />
                {statusConfig[status].label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Team Status Summary */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-[#f5f5dc]/5"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#d4af37]" />
            <span className="text-xs text-[#f5f5dc]/50">
              {summary.online} online Â· {summary.total} total
            </span>
          </div>
          {/* Status dots preview */}
          <div className="flex -space-x-1">
            {onlineAgents.slice(0, 3).map((agent) => (
              <Avatar key={agent.id} className="h-6 w-6 border-2 border-[#0a1229]">
                <AvatarImage src={agent.profiles?.avatar_url || undefined} />
                <AvatarFallback className="bg-[#d4af37]/20 text-[10px] text-[#d4af37]">
                  {(agent.profiles?.display_name || "A")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {onlineAgents.length > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0a1229] bg-[#d4af37]/20 text-[10px] font-medium text-[#d4af37]">
                +{onlineAgents.length - 3}
              </div>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-[#f5f5dc]/40" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#f5f5dc]/40" />
          )}
        </button>
      </div>

      {/* Expanded List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#f5f5dc]/10"
          >
            <div className="max-h-64 overflow-y-auto p-2">
              {/* Online Agents */}
              {onlineAgents.length > 0 && (
                <AgentGroup
                  title="Online"
                  agents={onlineAgents}
                  currentUserId={currentUserId}
                  onAgentClick={onAgentClick}
                  now={now}
                />
              )}

              {/* Busy Agents */}
              {busyAgents.length > 0 && (
                <AgentGroup
                  title="Busy"
                  agents={busyAgents}
                  currentUserId={currentUserId}
                  onAgentClick={onAgentClick}
                  now={now}
                />
              )}

              {/* Away Agents */}
              {awayAgents.length > 0 && (
                <AgentGroup
                  title="Away"
                  agents={awayAgents}
                  currentUserId={currentUserId}
                  onAgentClick={onAgentClick}
                  now={now}
                />
              )}

              {agents.length === 0 && (
                <div className="py-4 text-center text-xs text-[#f5f5dc]/40">
                  No team members online
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   AGENT GROUP COMPONENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function AgentGroup({
  title,
  agents,
  currentUserId,
  onAgentClick,
  now,
}: {
  title: string;
  agents: AgentStatus[];
  currentUserId?: string;
  onAgentClick?: (agent: AgentStatus) => void;
  now: number;
}) {
  return (
    <div className="mb-2">
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#f5f5dc]/40">
        {title}
      </p>
      <div className="space-y-1">
        {agents.map((agent) => (
          <AgentRow
            key={agent.id}
            agent={agent}
            isCurrentUser={agent.user_id === currentUserId}
            onClick={() => onAgentClick?.(agent)}
            now={now}
          />
        ))}
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   AGENT ROW COMPONENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function AgentRow({
  agent,
  isCurrentUser,
  onClick,
  now,
}: {
  agent: AgentStatus;
  isCurrentUser: boolean;
  onClick?: () => void;
  now: number;
}) {
  const config = statusConfig[agent.status];
  const displayName = agent.profiles?.display_name || "Agent";
  const lastActive = new Date(agent.last_activity);
  const minutesAgo = Math.floor((now - lastActive.getTime()) / 60000);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition",
        "hover:bg-[#f5f5dc]/5",
        isCurrentUser && "bg-[#d4af37]/5"
      )}
    >
      {/* Avatar with status */}
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarImage src={agent.profiles?.avatar_url || undefined} />
          <AvatarFallback className="bg-[#d4af37]/20 text-xs text-[#d4af37]">
            {displayName[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a1229]",
            config.color,
            config.pulse && "animate-pulse"
          )}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-[#f5f5dc]">
            {displayName}
            {isCurrentUser && (
              <span className="ml-1 text-xs text-[#d4af37]">(you)</span>
            )}
          </p>
          {agent.is_typing && (
            <Badge className="h-4 bg-blue-500/20 px-1.5 text-[10px] text-blue-400">
              typing...
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#f5f5dc]/40">
          {agent.current_thread_id && (
            <>
              <MessageSquare className="h-3 w-3" />
              <span>In conversation</span>
            </>
          )}
          {minutesAgo > 0 && minutesAgo < 60 && (
            <>
              <Clock className="h-3 w-3" />
              <span>{minutesAgo}m ago</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
