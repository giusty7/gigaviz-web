import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OwnerWorkspacesRedirect({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const query = (sp.q ?? "").trim();
  const q = query ? `?q=${encodeURIComponent(query)}` : "";
  redirect(`/ops/workspaces${q}`);
}
