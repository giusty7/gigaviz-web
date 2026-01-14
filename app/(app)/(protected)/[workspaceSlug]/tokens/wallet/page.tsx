import { redirect } from "next/navigation";
import { TokenWalletClient } from "@/components/tokens/token-wallet-client";
import { getAppContext } from "@/lib/app-context";

export const dynamic = "force-dynamic";

type WalletPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function TokensWalletPage({ params }: WalletPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const canActivate = ctx.currentRole === "owner" || ctx.currentRole === "admin";

  return (
    <TokenWalletClient
      workspaceId={ctx.currentWorkspace.id}
      canActivate={canActivate}
    />
  );
}
