import { redirect } from "next/navigation";
import { WhatsappInboxClient } from "@/components/meta-hub/WhatsappInboxClient";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { processWhatsappEvents } from "@/lib/meta/wa-inbox";
import { getWorkspacePlan } from "@/lib/plans";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function WhatsappInboxPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  // Process latest events best-effort on page load
  await processWhatsappEvents(ctx.currentWorkspace.id, 10);

  const supabase = await supabaseServer();
  const workspaceId = ctx.currentWorkspace.id;
  const canEdit = ["owner", "admin", "member"].includes(ctx.currentRole ?? "");
  const planInfo = await getWorkspacePlan(workspaceId);
  const allowWrite = planInfo.planId !== "free_locked" || Boolean(planInfo.devOverride);

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
        .select(
          "id, direction, status, created_at, wa_message_id, msg_type, text_body, wa_timestamp, payload_json"
        )
        .eq("workspace_id", workspaceId)
        .eq("thread_id", firstThread.id)
        .order("wa_timestamp", { ascending: true })
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


  return (
    <WhatsappInboxClient
      workspaceId={workspaceId}
      workspaceSlug={workspaceSlug}
      userId={ctx.user.id}
      canEdit={canEdit}
      allowWrite={allowWrite}
      isPreview={!allowWrite}
      threads={threads ?? []}
      initialMessages={
        messages?.map((m) => ({
          ...m,
          payload_json: m.payload_json ?? {},
          content_json: m.payload_json ?? {},
        })) ?? []
      }
      initialTags={tags?.map((t) => t.tag) ?? []}
      initialNotes={notes ?? []}
      templates={[]}
    />
  );
}

