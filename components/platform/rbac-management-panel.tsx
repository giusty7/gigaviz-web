"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Shield, Crown, User, Loader2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Role = "owner" | "admin" | "member" | "viewer" | null;

type WorkspaceMember = {
  user_id: string;
  role: Role;
  created_at: string;
  profiles: {
    email: string;
    display_name: string | null;
  } | null;
};

type Props = {
  workspaceId: string;
  currentUserRole: Role;
};

const roleIcons: Record<NonNullable<Role>, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: Users,
  viewer: User,
};

const roleColors: Record<NonNullable<Role>, string> = {
  owner: "text-[#d4af37] bg-[#d4af37]/10 border-[#d4af37]/30",
  admin: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  member: "text-green-400 bg-green-400/10 border-green-400/30",
  viewer: "text-gray-400 bg-gray-400/10 border-gray-400/30",
};

export function RBACManagementPanel({ workspaceId, currentUserRole }: Props) {
  const { toast } = useToast();
  const t = useTranslations("platform.rbac");
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [newRole, setNewRole] = useState<Role>(null);

  const canManageRoles = currentUserRole === "owner" || currentUserRole === "admin";

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspace-members?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error("Failed to load members");
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err) {
      toast({
        title: t("failedLoadMembers"),
        description: err instanceof Error ? err.message : t("tryAgainLater"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, toast, t]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  const handleChangeRole = useCallback(
    async (userId: string, role: Role) => {
      if (!canManageRoles) return;

      setChangingRole(userId);
      try {
        const res = await fetch("/api/workspace-members/role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, userId, role }),
        });

        if (!res.ok) throw new Error("Failed to update role");

        toast({
          title: t("roleUpdated"),
          description: t("roleUpdatedDesc", { role: role ?? "member" }),
        });

        void fetchMembers();
      } catch (err) {
        toast({
          title: t("failedUpdateRole"),
          description: err instanceof Error ? err.message : t("tryAgainLater"),
          variant: "destructive",
        });
      } finally {
        setChangingRole(null);
        setDialogOpen(false);
        setSelectedMember(null);
      }
    },
    [workspaceId, canManageRoles, toast, fetchMembers, t]
  );

  const filteredMembers = members.filter((m) => {
    if (roleFilter !== "all" && m.role !== roleFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const email = m.profiles?.email?.toLowerCase() ?? "";
      const name = m.profiles?.display_name?.toLowerCase() ?? "";
      return email.includes(query) || name.includes(query);
    }
    return true;
  });

  if (loading) {
    return (
      <Card className="border-border/80 bg-card/90">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/80 bg-card/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#d4af37]" />
            {t("title")}
          </CardTitle>
          <CardDescription>
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allRoles")}</SelectItem>
                  <SelectItem value="owner">{t("owner")}</SelectItem>
                  <SelectItem value="admin">{t("admin")}</SelectItem>
                  <SelectItem value="member">{t("member")}</SelectItem>
                  <SelectItem value="viewer">{t("viewer")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Members list */}
          <div className="space-y-2">
            {filteredMembers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
                {t("noMembers")}
              </div>
            ) : (
              filteredMembers.map((member) => {
                const Icon = member.role ? roleIcons[member.role] : Users;
                const isChanging = changingRole === member.user_id;

                return (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gigaviz-surface/80 border border-border/40">
                        <Icon className="h-5 w-5 text-[#d4af37]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground truncate">
                          {member.profiles?.display_name || member.profiles?.email || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.profiles?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn("text-xs font-semibold", member.role ? roleColors[member.role] : "")}
                      >
                        {member.role || "member"}
                      </Badge>

                      {canManageRoles && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isChanging}
                          onClick={() => {
                            setSelectedMember(member);
                            setNewRole(member.role);
                            setDialogOpen(true);
                          }}
                        >
                          {isChanging ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            t("changeRole")
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{t("totalMembers", { count: members.length })}</span>
            </div>
            {roleFilter !== "all" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>{t("filtered", { count: filteredMembers.length })}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Change Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("changeRoleTitle")}</DialogTitle>
            <DialogDescription>
              {t("changeRoleDesc", { email: selectedMember?.profiles?.email ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={newRole ?? "member"} onValueChange={(v) => setNewRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">{t("ownerFull")}</SelectItem>
                <SelectItem value="admin">{t("adminFull")}</SelectItem>
                <SelectItem value="member">{t("memberFull")}</SelectItem>
                <SelectItem value="viewer">{t("viewerFull")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("roleChangeNote")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedMember && handleChangeRole(selectedMember.user_id, newRole)}
              disabled={changingRole !== null}
            >
              {changingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : t("updateRole")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
