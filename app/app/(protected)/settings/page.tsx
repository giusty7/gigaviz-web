import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAppContext } from "@/lib/app-context";
import { getWorkspaceMembership } from "@/lib/workspaces";
import { SettingsLayout } from "@/components/layout/settings-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

async function updateProfile(formData: FormData) {
  "use server";
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const fullName = String(formData.get("full_name") || "").trim();
  const db = supabaseAdmin();

  await db
    .from("profiles")
    .update({ full_name: fullName || null })
    .eq("id", data.user.id);

  redirect("/app/settings");
}

async function updateWorkspace(formData: FormData) {
  "use server";
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const workspaceId = String(formData.get("workspace_id") || "");
  const name = String(formData.get("workspace_name") || "").trim();

  if (!workspaceId || !name) redirect("/app/settings?error=invalid_workspace");

  const membership = await getWorkspaceMembership(data.user.id, workspaceId);
  const isOwnerOrAdmin =
    membership?.role === "owner" || membership?.role === "admin";

  const db = supabaseAdmin();
  const { data: profile } = await db
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!isOwnerOrAdmin && !profile?.is_admin) {
    redirect("/app/settings?error=forbidden");
  }

  await db.from("workspaces").update({ name }).eq("id", workspaceId);

  redirect("/app/settings");
}

async function removeMember(formData: FormData) {
  "use server";
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const workspaceId = String(formData.get("workspace_id") || "");
  const targetUserId = String(formData.get("user_id") || "");

  if (!workspaceId || !targetUserId) {
    redirect("/app/settings?error=invalid_member");
  }

  if (targetUserId === data.user.id) {
    redirect("/app/settings?error=use_leave_action");
  }

  const membership = await getWorkspaceMembership(data.user.id, workspaceId);
  const isOwnerOrAdmin =
    membership?.role === "owner" || membership?.role === "admin";

  const db = supabaseAdmin();
  const { data: profile } = await db
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!isOwnerOrAdmin && !profile?.is_admin) {
    redirect("/app/settings?error=forbidden");
  }

  const { data: targetMembership } = await db
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!targetMembership) {
    redirect("/app/settings?error=member_not_found");
  }

  const { data: owners } = await db
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .eq("role", "owner");

  const ownerCount = owners?.length ?? 0;
  if (targetMembership.role === "owner" && ownerCount <= 1) {
    redirect("/app/settings?error=last_owner");
  }

  await db
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", targetUserId);

  redirect("/app/settings");
}

async function leaveWorkspace(formData: FormData) {
  "use server";
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const workspaceId = String(formData.get("workspace_id") || "");
  if (!workspaceId) {
    redirect("/app/settings?error=invalid_workspace");
  }

  const membership = await getWorkspaceMembership(data.user.id, workspaceId);
  if (!membership) {
    redirect("/app/settings?error=member_not_found");
  }

  if (membership.role === "owner") {
    redirect("/app/settings?error=owner_cannot_leave");
  }

  const db = supabaseAdmin();
  await db
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", data.user.id);

  redirect("/app");
}

