import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function TracksLegacyRedirect({ params }: Props) {
  const { workspaceSlug } = await params;
  redirect(`/${workspaceSlug}/modules/studio/tracks`);
}
