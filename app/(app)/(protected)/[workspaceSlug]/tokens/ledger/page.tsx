import { redirect } from "next/navigation";
import { TokenLedgerClient } from "@/components/tokens/token-ledger-client";
import { getAppContext } from "@/lib/app-context";

export const dynamic = "force-dynamic";

type LedgerPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function TokensLedgerPage({ params }: LedgerPageProps) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  return <TokenLedgerClient workspaceId={ctx.currentWorkspace.id} />;
}
