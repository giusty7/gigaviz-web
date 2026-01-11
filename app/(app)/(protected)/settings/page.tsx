import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SettingsRedirectPage() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("gv_workspace_slug")?.value;
  if (slug) {
    redirect(`/${slug}/settings`);
  }
  redirect("/onboarding");
}


