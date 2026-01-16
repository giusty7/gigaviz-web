import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAppContext } from "@/lib/app-context";
import { getWorkspaceMembership } from "@/lib/workspaces";
import { ImperiumSettingsClient } from "@/components/app/ImperiumSettingsClient";
import InviteForm from "@/components/admin/InviteForm";
import PendingInvites from "@/components/admin/PendingInvites";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ workspaceSlug: string }> | { workspaceSlug: string };
};

export default async function SettingsPage({ params }: Props) {
  const { workspaceSlug } = (await params) as { workspaceSlug: string };
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");
  const currentWorkspace = ctx.currentWorkspace;

  const db = supabaseAdmin();
  const { data: profile } = await db
    .from("profiles")
    .select("id, email, full_name, avatar_url, is_admin")
    .eq("id", ctx.user.id)
    .maybeSingle();

  const membership = await getWorkspaceMembership(ctx.user.id, currentWorkspace.id);
  const canEditWorkspace =
    membership?.role === "owner" ||
    membership?.role === "admin" ||
    Boolean(profile?.is_admin);
  const canManageMembers = canEditWorkspace;

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
    (memberProfiles ?? []).map((memberProfile: { id: string; full_name: string | null; email: string }) => [
      memberProfile.id,
      memberProfile,
    ])
  );

  const ownerCount =
    members?.filter((member) => member.role === "owner").length ?? 0;

  const { data: pendingInvites } = await db
    .from("workspace_invites")
    .select("id, email, role, created_at")
    .eq("workspace_id", currentWorkspace.id)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

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

    redirect(`/${workspaceSlug}/settings`);
  }

  async function updateWorkspace(formData: FormData) {
    "use server";
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getUser();

    if (!data.user) redirect("/login");

    const workspaceId = String(formData.get("workspace_id") || "");
    const name = String(formData.get("workspace_name") || "").trim();

    if (!workspaceId || !name) redirect(`/${workspaceSlug}/settings?error=invalid_workspace`);

    const membership = await getWorkspaceMembership(data.user.id, workspaceId);
    const isOwnerOrAdmin =
      membership?.role === "owner" || membership?.role === "admin";

    const db = supabaseAdmin();
    const { data: profileAdmin } = await db
      .from("profiles")
      .select("is_admin")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!isOwnerOrAdmin && !profileAdmin?.is_admin) {
      redirect(`/${workspaceSlug}/settings?error=forbidden`);
    }

    await db.from("workspaces").update({ name }).eq("id", workspaceId);

    redirect(`/${workspaceSlug}/settings`);
  }

  async function removeMember(formData: FormData) {
    "use server";
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getUser();

    if (!data.user) redirect("/login");

    const workspaceId = String(formData.get("workspace_id") || "");
    const targetUserId = String(formData.get("user_id") || "");

    if (!workspaceId || !targetUserId) {
      redirect(`/${workspaceSlug}/settings?error=invalid_member`);
    }

    if (targetUserId === data.user.id) {
      redirect(`/${workspaceSlug}/settings?error=use_leave_action`);
    }

    const membership = await getWorkspaceMembership(data.user.id, workspaceId);
    const isOwnerOrAdmin =
      membership?.role === "owner" || membership?.role === "admin";

    const db = supabaseAdmin();
    const { data: profileAdmin2 } = await db
      .from("profiles")
      .select("is_admin")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!isOwnerOrAdmin && !profileAdmin2?.is_admin) {
      redirect(`/${workspaceSlug}/settings?error=forbidden`);
    }

    const { data: targetMembership } = await db
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (!targetMembership) {
      redirect(`/${workspaceSlug}/settings?error=member_not_found`);
    }

    const { data: owners } = await db
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspaceId)
      .eq("role", "owner");

    const ownerCount = owners?.length ?? 0;
    if (targetMembership.role === "owner" && ownerCount <= 1) {
      redirect(`/${workspaceSlug}/settings?error=last_owner`);
    }

    await db
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", targetUserId);

    redirect(`/${workspaceSlug}/settings`);
  }

  async function leaveWorkspace(formData: FormData) {
    "use server";
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getUser();

    if (!data.user) redirect("/login");

    const workspaceId = String(formData.get("workspace_id") || "");
    if (!workspaceId) {
      redirect(`/${workspaceSlug}/settings?error=invalid_workspace`);
    }

    const membership = await getWorkspaceMembership(data.user.id, workspaceId);
    if (!membership) {
      redirect(`/${workspaceSlug}/settings?error=member_not_found`);
    }

    if (membership.role === "owner") {
      redirect(`/${workspaceSlug}/settings?error=owner_cannot_leave`);
    }

    const db2 = supabaseAdmin();
    await db2
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", data.user.id);

    redirect("/app");
  }

  // Prepare members data for client component
  const membersData = (members ?? []).map((member) => {
    const isSelf = member.user_id === ctx.user.id;
    const memberProfile = profileMap.get(member.user_id);
    const displayName =
      memberProfile?.full_name ||
      memberProfile?.email ||
      (isSelf ? "You" : member.user_id);
    const displayEmail =
      memberProfile?.email || (isSelf ? ctx.user.email ?? null : null);
    const isLastOwner = member.role === "owner" && ownerCount <= 1;

    return {
      user_id: member.user_id,
      role: member.role,
      displayName,
      displayEmail,
      isSelf,
      isLastOwner,
    };
  });

  return (
    <ImperiumSettingsClient
      profile={profile}
      workspace={{
        id: currentWorkspace.id,
        name: currentWorkspace.name,
        slug: currentWorkspace.slug,
      }}
      members={membersData}
      pendingInvites={pendingInvites ?? []}
      canEditWorkspace={canEditWorkspace}
      canManageMembers={canManageMembers}
      userEmail={ctx.user.email ?? ""}
      updateProfileAction={updateProfile}
      updateWorkspaceAction={updateWorkspace}
      removeMemberAction={removeMember}
      leaveWorkspaceAction={leaveWorkspace}
      inviteFormSlot={<InviteForm workspaceSlug={currentWorkspace.slug} />}
      pendingInvitesSlot={<PendingInvites invites={pendingInvites ?? []} />}
    />
  );
}

