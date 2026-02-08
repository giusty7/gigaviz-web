import { redirect } from "next/navigation";
import { OpsShell } from "@/components/platform/OpsShell";
import { PlatformKnowledgeClient } from "@/components/ops/PlatformKnowledgeClient";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Platform Knowledge Base | OPS",
  description: "Manage Gigaviz platform documentation for AI assistant",
};

export default async function PlatformKnowledgePage() {
  assertOpsEnabled();

  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");

  // Load existing platform knowledge sources
  const db = supabaseAdmin();
  const { data: sources } = await db
    .from("platform_knowledge_sources")
    .select("id, source_type, title, content_text, url, metadata, status, indexed_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  // Get stats
  const { count: totalSources } = await db
    .from("platform_knowledge_sources")
    .select("id", { count: "exact", head: true });

  const { count: indexedCount } = await db
    .from("platform_knowledge_sources")
    .select("id", { count: "exact", head: true })
    .eq("status", "indexed");

  const { count: totalChunks } = await db
    .from("platform_knowledge_chunks")
    .select("id", { count: "exact", head: true });

  return (
    <OpsShell actorEmail={admin.actorEmail} actorRole={admin.actorRole}>
      <PlatformKnowledgeClient
        initialSources={sources ?? []}
        stats={{
          totalSources: totalSources ?? 0,
          indexedSources: indexedCount ?? 0,
          totalChunks: totalChunks ?? 0,
        }}
      />
    </OpsShell>
  );
}
