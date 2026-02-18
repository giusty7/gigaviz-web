"use client";
import { logger } from "@/lib/logging";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditConnectionDialog } from "@/components/meta-hub/EditConnectionDialog";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, RefreshCw, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { QuickRepliesManager } from "@/components/meta-hub/QuickRepliesManager";
import { AgentStatusManager } from "@/components/meta-hub/AgentStatusManager";
import { AssignmentRulesManager } from "@/components/meta-hub/AssignmentRulesManager";
import { AutoReplyRulesManager } from "@/components/meta-hub/AutoReplyRulesManager";

function formatRelativeTime(dateString: string, t: (key: string, values?: Record<string, string | number | Date>) => string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return t("justNow");
  if (diffMins < 60) return t("minutesAgo", { count: diffMins });
  if (diffHours < 24) return t("hoursAgo", { count: diffHours });
  return t("daysAgo", { count: diffDays });
}

type Connection = {
  id: string;
  phone_number_id: string;
  waba_id: string;
  display_name: string | null;
  notes?: string | null;
  status: string | null;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  qualityRating: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
};

type Member = {
  user_id: string;
  role: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

type Template = {
  id: string;
  name: string;
  language: string;
  status: string;
};

type MetaHubSettingsClientProps = {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  initialTab: string;
  connections: Connection[];
  members: Member[];
  templates: Template[];
  currentUserId: string;
};

export function MetaHubSettingsClient({
  workspaceId,
  workspaceSlug,
  workspaceName,
  initialTab,
  connections,
  members,
  templates,
  currentUserId,
}: MetaHubSettingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const t = useTranslations("metaHubUI.metaHubSettings");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`/${workspaceSlug}/meta-hub/settings?${params.toString()}`);
  };

  const handleSync = async (phoneNumberId: string) => {
    setSyncingId(phoneNumberId);
    try {
      const res = await fetch(`/api/meta-hub/connections/${phoneNumberId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.details || t("syncFailed"));
      }

      toast({
        title: t("syncSuccess"),
        description: t("syncSuccessDesc"),
      });

      router.refresh();
    } catch (err) {
      logger.error("Sync failed:", err);
      toast({
        title: t("syncFailed"),
        description: err instanceof Error ? err.message : t("tryAgain"),
        variant: "destructive",
      });
    } finally {
      setSyncingId(null);
    }
  };

  const getDisplayName = (conn: Connection) => {
    return (
      conn.display_name ||
      conn.verifiedName ||
      conn.displayPhoneNumber ||
      "WhatsApp Line"
    );
  };

  const getSubtext = (conn: Connection) => {
    const parts: string[] = [];
    if (conn.verifiedName) parts.push(conn.verifiedName);
    if (conn.displayPhoneNumber) parts.push(conn.displayPhoneNumber);
    return parts.join(" â€¢ ") || t("noMetadata");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("subtitle")}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="profile">{t("tabProfile")}</TabsTrigger>
          <TabsTrigger value="connections">{t("tabConnections")}</TabsTrigger>
          <TabsTrigger value="diagnostics">{t("tabDiagnostics")}</TabsTrigger>
          <TabsTrigger value="quick-replies">{t("tabQuickReplies")}</TabsTrigger>
          <TabsTrigger value="agent-status">{t("tabAgentStatus")}</TabsTrigger>
          <TabsTrigger value="assignment">{t("tabAssignment")}</TabsTrigger>
          <TabsTrigger value="auto-reply">{t("tabAutoReply")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("workspaceProfile")}</CardTitle>
              <CardDescription>
                {t("workspaceProfileDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">{t("workspaceName")}</div>
                <div className="text-lg font-semibold">{workspaceName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">{t("workspaceSlug")}</div>
                <div className="text-lg font-mono">{workspaceSlug}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">{t("workspaceIdLabel")}</div>
                <div className="text-sm font-mono text-muted-foreground">{workspaceId}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("whatsappConnections")}</CardTitle>
              <CardDescription>
                {t("whatsappConnectionsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("noConnections")}
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((conn) => (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{getDisplayName(conn)}</h3>
                          {conn.status === "active" ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {t("active")}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{conn.status || t("unknownStatus")}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{getSubtext(conn)}</p>
                        {conn.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            {conn.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>WABA: {conn.waba_id}</span>
                          <span>Phone ID: {conn.phone_number_id}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingConnection(conn)}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          {t("edit")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(conn.phone_number_id)}
                          disabled={syncingId === conn.phone_number_id}
                        >
                          <RefreshCw
                            className={`w-4 h-4 mr-1 ${
                              syncingId === conn.phone_number_id ? "animate-spin" : ""
                            }`}
                          />
                          {t("sync")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("connectionDiagnostics")}</CardTitle>
              <CardDescription>
                {t("connectionDiagnosticsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("noDiagnostics")}
                </div>
              ) : (
                <div className="space-y-4">
                  {connections.map((conn) => (
                    <div key={conn.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{getDisplayName(conn)}</h3>
                        {conn.lastError ? (
                          <Badge variant="default" className="bg-red-600">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {t("error")}
                          </Badge>
                        ) : conn.lastSyncedAt ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {t("healthy")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            {t("neverSynced")}
                          </Badge>
                        )}
                      </div>

                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("phoneNumberIdLabel")}:</span>
                          <span className="font-mono">{conn.phone_number_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("wabaIdLabel")}:</span>
                          <span className="font-mono">{conn.waba_id}</span>
                        </div>
                        {conn.displayPhoneNumber && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("displayPhone")}:</span>
                            <span className="font-mono">{conn.displayPhoneNumber}</span>
                          </div>
                        )}
                        {conn.verifiedName && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("verifiedName")}:</span>
                            <span>{conn.verifiedName}</span>
                          </div>
                        )}
                        {conn.qualityRating && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("qualityRating")}:</span>
                            <Badge variant="outline">{conn.qualityRating.toUpperCase()}</Badge>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("lastSynced")}:</span>
                          <span>
                            {conn.lastSyncedAt
                              ? formatRelativeTime(conn.lastSyncedAt, t)
                              : t("never")}
                          </span>
                        </div>
                      </div>

                      {conn.lastError && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-md">
                          <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                            {t("lastError")}:
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {conn.lastError}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Replies Tab */}
        <TabsContent value="quick-replies" className="space-y-4">
          <QuickRepliesManager workspaceId={workspaceId} />
        </TabsContent>

        {/* Agent Status Tab */}
        <TabsContent value="agent-status" className="space-y-4">
          <AgentStatusManager currentUserId={currentUserId} />
        </TabsContent>

        {/* Assignment Rules Tab */}
        <TabsContent value="assignment" className="space-y-4">
          <AssignmentRulesManager 
            members={members.map(m => ({
              userId: m.user_id,
              role: m.role,
              profile: m.profiles ? {
                fullName: m.profiles.full_name,
                email: m.user_id, // fallback - ideally should fetch real email
              } : undefined
            }))}
          />
        </TabsContent>

        {/* Auto-Reply Rules Tab */}
        <TabsContent value="auto-reply" className="space-y-4">
          <AutoReplyRulesManager 
            workspaceId={workspaceId}
            templates={templates}
          />
        </TabsContent>
      </Tabs>

      {editingConnection && (
        <EditConnectionDialog
          open={!!editingConnection}
          onOpenChange={(open) => !open && setEditingConnection(null)}
          connection={{
            phoneNumberId: editingConnection.phone_number_id,
            displayName: editingConnection.display_name,
            notes: editingConnection.notes,
          }}
          workspaceId={workspaceId}
        />
      )}
    </div>
  );
}
