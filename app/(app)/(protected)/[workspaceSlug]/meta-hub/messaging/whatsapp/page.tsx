import { redirect } from "next/navigation";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";
import { WhatsappTemplatesClient } from "@/components/meta-hub/WhatsappTemplatesClient";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function MetaHubWhatsappPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/app/onboarding");

  const workspaceId = ctx.currentWorkspace.id;
  const canEdit = ["owner", "admin"].includes(ctx.currentRole ?? "");
  const supabase = await supabaseServer();
  const { data: settings } = await supabase
    .from("wa_settings")
    .select("sandbox_enabled, test_whitelist")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">WhatsApp Hub</h2>
          <p className="text-sm text-muted-foreground">
            Kelola template, sandbox whitelist, dan kirim pesan tes secara aman.
          </p>
        </div>
        <MetaHubBadge status="live" />
      </div>

      <div className="flex gap-2 rounded-xl border border-border bg-card p-2 text-sm">
        <Link
          href={`/app/${workspaceSlug}/meta-hub/messaging/whatsapp`}
          className="rounded-lg px-3 py-2 font-semibold text-foreground hover:bg-gigaviz-surface"
        >
          Templates
        </Link>
        <Link
          href={`/app/${workspaceSlug}/meta-hub/messaging/whatsapp/inbox`}
          className="rounded-lg px-3 py-2 font-semibold text-muted-foreground hover:bg-gigaviz-surface"
        >
          Inbox
        </Link>
      </div>

      <WhatsappTemplatesClient
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        canEdit={canEdit}
        templates={[]}
        sandboxEnabled={settings?.sandbox_enabled ?? true}
        whitelist={Array.isArray(settings?.test_whitelist) ? settings?.test_whitelist : []}
      />
    </div>
  );
}
