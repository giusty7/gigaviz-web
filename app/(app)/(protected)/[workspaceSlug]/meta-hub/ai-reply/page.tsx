import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getAppContext } from "@/lib/app-context";
import { AIReplySettingsClient } from "@/components/meta-hub/AIReplySettingsClient";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { workspaceSlug } = await params;
  return {
    title: `AI Auto-Reply | Meta Hub | ${workspaceSlug}`,
    description: "Configure AI-powered automatic replies for WhatsApp",
  };
}

export default async function AIReplySettingsPage({ params }: Props) {
  const { workspaceSlug } = await params;

  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspaceId = ctx.currentWorkspace.id;
  const canEdit = ["owner", "admin"].includes(ctx.currentRole ?? "");

  if (!canEdit) {
    redirect(`/${workspaceSlug}/meta-hub`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050a18] via-[#0a1229] to-[#050a18] p-6">
      <div className="max-w-4xl mx-auto">
        <AIReplySettingsClient
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
        />
      </div>
    </div>
  );
}
