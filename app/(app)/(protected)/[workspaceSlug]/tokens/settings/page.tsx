import { redirect } from "next/navigation";
import { TokenSettingsClient } from "@/components/tokens/token-settings-client";
import { getAppContext } from "@/lib/app-context";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function TokensSettingsPage({ params }: SettingsPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const canEdit = ctx.currentRole === "owner" || ctx.currentRole === "admin";

  return <TokenSettingsClient workspaceId={ctx.currentWorkspace.id} canEdit={canEdit} />;
}
