import { redirect } from "next/navigation";
import { UnifiedInboxClient } from "@/components/meta-hub/UnifiedInboxClient";
import { getAppContext } from "@/lib/app-context";
import { ensureWorkspaceCookie } from "@/lib/workspaces";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#f9d976]">Inbox</h1>
        <p className="text-[#f5f5dc]/70 mt-2">
          Manage all your conversations across WhatsApp, Instagram, and Messenger in one place
        </p>
      </div>
      <UnifiedInboxClient
        workspaceId={workspace.id}
        workspaceSlug={workspace.slug}
      />
    </div>
  );
}
