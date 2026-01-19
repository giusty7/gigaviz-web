import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OwnerWorkspaceRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/ops/workspaces/${id}`);
}
