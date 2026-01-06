import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAppContext } from "@/lib/app-context";
import { getWorkspaceMembership } from "@/lib/workspaces";

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
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Account Settings</h2>
        <p className="text-sm text-white/60 mt-1">
          Update your profile basics.
        </p>

        <form action={updateProfile} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            name="full_name"
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            placeholder="Full name"
            defaultValue={profile?.full_name ?? ""}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/60"
            value={profile?.email ?? ctx.user.email ?? ""}
            readOnly
          />
          <button className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 md:col-span-2">
            Save profile
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Workspace Settings</h2>
        <p className="text-sm text-white/60 mt-1">
          Only owners/admins can update workspace data.
        </p>

        <form
          action={updateWorkspace}
          className="mt-4 grid gap-3 md:grid-cols-2"
        >
          <input type="hidden" name="workspace_id" value={ctx.currentWorkspace.id} />
          <input
            name="workspace_name"
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            defaultValue={ctx.currentWorkspace.name}
            disabled={!canEditWorkspace}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/60"
            value={ctx.currentWorkspace.slug}
            readOnly
          />
          <button
            disabled={!canEditWorkspace}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-50 md:col-span-2"
          >
            Save workspace
          </button>
        </form>
      </section>
    </div>
  );
}
