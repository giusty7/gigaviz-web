import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserWorkspaces } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

export default async function DashboardEntryPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const lastSlug =
    cookieStore.get("gv_last_ws")?.value ??
    cookieStore.get("gv_workspace_slug")?.value ??
    null;

  const workspaces = await getUserWorkspaces(data.user.id);

  if (!workspaces.length) {
    redirect("/onboarding");
  }

  const target =
    (lastSlug && workspaces.find((ws) => ws.slug === lastSlug)) ||
    workspaces[0];

  redirect(`/${target.slug}/dashboard`);
}


