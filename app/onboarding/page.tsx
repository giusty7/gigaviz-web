import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureProfile } from "@/lib/profiles";
import { getUserWorkspaces, WORKSPACE_COOKIE } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

function slugify(input: string) {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48);
  return slug || "workspace";
}

async function createWorkspace(formData: FormData) {
  "use server";
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const name = String(formData.get("workspace_name") || "").trim();
  if (!name) {
    redirect("/onboarding?error=workspace_name_required");
  }

  await ensureProfile(data.user);

  const db = supabaseAdmin();
  const slugBase = slugify(name);
  let slug = slugBase;

  for (let i = 0; i < 5; i += 1) {
    const { data: existing } = await db
      .from("workspaces")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { data: workspace, error } = await db
    .from("workspaces")
    .insert({
      name,
      slug,
      owner_id: data.user.id,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, workspace.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/app");
}

export default async function OnboardingPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  await ensureProfile(data.user);
  const workspaces = await getUserWorkspaces(data.user.id);

  if (workspaces.length > 0) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#070B18]">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white">Buat Workspace</h1>
        <p className="text-white/70 text-sm mt-2">
          Workspace adalah container billing untuk subscription dan token.
        </p>

        <form action={createWorkspace} className="mt-6 space-y-4">
          <div>
            <label className="text-white/80 text-sm">Nama Workspace</label>
            <input
              name="workspace_name"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
              placeholder="Contoh: Gigaviz Studio"
              required
            />
          </div>

          <button className="w-full rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-black font-semibold py-2">
            Lanjutkan
          </button>
        </form>
      </div>
    </div>
  );
}
