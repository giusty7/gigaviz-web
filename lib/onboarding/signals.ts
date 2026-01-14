import { supabaseAdmin } from "@/lib/supabase/admin";

export type OnboardingSignals = {
  workspaceReady: boolean;
  memberCount: number;
  membersInvited: boolean;
  waConnected: boolean;
  waPhoneNumberId: string | null;
  templatesSynced: boolean;
  templatesCount: number;
  lastSyncAt: string | null;
  inboxReady: boolean;
  threadsCount: number;
  lastEventAt: string | null;
};

/**
 * Fetch onboarding signals for a workspace (server-side).
 * These are used to determine wizard step completion.
 */
export async function getOnboardingSignals(workspaceId: string): Promise<OnboardingSignals> {
  const db = supabaseAdmin();

  // 1. Workspace ready (always true if we got here)
  const workspaceReady = true;

  // 2. Member count
  const { count: memberCount } = await db
    .from("workspace_members")
    .select("user_id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  const membersInvited = (memberCount ?? 0) >= 2;

  // 3. WhatsApp connection
  const { data: waConnection } = await db
    .from("wa_phone_numbers")
    .select("id, phone_number_id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const waPhoneNumberId = waConnection?.phone_number_id ?? null;

  // Check token
  let hasToken = false;
  if (waPhoneNumberId) {
    const { data: token } = await db
      .from("meta_tokens")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("provider", "meta_whatsapp")
      .limit(1)
      .maybeSingle();
    hasToken = !!token?.id;
  }

  const waConnected = !!waPhoneNumberId && hasToken;

  // 4. Templates synced
  const { count: templatesCount } = await db
    .from("wa_templates")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  const { data: lastSync } = await db
    .from("wa_templates")
    .select("synced_at")
    .eq("workspace_id", workspaceId)
    .order("synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastSyncAt = lastSync?.synced_at ?? null;
  const templatesSynced = (templatesCount ?? 0) > 0 && !!lastSyncAt;

  // 5. Inbox ready (threads exist OR recent webhook event)
  const { count: threadsCount } = await db
    .from("wa_threads")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: lastEvent } = await db
    .from("meta_webhook_events")
    .select("received_at")
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .order("received_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastEventAt = lastEvent?.received_at ?? null;
  const hasRecentEvent = lastEventAt ? new Date(lastEventAt) >= new Date(dayAgo) : false;
  const inboxReady = (threadsCount ?? 0) > 0 || hasRecentEvent;

  return {
    workspaceReady,
    memberCount: memberCount ?? 0,
    membersInvited,
    waConnected,
    waPhoneNumberId,
    templatesSynced,
    templatesCount: templatesCount ?? 0,
    lastSyncAt,
    inboxReady,
    threadsCount: threadsCount ?? 0,
    lastEventAt,
  };
}

export type OnboardingStep = {
  id: string;
  label: string;
  helper: string;
  done: boolean;
  href: string;
};

export function buildOnboardingSteps(
  signals: OnboardingSignals,
  workspaceSlug: string
): OnboardingStep[] {
  return [
    {
      id: "workspace",
      label: "Workspace ready",
      helper: "Your workspace is set up and active.",
      done: signals.workspaceReady,
      href: `/${workspaceSlug}/platform`,
    },
    {
      id: "members",
      label: "Invite members",
      helper: signals.membersInvited
        ? `${signals.memberCount} members joined.`
        : "Add teammates to collaborate.",
      done: signals.membersInvited,
      href: `/${workspaceSlug}/platform/roles`,
    },
    {
      id: "connect",
      label: "Connect WhatsApp",
      helper: signals.waConnected
        ? `Phone ${signals.waPhoneNumberId?.slice(-4) ?? ""} connected.`
        : "Link your WhatsApp Business number.",
      done: signals.waConnected,
      href: `/${workspaceSlug}/meta-hub/connections`,
    },
    {
      id: "templates",
      label: "Sync templates",
      helper: signals.templatesSynced
        ? `${signals.templatesCount} templates synced.`
        : "Import approved templates from Meta.",
      done: signals.templatesSynced,
      href: `/${workspaceSlug}/meta-hub/messaging/whatsapp`,
    },
    {
      id: "inbox",
      label: "Process events & open Inbox",
      helper: signals.inboxReady
        ? `${signals.threadsCount} threads ready.`
        : "Receive webhook events and reply.",
      done: signals.inboxReady,
      href: `/${workspaceSlug}/meta-hub/messaging/whatsapp/inbox`,
    },
  ];
}

export function getOnboardingProgress(steps: OnboardingStep[]): number {
  const doneCount = steps.filter((s) => s.done).length;
  return Math.round((doneCount / steps.length) * 100);
}

export function getNextIncompleteStep(steps: OnboardingStep[]): OnboardingStep | null {
  return steps.find((s) => !s.done) ?? null;
}
