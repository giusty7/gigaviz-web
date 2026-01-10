import { redirect } from "next/navigation";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";
import { WhatsappInboxClient } from "@/components/meta-hub/WhatsappInboxClient";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { processWhatsappEvents } from "@/lib/meta/wa-inbox";
import Link from "next/link";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function WhatsappInboxPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/app/onboarding");

  // Process latest events best-effort on page load
  await processWhatsappEvents(ctx.currentWorkspace.id, 10);

  const supabase = await supabaseServer();
  const workspaceId = ctx.currentWorkspace.id;
  const canEdit = ["owner", "admin", "member"].includes(ctx.currentRole ?? "");

  const { data: rawThreads } = await supabase
    .from("wa_threads")
    .select(
      "id, phone_number_id, contact_wa_id, contact_name, last_message_preview, last_message_at, status, unread_count, assigned_to"
    )
    .eq("workspace_id", workspaceId)
    .order("last_message_at", { ascending: false })
    .limit(30);

  type RawThread = {
    id: string;
    phone_number_id: string | null;
    contact_wa_id: string | null;
    contact_name: string | null;
    status: string | null;
    unread_count: number | null;
    assigned_to: string | null;
    last_message_at: string | null;
    last_message_preview: string | null;
  };

  const threads =
    rawThreads?.map((t) => {
      const raw = t as RawThread;
      return {
        id: raw.id,
        external_thread_id: raw.contact_wa_id,
        status: raw.status ?? "open",
        unread_count: raw.unread_count ?? 0,
        assigned_to: raw.assigned_to ?? null,
        last_message_at: raw.last_message_at,
        last_inbound_at: raw.last_message_at,
        contact: raw.contact_wa_id
          ? { id: raw.contact_wa_id, display_name: raw.contact_name, phone: raw.contact_wa_id }
          : null,
        last_message_preview: raw.last_message_preview ?? null,
      };
    }) ?? [];

  const firstThread = threads?.[0];

  const { data: messages } = firstThread
    ? await supabase
        .from("wa_messages")
        .select("id, direction, content_json, status, created_at, received_at, wa_message_id")
        .eq("workspace_id", workspaceId)
        .eq("thread_id", firstThread.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  const { data: tags } = firstThread
    ? await supabase
        .from("wa_thread_tags")
        .select("tag")
        .eq("workspace_id", workspaceId)
        .eq("thread_id", firstThread.id)
    : { data: [] };

  const { data: notes } = firstThread
    ? await supabase
        .from("wa_thread_notes")
        .select("id, author_id, body, created_at")
        .eq("workspace_id", workspaceId)
        .eq("thread_id", firstThread.id)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] };

  const { data: templateOptions } = await supabase
    .from("wa_templates")
    .select("name, language, status")
    .eq("workspace_id", workspaceId)
    .eq("status", "APPROVED")
    .order("name");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">WhatsApp Inbox</h2>
          <p className="text-sm text-muted-foreground">
            Lihat percakapan, tandai status, catat notes, dan balas dengan template yang disetujui.
          </p>
        </div>
        <MetaHubBadge status="live" />
      </div>

      <div className="flex gap-2 rounded-xl border border-border bg-card p-2 text-sm">
        <Link
          href={`/app/${workspaceSlug}/meta-hub/messaging/whatsapp`}
          className="rounded-lg px-3 py-2 font-semibold text-muted-foreground hover:bg-gigaviz-surface"
        >
          Templates
        </Link>
        <Link
          href={`/app/${workspaceSlug}/meta-hub/messaging/whatsapp/inbox`}
          className="rounded-lg px-3 py-2 font-semibold text-foreground hover:bg-gigaviz-surface"
        >
          Inbox
        </Link>
      </div>

      <WhatsappInboxClient
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        userId={ctx.user.id}
        canEdit={canEdit}
        threads={threads ?? []}
        initialMessages={messages ?? []}
        initialTags={tags?.map((t) => t.tag) ?? []}
        initialNotes={notes ?? []}
        templates={
          templateOptions?.map((t) => ({
            name: t.name as string,
            language: (t.language as string | null) ?? "id",
          })) ?? []
        }
      />
    </div>
  );
}
