import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function GraphLegacyRedirect({ params }: Props) {
  const { workspaceSlug } = await params;
  redirect(`/${workspaceSlug}/modules/studio/graph`);
}
