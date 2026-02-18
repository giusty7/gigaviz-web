"use client";
import { logger } from "@/lib/logging";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  CircleIcon,
  ClockIcon,
  UsersIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

type AgentStatusType = "online" | "away" | "busy" | "offline";

interface AgentStatus {
  userId: string;
  workspaceId: string;
  status: AgentStatusType;
  statusMessage: string | null;
  lastActiveAt: string;
  autoAwayAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile?: {
    fullName: string | null;
    avatarUrl: string | null;
    email: string;
  };
}

interface Props {
  currentUserId: string;
}

const STATUS_CONFIG: Record<AgentStatusType, { label: string; color: string; bgColor: string }> = {
  online: { label: "online", color: "text-green-500", bgColor: "bg-green-500" },
  away: { label: "away", color: "text-yellow-500", bgColor: "bg-yellow-500" },
  busy: { label: "busy", color: "text-red-500", bgColor: "bg-red-500" },
  offline: { label: "offline", color: "text-gray-400", bgColor: "bg-gray-400" },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AgentStatusManager({ currentUserId }: Props) {
  const { toast } = useToast();
  const t = useTranslations("metaHubUI.agentStatus");
  
  // State
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [stats, setStats] = useState({ total: 0, online: 0, available: 0 });
  const [loading, setLoading] = useState(true);
  const [myStatus, setMyStatus] = useState<AgentStatusType>("offline");
  const [myStatusMessage, setMyStatusMessage] = useState("");
  const [updating, setUpdating] = useState(false);

  // ============================================================================
  // FETCH DATA
  // ============================================================================

  const fetchAgentStatuses = useCallback(async () => {
    try {
      const res = await fetch("/api/meta-hub/agent-status");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setAgents(data.agents || []);
      setStats(data.stats || { total: 0, online: 0, available: 0 });
      
      // Find current user's status
      const mine = data.agents?.find((a: AgentStatus) => a.userId === currentUserId);
      if (mine) {
        setMyStatus(mine.status);
        setMyStatusMessage(mine.statusMessage || "");
      }
    } catch (err) {
      logger.error("Failed to fetch agent statuses:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchAgentStatuses();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchAgentStatuses, 30000);
    return () => clearInterval(interval);
  }, [fetchAgentStatuses]);

  // Heartbeat - ping every 2 minutes to keep status alive
  useEffect(() => {
    const ping = async () => {
      try {
        await fetch("/api/meta-hub/agent-status", { method: "PATCH" });
      } catch {
        // Ignore errors
      }
    };
    
    ping(); // Initial ping
    const interval = setInterval(ping, 120000);
    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const updateMyStatus = async (newStatus: AgentStatusType, message?: string) => {
    try {
      setUpdating(true);
      setMyStatus(newStatus);
      
      const res = await fetch("/api/meta-hub/agent-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          statusMessage: message ?? myStatusMessage,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast({
        title: t("statusUpdated"),
        description: t("youAreNow", { status: t(STATUS_CONFIG[newStatus].label) }),
      });
      
      fetchAgentStatuses();
    } catch (err) {
      toast({
        title: t("errorUpdatingStatus"),
        description: err instanceof Error ? err.message : t("unknownError"),
        variant: "destructive",
      });
      fetchAgentStatuses(); // Revert to server state
    } finally {
      setUpdating(false);
    }
  };

  const updateStatusMessage = async () => {
    await updateMyStatus(myStatus, myStatusMessage);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const otherAgents = agents.filter(a => a.userId !== currentUserId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">{t("totalAgents")}</div>
          </div>
          <div className="text-center p-3 bg-green-500/10 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.online}</div>
            <div className="text-xs text-muted-foreground">{t("online")}</div>
          </div>
          <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.available}</div>
            <div className="text-xs text-muted-foreground">{t("available")}</div>
          </div>
        </div>

        {/* My Status */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <h3 className="font-medium mb-3">{t("yourStatus")}</h3>
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-36 justify-start"
                  disabled={updating}
                >
                  <CircleIcon 
                    className={cn(
                      "h-3 w-3 mr-2 fill-current",
                      STATUS_CONFIG[myStatus].color
                    )} 
                  />
                  {t(STATUS_CONFIG[myStatus].label)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                {(Object.keys(STATUS_CONFIG) as AgentStatusType[]).map(status => (
                  <Button
                    key={status}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => updateMyStatus(status)}
                  >
                    <CircleIcon 
                      className={cn(
                        "h-3 w-3 mr-2 fill-current",
                        STATUS_CONFIG[status].color
                      )} 
                    />
                    {t(STATUS_CONFIG[status].label)}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
            
            <Input
              placeholder={t("statusMessagePlaceholder")}
              value={myStatusMessage}
              onChange={(e) => setMyStatusMessage(e.target.value)}
              onBlur={updateStatusMessage}
              onKeyDown={(e) => e.key === "Enter" && updateStatusMessage()}
              className="flex-1"
            />
          </div>
        </div>

        {/* Other Agents */}
        {otherAgents.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">{t("team")}</h3>
            <div className="space-y-2">
              {otherAgents.map(agent => (
                <AgentStatusRow key={agent.userId} agent={agent} />
              ))}
            </div>
          </div>
        )}

        {loading && agents.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            {t("loadingStatuses")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function AgentStatusRow({ agent }: { agent: AgentStatus }) {
  const config = STATUS_CONFIG[agent.status];
  const name = agent.profile?.fullName || agent.profile?.email || "Unknown";
  const initials = name.slice(0, 2).toUpperCase();
  
  const lastActive = agent.lastActiveAt 
    ? formatTimeAgo(new Date(agent.lastActiveAt))
    : null;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="relative">
        <Avatar className="h-9 w-9">
          <AvatarImage src={agent.profile?.avatarUrl || undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div 
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
            config.bgColor
          )}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{name}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span className={config.color}>{config.label}</span>
          {agent.statusMessage && (
            <>
              <span>â€¢</span>
              <span className="truncate">{agent.statusMessage}</span>
            </>
          )}
        </div>
      </div>
      
      {lastActive && agent.status !== "online" && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <ClockIcon className="h-3 w-3" />
          {lastActive}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export default AgentStatusManager;
