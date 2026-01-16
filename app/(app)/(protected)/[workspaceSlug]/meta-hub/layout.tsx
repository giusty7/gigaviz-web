import type { ReactNode } from "react";
import { getMetaHubFlags } from "@/lib/meta-hub/config";
import { ImperiumMetaHubLayout } from "@/components/meta-hub/ImperiumMetaHubLayout";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ workspaceSlug: string }>;
};

export default async function MetaHubLayout({ children, params }: LayoutProps) {
  const { workspaceSlug } = await params;
  const flags = getMetaHubFlags();
  const basePath = `/${workspaceSlug}/meta-hub`;

  return (
    <ImperiumMetaHubLayout basePath={basePath} flags={flags}>
      {children}
    </ImperiumMetaHubLayout>
  );
}

