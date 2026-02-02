import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

/**
 * Legacy route: /[workspaceSlug]/meta-hub/inbox
 * Redirects to the unified inbox at /[workspaceSlug]/inbox
 * 
 * This ensures backward compatibility for:
 * - Existing bookmarks
 * - Shared links
 * - Meta Hub internal navigation
 */
export default async function LegacyInboxRedirect({ params }: Props) {
  const { workspaceSlug } = await params;
  redirect(`/${workspaceSlug}/inbox`);
}
