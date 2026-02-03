"use client";

import { useState } from "react";
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

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
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
        throw new Error(data.message || data.details || "Sync failed");
      }

      toast({
        title: "Sync successful",
        description: "Connection metadata has been updated from Meta.",
      });

      router.refresh();
    } catch (err) {
      console.error("Sync failed:", err);
      toast({
        title: "Sync failed",
        description: err instanceof Error ? err.message : "Please try again.",
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
    return parts.join(" • ") || "No metadata available";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meta Hub Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your Meta Hub configuration and connections
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="quick-replies">Quick Replies</TabsTrigger>
          <TabsTrigger value="agent-status">Agent Status</TabsTrigger>
          <TabsTrigger value="assignment">Assignment</TabsTrigger>
          <TabsTrigger value="auto-reply">Auto-Reply</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Profile</CardTitle>
              <CardDescription>
                Basic information about your workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Workspace Name</div>
                <div className="text-lg font-semibold">{workspaceName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Workspace Slug</div>
                <div className="text-lg font-mono">{workspaceSlug}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Workspace ID</div>
                <div className="text-sm font-mono text-muted-foreground">{workspaceId}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Connections</CardTitle>
              <CardDescription>
                Manage your WhatsApp Business API connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No connections found. Set up your first WhatsApp connection to get started.
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
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{conn.status || "Unknown"}</Badge>
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
                          Edit
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
                          Sync
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
              <CardTitle>Connection Diagnostics</CardTitle>
              <CardDescription>
                View sync status and errors for your connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No connections to diagnose.
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
                            Error
                          </Badge>
                        ) : conn.lastSyncedAt ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Healthy
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            Never Synced
                          </Badge>
                        )}
                      </div>

                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone Number ID:</span>
                          <span className="font-mono">{conn.phone_number_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">WABA ID:</span>
                          <span className="font-mono">{conn.waba_id}</span>
                        </div>
                        {conn.displayPhoneNumber && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Display Phone:</span>
                            <span className="font-mono">{conn.displayPhoneNumber}</span>
                          </div>
                        )}
                        {conn.verifiedName && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Verified Name:</span>
                            <span>{conn.verifiedName}</span>
                          </div>
                        )}
                        {conn.qualityRating && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Quality Rating:</span>
                            <Badge variant="outline">{conn.qualityRating.toUpperCase()}</Badge>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Synced:</span>
                          <span>
                            {conn.lastSyncedAt
                              ? formatRelativeTime(conn.lastSyncedAt)
                              : "Never"}
                          </span>
                        </div>
                      </div>

                      {conn.lastError && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-md">
                          <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                            Last Error:
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
