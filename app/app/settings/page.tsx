import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAppContext } from "@/lib/app-context";
import { getWorkspaceMembership } from "@/lib/workspaces";
import { SettingsLayout } from "@/components/layout/settings-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

export default async function SettingsPage() {
  const ctx = await getAppContext();
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const db = supabaseAdmin();
  const { data: profile } = await db
    .from("profiles")
    .select("id, email, full_name, avatar_url, is_admin")
    .eq("id", ctx.user.id)
    .maybeSingle();

  const membership = await getWorkspaceMembership(
    ctx.user.id,
    ctx.currentWorkspace.id
  );
  const canEditWorkspace =
    membership?.role === "owner" ||
    membership?.role === "admin" ||
    Boolean(profile?.is_admin);

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

      <Card>
        <CardHeader>
          <CardTitle>Workspace Settings</CardTitle>
          <CardDescription>
            Only owners/admins can update workspace data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateWorkspace} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="workspace_id" value={ctx.currentWorkspace.id} />
            <Input
              name="workspace_name"
              defaultValue={ctx.currentWorkspace.name}
              disabled={!canEditWorkspace}
            />
            <Input
              value={ctx.currentWorkspace.slug}
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
