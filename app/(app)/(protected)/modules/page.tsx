import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";

export const dynamic = "force-dynamic";

export default async function ModulesRedirectPage() {
  const ctx = await getAppContext();
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/app/onboarding");

  redirect(`/app/${ctx.currentWorkspace.slug}/modules`);
}