export default async function SettingsPage() {
  const ctx = await getAppContext();
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/app/onboarding");
  const currentWorkspace = ctx.currentWorkspace;

  const db = supabaseAdmin();
  const { data: profile } = await db
    .from("profiles")
    .select("id, email, full_name, avatar_url, is_admin")
    .eq("id", ctx.user.id)
    .maybeSingle();

  const membership = await getWorkspaceMembership(
    ctx.user.id,
    currentWorkspace.id
  );
  const canEditWorkspace =
    membership?.role === "owner" ||
    membership?.role === "admin" ||
    Boolean(profile?.is_admin);
  const canManageMembers =
    membership?.role === "owner" ||
    membership?.role === "admin" ||
    Boolean(profile?.is_admin);

  const { data: members } = await db
    .from("workspace_members")
    .select("user_id, role, created_at")
    .eq("workspace_id", currentWorkspace.id)
    .order("created_at", { ascending: true });

  const memberIds = (members ?? []).map((member) => member.user_id);
  const { data: memberProfiles } =
    memberIds.length === 0
      ? { data: [] }
      : await db
          .from("profiles")
          .select("id, full_name, email")
          .in("id", memberIds);

  const profileMap = new Map(
    (memberProfiles ?? []).map((memberProfile) => [
      memberProfile.id,
      memberProfile,
    ])
  );

  const ownerCount =
    members?.filter((member) => member.role === "owner").length ?? 0;

  return (
    <SettingsLayout
      title="Settings"
      description="Manage your account and workspace preferences."
    >
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Update your profile basics.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="grid gap-3 md:grid-cols-2">
            <Input
              name="full_name"
              placeholder="Full name"
              defaultValue={profile?.full_name ?? ""}
            />
            <Input
              value={profile?.email ?? ctx.user.email ?? ""}
              readOnly
              className="text-gigaviz-muted"
            />
            <Button type="submit" className="md:col-span-2">
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card id="members">
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Manage workspace members and access roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gigaviz-muted">
              {members?.length ?? 0} member(s) in this workspace.
            </div>
            <Button variant="secondary" disabled>
              Invite member (coming soon)
            </Button>
          </div>

          {(members?.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-gigaviz-border bg-gigaviz-card p-4 text-sm text-gigaviz-muted">
              Belum ada anggota selain kamu.
            </div>
          ) : (
            <div className="rounded-xl border border-gigaviz-border bg-gigaviz-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(members ?? []).map((member) => {
                    const isSelf = member.user_id === ctx.user.id;
                    const memberProfile = profileMap.get(member.user_id);
                    const displayName =
                      memberProfile?.full_name ||
                      memberProfile?.email ||
                      (isSelf ? "You" : member.user_id);
                    const displayEmail =
                      memberProfile?.email || (isSelf ? ctx.user.email : null);
                    const isLastOwner =
                      member.role === "owner" && ownerCount <= 1;

                    return (
                      <TableRow key={member.user_id}>
                        <TableCell>
                          <div className="text-sm font-medium text-gigaviz-cream">
                            {displayName}
                            {isSelf && (
                              <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-white/60">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gigaviz-muted">
                            {displayEmail || member.user_id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="rounded-full bg-white/10 px-2 py-1 text-xs uppercase text-white/70">
                            {member.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {isSelf ? (
                            member.role !== "owner" ? (
                              <form action={leaveWorkspace}>
                                <input
                                  type="hidden"
                                  name="workspace_id"
                                  value={currentWorkspace.id}
                                />
                                <Button variant="outline" size="sm">
                                  Leave workspace
                                </Button>
                              </form>
                            ) : (
                              <span className="text-xs text-gigaviz-muted">
                                Owner {isLastOwner ? "(last owner)" : ""}
                              </span>
                            )
                          ) : canManageMembers ? (
                            <form action={removeMember}>
                                <input
                                  type="hidden"
                                  name="workspace_id"
                                  value={currentWorkspace.id}
                                />
                              <input
                                type="hidden"
                                name="user_id"
                                value={member.user_id}
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isLastOwner}
                              >
                                Remove
                              </Button>
                            </form>
                          ) : (
                            <span className="text-xs text-gigaviz-muted">
                              No access
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="text-xs text-gigaviz-muted">
            Owner/admin dapat remove anggota. Kamu bisa leave workspace jika bukan owner.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Settings</CardTitle>
          <CardDescription>
            Only owners/admins can update workspace data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateWorkspace} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="workspace_id" value={currentWorkspace.id} />
            <Input
              name="workspace_name"
              defaultValue={currentWorkspace.name}
              disabled={!canEditWorkspace}
            />
            <Input
              value={currentWorkspace.slug}
              readOnly
              className="text-gigaviz-muted"
            />
            <Button type="submit" disabled={!canEditWorkspace} className="md:col-span-2">
              Save workspace
            </Button>
          </form>
        </CardContent>
      </Card>
    </SettingsLayout>
  );
}
