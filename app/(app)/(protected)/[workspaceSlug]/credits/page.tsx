import { redirect } from "next/navigation";

export default async function CreditsRedirect({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  redirect(`/${workspaceSlug}/tokens`);
}
