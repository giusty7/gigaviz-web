import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureProfile } from "@/lib/profiles";
import { getUserWorkspaces, WORKSPACE_COOKIE } from "@/lib/workspaces";
import OnboardingForm from "./onboarding-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 32);
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
  const rawSlug = String(formData.get("workspace_slug") || "").trim();
  const slug = slugify(rawSlug || name);
  const slugValid = /^[a-z0-9-]{3,32}$/.test(slug);

  if (!slugValid) {
    redirect(`/onboarding?error=slug_invalid&slug=${encodeURIComponent(slug)}`);
  }

  const { data: existing } = await db
    .from("workspaces")
    .select("id")
    .ilike("slug", slug)
    .maybeSingle();

  if (existing) {
    redirect(`/onboarding?error=slug_taken&slug=${encodeURIComponent(slug)}`);
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
    if (error.code === "23505") {
      redirect(`/onboarding?error=slug_taken&slug=${encodeURIComponent(slug)}`);
    }
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

type OnboardingPageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
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

  const errorParam =
    typeof searchParams?.error === "string" ? searchParams.error : null;
  const slugParam =
    typeof searchParams?.slug === "string" ? searchParams.slug : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#070B18]">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white">Buat Workspace</h1>
        <p className="text-white/70 text-sm mt-2">
          Workspace adalah container billing untuk subscription dan token.
        </p>

        <OnboardingForm
          action={createWorkspace}
          error={errorParam}
          errorSlug={slugParam}
        />
      </div>
    </div>
  );
}
