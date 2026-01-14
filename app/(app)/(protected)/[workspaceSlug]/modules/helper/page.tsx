import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function LegacyHelperPage({ params }: Props) {
  const { workspaceSlug } = await params;
  redirect(`/${workspaceSlug}/helper`);
}
