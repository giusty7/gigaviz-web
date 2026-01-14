import type { ReactNode } from "react";
import { getMetaHubFlags } from "@/lib/meta-hub/config";
import { MetaHubNav } from "@/components/meta-hub/MetaHubNav";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ workspaceSlug: string }>;
};

export default async function MetaHubLayout({ children, params }: LayoutProps) {
  const { workspaceSlug } = await params;
  const flags = getMetaHubFlags();
  const basePath = `/${workspaceSlug}/meta-hub`;

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Meta Hub</p>
          <h1 className="text-lg font-semibold text-foreground">Meta Integration</h1>
        </div>
        <MetaHubNav basePath={basePath} flags={flags} />
      </aside>
      <section className="space-y-4">{children}</section>
    </div>
  );
}

