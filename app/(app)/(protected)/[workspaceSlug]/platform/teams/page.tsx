import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { Users2, UserPlus, Shield, Settings } from "lucide-react";
import Link from "next/link";

type Member = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
};

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function PlatformTeamsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const supabase = await supabaseServer();

  // Fetch workspace members
  const { data: members } = await supabase
    .from("workspace_members")
    .select(`
      id,
      user_id,
      role,
      created_at,
      profiles:user_id (
        full_name,
        email
      )
    `)
    .eq("workspace_id", ctx.currentWorkspace.id)
    .order("created_at", { ascending: false });

  // Stats
  const totalMembers = members?.length ?? 0;
  const adminCount = members?.filter((m) => m.role === "admin").length ?? 0;
  const memberCount = members?.filter((m) => m.role === "member").length ?? 0;

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="mt-2 text-muted-foreground">
            Manage workspace members, roles, and permissions
          </p>
        </div>
        <Link
          href={`/${workspaceSlug}/settings/team/invite`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Users2 className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{totalMembers}</p>
              <p className="text-sm text-muted-foreground">Total Members</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{adminCount}</p>
              <p className="text-sm text-muted-foreground">Admins</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <UserPlus className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{memberCount}</p>
              <p className="text-sm text-muted-foreground">Members</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Settings className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">Active</p>
              <p className="text-sm text-muted-foreground">Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Link
          href={`/${workspaceSlug}/settings/team`}
          className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
        >
          <Users2 className="mb-3 h-8 w-8 text-blue-500" />
          <h3 className="mb-2 font-semibold">Manage Members</h3>
          <p className="text-sm text-muted-foreground">
            Add, remove, or update member roles and permissions
          </p>
        </Link>
        <Link
          href={`/${workspaceSlug}/settings/team/roles`}
          className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
        >
          <Shield className="mb-3 h-8 w-8 text-purple-500" />
          <h3 className="mb-2 font-semibold">Roles & Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Configure roles and access control policies
          </p>
        </Link>
        <Link
          href={`/${workspaceSlug}/settings/team/activity`}
          className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
        >
          <Settings className="mb-3 h-8 w-8 text-orange-500" />
          <h3 className="mb-2 font-semibold">Activity Log</h3>
          <p className="text-sm text-muted-foreground">
            View team activity and audit logs
          </p>
        </Link>
      </div>

      {/* Members List */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Team Members</h2>
        {members && members.length > 0 ? (
          <div className="space-y-2">
            {(members as unknown as Member[]).map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Users2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {member.profiles.full_name || member.profiles.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.profiles.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      member.role === "admin"
                        ? "bg-purple-500/10 text-purple-500"
                        : member.role === "owner"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {member.role}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(member.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-12 text-center">
            <Users2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No team members yet. Invite your first team member!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
