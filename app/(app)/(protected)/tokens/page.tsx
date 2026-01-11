import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";

export const dynamic = "force-dynamic";

export default async function TokensRedirectPage() {
  const ctx = await getAppContext();
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  redirect(`/${ctx.currentWorkspace.slug}/tokens`);
}


