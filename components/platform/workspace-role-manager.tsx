"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

export type WorkspaceMember = {
  userId: string;
  role: string | null;
  email: string | null;
  name: string | null;
};

type WorkspaceRoleManagerProps = {
  workspaceId: string;
  canManage: boolean;
  members: WorkspaceMember[];
};

export function WorkspaceRoleManager({ workspaceId, canManage, members }: WorkspaceRoleManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState<WorkspaceMember[]>(members);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    setRows(members);
  }, [members]);

  const updateRole = async (userId: string, role: string) => {
    setPendingId(userId);
    const res = await fetch("/api/workspace-members/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, userId, role }),
    });

    setPendingId(null);
    if (!res.ok) {
      toast({ title: "Role not updated", description: "You need owner or admin rights.", variant: "destructive" });
      return;
    }

    setRows((prev) => prev.map((m) => (m.userId === userId ? { ...m, role } : m)));
    toast({ title: "Role updated", description: `New role: ${role}` });
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-background px-4 py-6 text-center text-sm">
          <p className="font-semibold text-foreground">No members yet</p>
          <p className="text-xs text-muted-foreground">Invite members to manage access.</p>
        </div>
      ) : (
        rows.map((member) => (
          <div
            key={member.userId}
            className="flex items-center justify-between rounded-xl border border-border/80 bg-background px-4 py-3 text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gigaviz-surface/70 text-gigaviz-gold">
                {member.role === "owner" ? <ShieldCheck className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              </span>
              <div>
                <p className="font-semibold text-foreground">{member.name ?? "Member"}</p>
                <p className="text-xs text-muted-foreground">{member.email ?? "No email"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="border-border/80 capitalize text-foreground">
                {member.role ?? "member"}
              </Badge>
              {canManage ? (
                <select
                  value={member.role ?? "member"}
                  onChange={(e) => updateRole(member.userId, e.target.value)}
                  disabled={pendingId === member.userId}
                  className="w-32 rounded-md border border-border bg-background px-2 py-1 text-xs capitalize text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gigaviz-gold"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
              ) : null}
            </div>
          </div>
        ))
      )}
      {canManage ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-background px-4 py-3 text-xs text-muted-foreground">
          Owners and admins can change roles. All writes are audit logged.
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-background px-4 py-3 text-xs text-muted-foreground">
          You need owner or admin rights to edit roles.
        </div>
      )}
    </div>
  );
}
