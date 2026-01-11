import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createHash, randomUUID } from "node:crypto";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureProfile } from "@/lib/profiles";
import { getUserWorkspaces, WORKSPACE_COOKIE } from "@/lib/workspaces";
import {
  inviteListSchema,
  workspaceCreateSchema,
} from "@/lib/validation/auth";
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
  const rawSlug = String(formData.get("workspace_slug") || "").trim();
  const workspaceType = String(formData.get("workspace_type") || "individual");

  const parsed = workspaceCreateSchema.safeParse({
    name,
    slug: slugify(rawSlug || name),
    workspaceType,
  });

  if (!parsed.success) {
    redirect(`/onboarding?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid_workspace")}`);
  }

  await ensureProfile(data.user);

  const db = supabaseAdmin();
  const { data: existing } = await db
    .from("workspaces")
    .select("id")
    .ilike("slug", parsed.data.slug)
    .maybeSingle();

  if (existing) {
    redirect(`/onboarding?error=slug_taken&slug=${encodeURIComponent(parsed.data.slug)}`);
  }

  const { data: workspace, error } = await db
    .from("workspaces")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      owner_id: data.user.id,
      workspace_type: parsed.data.workspaceType,
    })
    .select("id, slug, workspace_type")
    .single();

  if (error || !workspace) {
    redirect(`/onboarding?error=${encodeURIComponent(error?.message ?? "create_failed")}`);
  }

  await db.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: data.user.id,
    role: "owner",
  });

  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, workspace.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  if (workspace.workspace_type === "team") {
    redirect(`/onboarding?step=invites&workspace=${workspace.slug}`);
  }

  redirect(`/${workspace.slug}/dashboard`);
}

async function createInvites(formData: FormData) {
  "use server";
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceSlug = String(formData.get("workspace_slug") || "").trim();
  if (!workspaceSlug) {
    redirect("/onboarding");
  }

  const rawEmails = String(formData.get("invite_emails") || "");
  const emails = rawEmails
    .split(/[\n,;]+/g)
    .map((value) => value.trim())
    .filter(Boolean);

  const parsed = inviteListSchema.safeParse({ emails });
  if (!parsed.success) {
    redirect(
      `/onboarding?step=invites&workspace=${encodeURIComponent(
        workspaceSlug
      )}&error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid_invites")}`
    );
  }

  const db = supabaseAdmin();
  const { data: workspace } = await db
    .from("workspaces")
    .select("id, slug, workspace_type")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (!workspace) {
    redirect("/onboarding");
  }

  if (workspace.workspace_type !== "team") {
    redirect(`/${workspace.slug}/dashboard`);
  }

  const { data: membership } = await db
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    redirect(`/${workspace.slug}/dashboard`);
  }

  if (parsed.data.emails.length > 0) {
    const rows = parsed.data.emails.map((email) => {
      const token = randomUUID();
      const tokenHash = createHash("sha256").update(token).digest("hex");
      return {
        workspace_id: workspace.id,
        email,
        role: "member",
        token_hash: tokenHash,
        invited_by: data.user.id,
      };
    });

    await db.from("workspace_invites").insert(rows);
  }

  redirect(`/${workspace.slug}/dashboard`);
}

type OnboardingPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const resolvedSearchParams = await searchParams;
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  await ensureProfile(data.user);
  const workspaces = await getUserWorkspaces(data.user.id);

  if (workspaces.length > 0) {
    redirect(`/${workspaces[0].slug}/dashboard`);
  }

  const stepParam = typeof resolvedSearchParams?.step === "string" ? resolvedSearchParams.step : null;
  const workspaceParam =
    typeof resolvedSearchParams?.workspace === "string" ? resolvedSearchParams.workspace : null;

  const step =
    stepParam === "invites" && workspaceParam ? "invites" : "create";
  const errorParam =
    typeof resolvedSearchParams?.error === "string" ? resolvedSearchParams.error : null;
  const slugParam =
    typeof resolvedSearchParams?.slug === "string" ? resolvedSearchParams.slug : null;

  return (
    <div className="min-h-screen bg-gigaviz-bg text-gigaviz-cream">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
        <div>
          <h1 className="text-2xl font-semibold">Workspace onboarding</h1>
          <p className="text-sm text-gigaviz-muted">
            Create your workspace and invite teammates if needed.
          </p>
        </div>
        <OnboardingForm
          step={step}
          workspaceSlug={workspaceParam}
          initialSlug={slugParam}
          error={errorParam}
          actionCreate={createWorkspace}
          actionInvite={createInvites}
        />
      </div>
    </div>
  );
}



