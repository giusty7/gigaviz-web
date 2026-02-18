import { redirect } from "next/navigation";
import { UnifiedInboxClient } from "@/components/meta-hub/UnifiedInboxClient";
import { getAppContext } from "@/lib/app-context";
import { ensureWorkspaceCookie } from "@/lib/workspaces";
import { PageHeader } from "@/components/ui/page-header";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inbox | Gigaviz",
  description: "Unified inbox for all your conversations across WhatsApp, Instagram, and Messenger",
};

export default async function InboxPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspace = ctx.currentWorkspace;
  if (workspace.slug !== workspaceSlug) {
    redirect(`/${workspace.slug}/inbox`);
  }

  await ensureWorkspaceCookie(workspace.id);

  const t = await getTranslations("inbox");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("pageDescription")}
      />
      <UnifiedInboxClient
        workspaceId={workspace.id}
        workspaceSlug={workspace.slug}
      />
    </div>
  );
}
