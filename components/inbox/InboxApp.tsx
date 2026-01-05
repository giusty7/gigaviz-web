"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TicketStatus = "open" | "pending" | "solved" | "spam";
type Priority = "low" | "med" | "high" | "urgent";
type Direction = "in" | "out";
type AttachmentKind = "image" | "video" | "audio" | "document";

type Contact = {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  last_seen_at: string | null;
  comms_status?: "normal" | "blacklisted" | "whitelisted";
};

type ConversationRow = {
  id: string;
  contact_id: string;
  assigned_to: string | null;
  assigned_member_id?: string | null;
  team_id?: string | null;
  category_id?: string | null;
  takeover_by_member_id?: string | null;
  takeover_prev_assigned_member_id?: string | null;
  takeover_at?: string | null;
  first_response_at?: string | null;
  ticket_status: TicketStatus;
  priority: Priority;
  unread_count: number;
  last_message_at: string;
  next_response_due_at?: string | null;
  resolution_due_at?: string | null;
  sla_status?: "ok" | "due_soon" | "breached" | null;
  last_customer_message_at?: string | null;
  contact: Contact;
  is_archived?: boolean;
  pinned?: boolean;
  snoozed_until?: string | null;
  last_read_at?: string | null;
};

type MessageRow = {
  id: string;
  conversationId?: string;
  direction: Direction;
  text: string;
  ts: string;
  status: string | null;
  waMessageId?: string | null;
  errorReason?: string | null;
  mediaUrl?: string | null;
  mediaMime?: string | null;
  mediaSha256?: string | null;
  attachments?: AttachmentRow[] | null;
};

type AttachmentRow = {
  id: string;
  kind: AttachmentKind;
  mimeType?: string | null;
  fileName?: string | null;
  sizeBytes?: number | null;
  url?: string | null;
  thumbUrl?: string | null;
  requiresSign?: boolean;
  hasThumb?: boolean;
};

type NoteRow = {
  id: string;
  conversation_id: string;
  text: string;
  ts: string;
  author: string;
};

type EscalationRow = {
  id: string;
  conversationId: string;
  breachType: "next_response" | "resolution";
  dueAt: string;
  reason: string;
  createdAt: string;
  createdBy: string;
};

type TeamRow = {
  id: string;
  name: string;
  is_default?: boolean;
};

type RoutingCategory = {
  id: string;
  key: string;
  label: string;
};

type CrmFieldType = "text" | "number" | "bool" | "date" | "select";

type CrmField = {
  id: string;
  key: string;
  label: string;
  type: CrmFieldType;
  options?: { choices?: string[] } | null;
  is_required?: boolean | null;
};

type CrmFieldValue = {
  field_id: string;
  value_text: string | null;
  value_json: unknown | null;
  updated_at?: string | null;
};

type Props = { selectedId?: string };

type ThreadPatchPayload = {
  ticket_status?: TicketStatus;
  priority?: Priority;
  assigned_to?: string | null;
  unread_count?: number;
  last_read_at?: string | null;
  pinned?: boolean;
  is_archived?: boolean;
  snoozed_until?: string | null;
};

type ThreadListResponse = {
  items?: ConversationRow[];
  error?: string;
};

type ThreadDetailResponse = {
  messages?: MessageRow[];
  notes?: NoteRow[];
  escalations?: EscalationRow[];
  thread?: {
    teamName?: string;
    assignedMemberUserId?: string;
    assignedTo?: string;
    assignedMemberId?: string;
    teamId?: string;
    categoryId?: string;
    takeoverByMemberId?: string;
    takeoverPrevAssignedMemberId?: string;
    takeoverAt?: string;
    takeoverByUserId?: string;
    firstResponseAt?: string;
  };
  skillRoutingEnabled?: boolean;
  supervisorTakeoverEnabled?: boolean;
  memberRole?: string;
  error?: string;
};

type SendResponse = {
  message?: MessageRow;
  error?: string;
};

type NoteResponse = {
  note?: NoteRow;
  error?: string;
};

type CrmFieldsResponse = {
  fields?: CrmField[];
  values?: CrmFieldValue[];
  error?: string;
};

type CrmSaveResponse = {
  values?: CrmFieldValue[];
  error?: string;
};

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function formatBytes(size?: number | null) {
  if (size === null || size === undefined) return "-";
  if (size < 1024) return `${size} B`;
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

function kindFromMime(mime?: string | null): AttachmentKind {
  if (!mime) return "document";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}

function fmtTime(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function badgeColor(x: string) {
  if (x === "open") return "border-emerald-500/30 text-emerald-300 bg-emerald-500/10";
  if (x === "pending") return "border-amber-500/30 text-amber-300 bg-amber-500/10";
  if (x === "solved") return "border-sky-500/30 text-sky-300 bg-sky-500/10";
  if (x === "spam") return "border-rose-500/30 text-rose-300 bg-rose-500/10";

  if (x === "low") return "border-slate-700 text-slate-300 bg-slate-900/30";
  if (x === "med") return "border-sky-500/30 text-sky-300 bg-sky-500/10";
  if (x === "high") return "border-amber-500/30 text-amber-300 bg-amber-500/10";
  if (x === "urgent") return "border-rose-500/30 text-rose-300 bg-rose-500/10";

  return "border-slate-800 text-slate-300 bg-slate-950/40";
}

function slaBadgeColor(x?: string | null) {
  if (x === "breached") return "border-rose-500/40 text-rose-200 bg-rose-500/10";
  if (x === "due_soon") return "border-amber-500/40 text-amber-200 bg-amber-500/10";
  if (x === "ok") return "border-emerald-500/30 text-emerald-200 bg-emerald-500/10";
  return "border-slate-800 text-slate-300 bg-slate-950/40";
}

function commsBadgeColor(x?: string | null) {
  if (x === "blacklisted") return "border-rose-500/40 text-rose-200 bg-rose-500/10";
  if (x === "whitelisted") return "border-emerald-500/30 text-emerald-200 bg-emerald-500/10";
  return "border-slate-800 text-slate-300 bg-slate-950/40";
}

function shortId(value?: string | null) {
  if (!value) return "-";
  if (value.length <= 10) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function fieldChoices(field: CrmField) {
  const raw = field.options;
  if (!raw || typeof raw !== "object") return [] as string[];
  const choices = (raw as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return [] as string[];
  return choices.filter((c): c is string => typeof c === "string");
}

export default function InboxApp({ selectedId }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("all");
  const [filterAssignee, setFilterAssignee] = useState<string | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [filterTag, setFilterTag] = useState("");
  const [filterArchived, setFilterArchived] = useState<"active" | "archived" | "all">("active");
  const [filterPinned, setFilterPinned] = useState<"all" | "pinned">("all");

  // data
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [escalations, setEscalations] = useState<EscalationRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [categories, setCategories] = useState<RoutingCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [transferTeamId, setTransferTeamId] = useState<string>("");
  const [assignedMemberUserId, setAssignedMemberUserId] = useState<string | null>(null);
  const [takeoverByUserId, setTakeoverByUserId] = useState<string | null>(null);
  const [activeTeamName, setActiveTeamName] = useState<string | null>(null);
  const [skillRoutingEnabled, setSkillRoutingEnabled] = useState(false);
  const [supervisorTakeoverEnabled, setSupervisorTakeoverEnabled] = useState(false);
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [crmFields, setCrmFields] = useState<CrmField[]>([]);
  const [crmValues, setCrmValues] = useState<
    Record<string, { valueText: string | null; valueJson: unknown | null }>
  >({});
  const [crmLoading, setCrmLoading] = useState(false);
  const [crmSaving, setCrmSaving] = useState(false);
  const [crmError, setCrmError] = useState<string | null>(null);
  const [crmDirty, setCrmDirty] = useState(false);
  const [commsSaving, setCommsSaving] = useState(false);
  const [commsError, setCommsError] = useState<string | null>(null);
  const [attachmentUrls, setAttachmentUrls] = useState<
    Record<string, { url?: string; thumbUrl?: string }>
  >({});
  const [attachmentStatus, setAttachmentStatus] = useState<
    Record<string, "idle" | "loading" | "error">
  >({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // load list (server-side filters)
  useEffect(() => {
    let dead = false;
    const timer = setTimeout(() => {
      async function run() {
        setLoading(true);
        setError(null);
        try {
          const params = new URLSearchParams();
          if (q.trim()) params.set("q", q.trim());
          if (filterStatus !== "all") params.set("status", filterStatus);
          if (filterAssignee !== "all") {
            params.set("agent", filterAssignee || "unassigned");
          }
          if (filterPriority !== "all") params.set("priority", filterPriority);
          if (filterTag.trim()) params.set("tag", filterTag.trim());
          if (filterArchived === "archived") params.set("archived", "true");
          if (filterArchived === "active") params.set("archived", "false");
          if (filterPinned === "pinned") params.set("pinned", "true");

          const query = params.toString();
          const res = await fetch(`/api/admin/inbox/threads${query ? `?${query}` : ""}`, {
            cache: "no-store",
          });
          const js = (await res.json().catch(() => ({}))) as ThreadListResponse;
          if (!res.ok) {
            const errMsg = typeof js.error === "string" ? js.error : "Gagal load threads";
            throw new Error(errMsg);
          }
          if (!dead) setConversations(js.items ?? []);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Error";
          if (!dead) setError(msg);
        } finally {
          if (!dead) setLoading(false);
        }
      }
      run();
    }, 250);

    return () => {
      dead = true;
      clearTimeout(timer);
    };
  }, [
    q,
    filterStatus,
    filterAssignee,
    filterPriority,
    filterTag,
    filterArchived,
    filterPinned,
  ]);

  useEffect(() => {
    let dead = false;
    async function loadTeams() {
      try {
        const res = await fetch("/api/admin/teams", { cache: "no-store" });
        const js = (await res.json().catch(() => ({}))) as { teams?: TeamRow[] };
        if (!res.ok) return;
        if (!dead) setTeams(js.teams ?? []);
      } catch {
        // ignore
      }
    }
    loadTeams();
    return () => {
      dead = true;
    };
  }, []);

  useEffect(() => {
    let dead = false;
    async function loadCategories() {
      if (!skillRoutingEnabled) {
        setCategories([]);
        setCategoriesError(null);
        return;
      }
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const res = await fetch("/api/admin/routing/categories", { cache: "no-store" });
        const js = (await res.json().catch(() => ({}))) as {
          categories?: RoutingCategory[];
          error?: string;
        };
        if (!res.ok) {
          const errMsg = typeof js.error === "string" ? js.error : "Gagal load kategori";
          throw new Error(errMsg);
        }
        if (!dead) setCategories(js.categories ?? []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error";
        if (!dead) setCategoriesError(msg);
      } finally {
        if (!dead) setCategoriesLoading(false);
      }
    }
    loadCategories();
    return () => {
      dead = true;
    };
  }, [skillRoutingEnabled]);


  const convById = useMemo(
    () => Object.fromEntries(conversations.map((c) => [c.id, c])),
    [conversations]
  );

  const agents = useMemo(() => {
    const s = new Set<string>();
    conversations.forEach((c) => {
      if (c.assigned_to) s.add(c.assigned_to);
    });
    // kalau kosong, tetap ada opsi umum
    return Array.from(s).sort();
  }, [conversations]);

  const filtered = useMemo(() => {
    return conversations
      .slice()
      .sort((a, b) => {
        const ap = a.pinned ? 1 : 0;
        const bp = b.pinned ? 1 : 0;
        if (ap !== bp) return bp - ap;
        return a.last_message_at < b.last_message_at ? 1 : -1;
      });
  }, [conversations]);

  const activeId = useMemo(() => {
    if (selectedId && convById[selectedId]) return selectedId;
    return filtered[0]?.id ?? conversations[0]?.id ?? null;
  }, [selectedId, convById, filtered, conversations]);

  const activeConv = activeId ? convById[activeId] : null;
  const activeContact = activeConv?.contact ?? null;
  const crmDisabled = crmLoading || crmSaving;
  const patchConv = useCallback((id: string, patch: Partial<ConversationRow>) => {
    setConversations((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    setTransferTeamId(activeConv.team_id ?? "");
  }, [activeConv]);

  useEffect(() => {
    let dead = false;
    async function loadCrmFields() {
      if (!activeContact?.id) {
        setCrmFields([]);
        setCrmValues({});
        setCrmError(null);
        setCrmDirty(false);
        return;
      }
      setCrmLoading(true);
      setCrmError(null);
      try {
        const res = await fetch(
          `/api/admin/crm/contacts/${activeContact.id}/fields`,
          { cache: "no-store" }
        );
        const js = (await res.json().catch(() => ({}))) as CrmFieldsResponse;
        if (!res.ok) {
          const errMsg =
            typeof js.error === "string" ? js.error : "Gagal load custom fields";
          throw new Error(errMsg);
        }
        if (dead) return;
        const valuesMap: Record<string, { valueText: string | null; valueJson: unknown | null }> =
          {};
        (js.values ?? []).forEach((val) => {
          valuesMap[val.field_id] = {
            valueText: val.value_text ?? null,
            valueJson: val.value_json ?? null,
          };
        });
        setCrmFields(js.fields ?? []);
        setCrmValues(valuesMap);
        setCrmDirty(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error";
        if (!dead) setCrmError(msg);
      } finally {
        if (!dead) setCrmLoading(false);
      }
    }
    loadCrmFields();
    return () => {
      dead = true;
    };
  }, [activeContact?.id]);

  const slaSummary = useMemo(() => {
    const dueAt = activeConv?.next_response_due_at;
    if (!dueAt) {
      return { label: "SLA not set", status: null };
    }
    const dueMs = new Date(dueAt).getTime();
    if (Number.isNaN(dueMs)) {
      return { label: "SLA not set", status: null };
    }
    const diffMs = dueMs - now;
    const minutes = Math.max(0, Math.ceil(Math.abs(diffMs) / 60_000));
    if (diffMs < 0) {
      return { label: `Breached ${minutes}m ago`, status: activeConv?.sla_status ?? "breached" };
    }
    return {
      label: `Next response due in ${minutes}m`,
      status: activeConv?.sla_status ?? "ok",
    };
  }, [activeConv, now]);

  const firstResponseLabel = useMemo(() => {
    const firstResponseAt = activeConv?.first_response_at;
    if (!firstResponseAt) return "First response: -";
    const diffMs = now - new Date(firstResponseAt).getTime();
    if (Number.isNaN(diffMs)) return "First response: -";
    const minutes = Math.max(0, Math.round(diffMs / 60_000));
    return `First response: ${minutes}m ago`;
  }, [activeConv?.first_response_at, now]);

  useEffect(() => {
    if (!activeId || !activeConv) return;
    if (activeConv.unread_count === 0 && activeConv.last_read_at) return;
    const nowIso = new Date().toISOString();
    patchConv(activeId, { unread_count: 0, last_read_at: nowIso });
    updateThread(activeId, { unread_count: 0, last_read_at: nowIso }).catch(() => {});
  }, [activeId, activeConv, patchConv]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const fetchThreadDetail = useCallback(
    async (conversationId: string, showLoading = false) => {
      if (!conversationId) return;
      if (showLoading) setLoadingThread(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/inbox/threads/${conversationId}`, {
          cache: "no-store",
        });
        const js = (await res.json().catch(() => ({}))) as ThreadDetailResponse;
        if (!res.ok) {
          const errMsg = typeof js.error === "string" ? js.error : "Gagal load thread";
          throw new Error(errMsg);
        }
        setMessages(js.messages ?? []);
        setNotes(js.notes ?? []);
        setEscalations(js.escalations ?? []);
        setAssignedMemberUserId(js.thread?.assignedMemberUserId ?? null);
        setTakeoverByUserId(js.thread?.takeoverByUserId ?? null);
        setActiveTeamName(js.thread?.teamName ?? null);
        if (
          js.thread?.assignedTo !== undefined ||
          js.thread?.teamId !== undefined ||
          js.thread?.categoryId !== undefined ||
          js.thread?.takeoverByMemberId !== undefined ||
          js.thread?.takeoverPrevAssignedMemberId !== undefined ||
          js.thread?.takeoverAt !== undefined ||
          js.thread?.firstResponseAt !== undefined
        ) {
          patchConv(conversationId, {
            assigned_to: js.thread?.assignedTo ?? null,
            assigned_member_id: js.thread?.assignedMemberId ?? null,
            team_id: js.thread?.teamId ?? null,
            category_id: js.thread?.categoryId ?? null,
            takeover_by_member_id: js.thread?.takeoverByMemberId ?? null,
            takeover_prev_assigned_member_id:
              js.thread?.takeoverPrevAssignedMemberId ?? null,
            takeover_at: js.thread?.takeoverAt ?? null,
            first_response_at: js.thread?.firstResponseAt ?? null,
          });
        }
        if (js.skillRoutingEnabled !== undefined) {
          setSkillRoutingEnabled(js.skillRoutingEnabled);
        }
        if (js.supervisorTakeoverEnabled !== undefined) {
          setSupervisorTakeoverEnabled(js.supervisorTakeoverEnabled);
        }
        if (js.memberRole !== undefined) {
          setMemberRole(js.memberRole ?? null);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error";
        setError(msg);
      } finally {
        if (showLoading) setLoadingThread(false);
      }
    },
    [patchConv]
  );

  // load thread detail + lightweight polling
  useEffect(() => {
    let dead = false;
    const interval = setInterval(() => {
      if (!activeId || dead) return;
      fetchThreadDetail(activeId).catch(() => {});
    }, 6000);

    let initial = true;
    async function runOnce() {
      if (!activeId) return;
      await fetchThreadDetail(activeId, initial);
      initial = false;
    }

    runOnce().catch(() => {});

    return () => {
      dead = true;
      clearInterval(interval);
    };
  }, [activeId, fetchThreadDetail]);

  function navigateTo(id: string) {
    router.push(`/admin/inbox/${id}`);
    // clear unread local + persist
    const nowIso = new Date().toISOString();
    setConversations((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, unread_count: 0, last_read_at: nowIso } : t
      )
    );
    updateThread(id, { unread_count: 0, last_read_at: nowIso }).catch(() => {});
  }

  async function updateThread(id: string, patch: ThreadPatchPayload) {
    await fetch(`/api/admin/inbox/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {});
  }

  async function setTicketStatus(id: string, st: TicketStatus) {
    patchConv(id, { ticket_status: st });
    await updateThread(id, { ticket_status: st });
  }

  async function setPriority(id: string, p: Priority) {
    patchConv(id, { priority: p });
    await updateThread(id, { priority: p });
  }

  async function setAssignee(id: string, asg?: string) {
    patchConv(id, { assigned_to: asg ?? null });
    await updateThread(id, { assigned_to: asg ?? null });
  }

  async function autoAssign() {
    if (!activeConv) return;
    try {
      const res = await fetch(`/api/admin/inbox/threads/${activeConv.id}/auto-assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: activeConv.team_id }),
      });
      const js = (await res.json().catch(() => ({}))) as {
        thread?: { assignedTo?: string; assignedMemberId?: string; teamId?: string };
        error?: string;
      };
      if (!res.ok || !js.thread) {
        const errMsg = typeof js.error === "string" ? js.error : "Gagal auto-assign";
        const friendly =
          errMsg === "member_not_in_team"
            ? "You are not a member of this team."
            : errMsg;
        throw new Error(friendly);
      }
      patchConv(activeConv.id, {
        assigned_to: js.thread.assignedTo ?? null,
        assigned_member_id: js.thread.assignedMemberId ?? null,
        team_id: js.thread.teamId ?? null,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    }
  }

  async function transferTeam() {
    if (!activeConv) return;
    if (!transferTeamId) {
      setError("team_id_required");
      return;
    }
    try {
      const res = await fetch(`/api/admin/inbox/threads/${activeConv.id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: transferTeamId }),
      });
      const js = (await res.json().catch(() => ({}))) as {
        thread?: { assignedTo?: string; assignedMemberId?: string; teamId?: string };
        error?: string;
      };
      if (!res.ok || !js.thread) {
        const errMsg = typeof js.error === "string" ? js.error : "Gagal transfer";
        const friendly =
          errMsg === "member_not_in_team"
            ? "You are not a member of this team."
            : errMsg;
        throw new Error(friendly);
      }
      patchConv(activeConv.id, {
        assigned_to: js.thread.assignedTo ?? null,
        assigned_member_id: js.thread.assignedMemberId ?? null,
        team_id: js.thread.teamId ?? null,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    }
  }

  async function takeOverThread() {
    if (!activeConv) return;
    try {
      const res = await fetch(`/api/admin/inbox/threads/${activeConv.id}/takeover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const js = (await res.json().catch(() => ({}))) as {
        thread?: {
          assignedTo?: string;
          assignedMemberId?: string;
          teamId?: string;
          takeoverByMemberId?: string;
          takeoverPrevAssignedMemberId?: string;
          takeoverAt?: string;
        };
        error?: string;
      };
      if (!res.ok || !js.thread) {
        const errMsg = typeof js.error === "string" ? js.error : "Gagal takeover";
        throw new Error(errMsg);
      }
      patchConv(activeConv.id, {
        assigned_to: js.thread.assignedTo ?? null,
        assigned_member_id: js.thread.assignedMemberId ?? null,
        team_id: js.thread.teamId ?? null,
        takeover_by_member_id: js.thread.takeoverByMemberId ?? null,
        takeover_prev_assigned_member_id:
          js.thread.takeoverPrevAssignedMemberId ?? null,
        takeover_at: js.thread.takeoverAt ?? null,
      });
      await fetchThreadDetail(activeConv.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    }
  }

  async function releaseTakeover() {
    if (!activeConv) return;
    try {
      const res = await fetch(`/api/admin/inbox/threads/${activeConv.id}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const js = (await res.json().catch(() => ({}))) as {
        thread?: {
          assignedTo?: string;
          assignedMemberId?: string;
          teamId?: string;
          takeoverByMemberId?: string;
          takeoverPrevAssignedMemberId?: string;
          takeoverAt?: string;
        };
        error?: string;
      };
      if (!res.ok || !js.thread) {
        const errMsg = typeof js.error === "string" ? js.error : "Gagal release takeover";
        throw new Error(errMsg);
      }
      patchConv(activeConv.id, {
        assigned_to: js.thread.assignedTo ?? null,
        assigned_member_id: js.thread.assignedMemberId ?? null,
        team_id: js.thread.teamId ?? null,
        takeover_by_member_id: js.thread.takeoverByMemberId ?? null,
        takeover_prev_assigned_member_id:
          js.thread.takeoverPrevAssignedMemberId ?? null,
        takeover_at: js.thread.takeoverAt ?? null,
      });
      await fetchThreadDetail(activeConv.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    }
  }

  async function setCategory(categoryId: string | null) {
    if (!activeConv) return;
    try {
      const res = await fetch(`/api/admin/inbox/threads/${activeConv.id}/category`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId }),
      });
      const js = (await res.json().catch(() => ({}))) as {
        thread?: {
          assignedTo?: string;
          assignedMemberId?: string;
          teamId?: string;
          categoryId?: string;
        };
        error?: string;
      };
      if (!res.ok || !js.thread) {
        const errMsg = typeof js.error === "string" ? js.error : "Gagal update kategori";
        throw new Error(errMsg);
      }
      patchConv(activeConv.id, {
        assigned_to: js.thread.assignedTo ?? null,
        assigned_member_id: js.thread.assignedMemberId ?? null,
        team_id: js.thread.teamId ?? null,
        category_id: js.thread.categoryId ?? null,
      });
      await fetchThreadDetail(activeConv.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    }
  }

  async function togglePin() {
    if (!activeConv) return;
    const next = !activeConv.pinned;
    patchConv(activeConv.id, { pinned: next });
    await updateThread(activeConv.id, { pinned: next });
  }

  async function toggleArchive() {
    if (!activeConv) return;
    const next = !activeConv.is_archived;
    patchConv(activeConv.id, { is_archived: next });
    await updateThread(activeConv.id, { is_archived: next });
  }

  async function markRead() {
    if (!activeConv) return;
    const nowIso = new Date().toISOString();
    patchConv(activeConv.id, { unread_count: 0, last_read_at: nowIso });
    await updateThread(activeConv.id, { unread_count: 0, last_read_at: nowIso });
  }

  async function markUnread() {
    if (!activeConv) return;
    patchConv(activeConv.id, { unread_count: 1, last_read_at: null });
    await updateThread(activeConv.id, { unread_count: 1, last_read_at: null });
  }

  async function snoozeThread() {
    if (!activeConv) return;
    const raw = prompt("Snooze berapa menit? (0 untuk clear)");
    if (raw === null) return;
    const minutes = Number(raw);
    if (!Number.isFinite(minutes) || minutes < 0) return;
    const until = minutes === 0 ? null : new Date(Date.now() + minutes * 60_000).toISOString();
    patchConv(activeConv.id, { snoozed_until: until });
    await updateThread(activeConv.id, { snoozed_until: until });
  }

  function updateCrmValue(field: CrmField, next: string | boolean) {
    setCrmValues((prev) => ({
      ...prev,
      [field.id]: {
        valueText: field.type === "bool" ? null : String(next ?? ""),
        valueJson: field.type === "bool" ? Boolean(next) : null,
      },
    }));
    setCrmDirty(true);
  }

  async function saveCrmFields() {
    if (!activeContact?.id || crmFields.length === 0) return;
    setCrmSaving(true);
    setCrmError(null);
    try {
      const values: Record<string, unknown> = {};
      crmFields.forEach((field) => {
        const current = crmValues[field.id];
        if (field.type === "bool") {
          values[field.id] = current?.valueJson ?? null;
          return;
        }
        const text = current?.valueText ?? "";
        values[field.id] = text === "" ? null : text;
      });

      const res = await fetch(`/api/admin/crm/contacts/${activeContact.id}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const js = (await res.json().catch(() => ({}))) as CrmSaveResponse;
      if (!res.ok) {
        const errMsg = typeof js.error === "string" ? js.error : "Gagal simpan fields";
        throw new Error(errMsg);
      }
      const nextValues: Record<string, { valueText: string | null; valueJson: unknown | null }> =
        {};
      (js.values ?? []).forEach((val) => {
        nextValues[val.field_id] = {
          valueText: val.value_text ?? null,
          valueJson: val.value_json ?? null,
        };
      });
      setCrmValues(nextValues);
      setCrmDirty(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setCrmError(msg);
    } finally {
      setCrmSaving(false);
    }
  }

  async function updateCommsStatus(nextStatus: "normal" | "blacklisted" | "whitelisted") {
    if (!activeContact?.id) return;
    setCommsSaving(true);
    setCommsError(null);
    try {
      const res = await fetch(
        `/api/admin/crm/contacts/${activeContact.id}/comms-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comms_status: nextStatus }),
        }
      );
      const js = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        const errMsg = typeof js.error === "string" ? js.error : "Gagal update status";
        throw new Error(errMsg);
      }
      setConversations((prev) =>
        prev.map((t) =>
          t.contact_id === activeContact.id
            ? { ...t, contact: { ...t.contact, comms_status: nextStatus } }
            : t
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setCommsError(msg);
    } finally {
      setCommsSaving(false);
    }
  }

  async function send() {
    if (!activeId) return;
    const text = composer.trim();
    if (!text) return;

    setComposer("");
    const optimistic: MessageRow = {
      id: `tmp_${Math.random().toString(16).slice(2)}`,
      conversationId: activeId,
      direction: "out",
      text,
      ts: new Date().toISOString(),
      status: "queued",
      waMessageId: null,
      errorReason: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/admin/inbox/threads/${activeId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const js = (await res.json().catch(() => ({}))) as SendResponse;
      const message = js.message;
      if (!res.ok || !message) {
        const errMsg = typeof js.error === "string" ? js.error : "Gagal kirim";
        throw new Error(errMsg);
      }

      // replace optimistic with real
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? message : m)));
      patchConv(activeId, { last_message_at: message.ts });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
      // mark failed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id
            ? { ...m, status: "failed", errorReason: msg || "Failed" }
            : m
        )
      );
    }
  }

  async function addNote() {
    if (!activeId) return;
    const t = prompt("Tulis catatan internal:");
    const text = String(t || "").trim();
    if (!text) return;

    try {
      const res = await fetch(`/api/admin/inbox/threads/${activeId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const js = (await res.json().catch(() => ({}))) as NoteResponse;
      const note = js.note;
      if (!res.ok || !note) {
        const errMsg = typeof js.error === "string" ? js.error : "Gagal tambah note";
        throw new Error(errMsg);
      }
      setNotes((prev) => [note, ...prev]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
    }
  }

  const activeMessages = useMemo(() => {
    return messages.slice().sort((a, b) => (a.ts < b.ts ? -1 : 1));
  }, [messages]);

  useEffect(() => {
    const ids = new Set<string>();
    activeMessages.forEach((m) => {
      (m.attachments ?? []).forEach((a) => {
        if (
          a.requiresSign &&
          !a.url &&
          !attachmentUrls[a.id] &&
          attachmentStatus[a.id] !== "loading"
        ) {
          ids.add(a.id);
        }
      });
    });

    if (ids.size === 0) return;

    const toSign = Array.from(ids);
    setAttachmentStatus((prev) => {
      const next = { ...prev };
      toSign.forEach((id) => {
        next[id] = "loading";
      });
      return next;
    });

    fetch("/api/admin/attachments/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachmentIds: toSign }),
    })
      .then(async (res) => {
        const js = (await res.json().catch(() => ({}))) as {
          items?: Array<{ id: string; url?: string; thumbUrl?: string; error?: string }>;
        };
        if (!res.ok) throw new Error(js?.items ? "sign_failed" : "sign_failed");
        return js.items ?? [];
      })
      .then((items) => {
        setAttachmentUrls((prev) => {
          const next = { ...prev };
          items.forEach((item) => {
            if (item.url) next[item.id] = { url: item.url, thumbUrl: item.thumbUrl };
          });
          return next;
        });
        setAttachmentStatus((prev) => {
          const next = { ...prev };
          items.forEach((item) => {
            next[item.id] = item.url ? "idle" : "error";
          });
          return next;
        });
      })
      .catch(() => {
        setAttachmentStatus((prev) => {
          const next = { ...prev };
          toSign.forEach((id) => {
            next[id] = "error";
          });
          return next;
        });
      });
  }, [activeMessages, attachmentUrls, attachmentStatus]);

  function getMessageAttachments(m: MessageRow) {
    const direct = (m.attachments ?? []).filter(Boolean);
    if (direct.length > 0) return direct;
    if (!m.mediaUrl && !m.mediaMime) return [];
    return [
      {
        id: `legacy-${m.id}`,
        kind: kindFromMime(m.mediaMime),
        mimeType: m.mediaMime ?? undefined,
        fileName: "attachment",
        url: m.mediaUrl ?? undefined,
      },
    ];
  }

  const activeNotes = useMemo(() => {
    return notes.slice().sort((a, b) => (a.ts < b.ts ? 1 : -1));
  }, [notes]);

  const activeEscalations = useMemo(() => {
    return escalations.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [escalations]);

  const resolvedTeamName = useMemo(() => {
    if (!activeConv?.team_id) return activeTeamName ?? null;
    return teams.find((t) => t.id === activeConv.team_id)?.name ?? activeTeamName ?? null;
  }, [activeConv?.team_id, activeTeamName, teams]);

  const assignedLabel = useMemo(() => {
    if (!activeConv) return "Unassigned";
    const rawAssigned = activeConv.assigned_to;
    if (rawAssigned && rawAssigned !== activeConv.assigned_member_id) {
      return rawAssigned;
    }
    if (assignedMemberUserId) return shortId(assignedMemberUserId);
    if (activeConv.assigned_member_id) return shortId(activeConv.assigned_member_id);
    return "Unassigned";
  }, [activeConv, assignedMemberUserId]);

  const takeoverLabel = useMemo(() => {
    if (!activeConv?.takeover_by_member_id) return null;
    const raw = takeoverByUserId || activeConv.takeover_by_member_id;
    return shortId(raw);
  }, [activeConv?.takeover_by_member_id, takeoverByUserId]);

  const takeoverActive = Boolean(activeConv?.takeover_by_member_id);
  const canTakeover =
    supervisorTakeoverEnabled && (memberRole === "admin" || memberRole === "supervisor");

  return (
    <div className="min-h-[calc(100vh-0px)] w-full">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold tracking-tight">Inbox</div>
            <div className="text-sm text-slate-400">
              Shared Team Inbox (MVP) — data dari Supabase
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
              href="/admin/contacts"
            >
              Contacts
            </Link>
            <span className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300">
              Workspace: Gigaviz
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-12 gap-4">
          {/* LEFT */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40">
              <div className="border-b border-slate-800 p-3">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari nomor/nama/tag…"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-700"
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as TicketStatus | "all")}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="all">Semua status</option>
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="solved">Solved</option>
                    <option value="spam">Spam</option>
                  </select>

                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as Priority | "all")}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="all">Semua priority</option>
                    <option value="low">Low</option>
                    <option value="med">Med</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value as string | "all")}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="all">Semua agent</option>
                    {agents.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                    <option value="">(Unassigned)</option>
                  </select>

                  <select
                    value={filterArchived}
                    onChange={(e) => setFilterArchived(e.target.value as "active" | "archived" | "all")}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="active">Aktif</option>
                    <option value="archived">Archived</option>
                    <option value="all">Semua</option>
                  </select>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    placeholder="Filter tag"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-700"
                  />

                  <select
                    value={filterPinned}
                    onChange={(e) => setFilterPinned(e.target.value as "all" | "pinned")}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="all">Semua</option>
                    <option value="pinned">Pinned saja</option>
                  </select>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-auto">
                {loading && (
                  <div className="p-6 text-sm text-slate-400">Loading…</div>
                )}

                {!loading &&
                  filtered.map((t) => {
                    const isActive = t.id === activeId;
                    const isSnoozed =
                      t.snoozed_until && new Date(t.snoozed_until).getTime() > Date.now();
                    return (
                      <button
                        key={t.id}
                        onClick={() => navigateTo(t.id)}
                        className={clsx(
                          "w-full text-left px-3 py-3 border-b border-slate-900 hover:bg-slate-900/40",
                          isActive && "bg-slate-900/50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {t.contact?.name ?? "Unknown"}
                            </div>
                            <div className="truncate text-xs text-slate-400">
                              {t.contact?.phone ?? "-"}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={clsx(
                                "text-[11px] px-2 py-1 rounded-full border",
                                badgeColor(t.ticket_status)
                              )}
                            >
                              {t.ticket_status}
                            </span>
                            {t.pinned && (
                              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-[2px] text-[11px] text-amber-200">
                                pinned
                              </span>
                            )}
                            {t.is_archived && (
                              <span className="rounded-full border border-slate-700 px-2 py-[2px] text-[11px] text-slate-300">
                                archived
                              </span>
                            )}
                            {isSnoozed && (
                              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-[2px] text-[11px] text-sky-200">
                                snoozed
                              </span>
                            )}
                            {t.unread_count > 0 && (
                              <span className="rounded-full bg-emerald-500/20 px-2 py-[2px] text-[11px] text-emerald-300 border border-emerald-500/30">
                                {t.unread_count} new
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                          <span
                            className={clsx(
                              "px-2 py-1 rounded-full border",
                              badgeColor(t.priority)
                            )}
                          >
                            {t.priority}
                          </span>
                          <span>{fmtTime(t.last_message_at)}</span>
                        </div>
                      </button>
                    );
                  })}

                {!loading && filtered.length === 0 && (
                  <div className="p-6 text-sm text-slate-400">
                    Tidak ada hasil. Coba ubah filter/kata kunci.
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* CENTER */}
          <main className="col-span-12 lg:col-span-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40">
              <div className="border-b border-slate-800 p-3">
                {activeConv && activeContact ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-base font-semibold">
                          {activeContact.name}
                        </div>
                        {activeEscalations.length > 0 && (
                          <span className="text-[11px] px-2 py-1 rounded-full border border-rose-500/40 text-rose-200 bg-rose-500/10">
                            Escalated
                          </span>
                        )}
                        <span
                          className={clsx(
                            "text-[11px] px-2 py-1 rounded-full border",
                            badgeColor(activeConv.ticket_status)
                          )}
                        >
                          {activeConv.ticket_status}
                        </span>
                        <span
                          className={clsx(
                            "text-[11px] px-2 py-1 rounded-full border",
                            badgeColor(activeConv.priority)
                          )}
                        >
                          {activeConv.priority}
                        </span>
                      </div>
                      <div className="truncate text-sm text-slate-400">
                        {activeContact.phone}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(activeContact.tags || []).map((t) => (
                          <span
                            key={t}
                            className="text-[11px] px-2 py-1 rounded-full border border-slate-800 text-slate-300"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <select
                        value={activeConv.assigned_to ?? ""}
                        onChange={(e) => setAssignee(activeConv.id, e.target.value || undefined)}
                        className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                      >
                        <option value="">Unassigned</option>
                        {agents.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={autoAssign}
                        className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
                      >
                        Auto-assign
                      </button>

                      <div className="flex gap-2">
                        <select
                          value={activeConv.ticket_status}
                          onChange={(e) => setTicketStatus(activeConv.id, e.target.value as TicketStatus)}
                          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                        >
                          <option value="open">Open</option>
                          <option value="pending">Pending</option>
                          <option value="solved">Solved</option>
                          <option value="spam">Spam</option>
                        </select>

                        <select
                          value={activeConv.priority}
                          onChange={(e) => setPriority(activeConv.id, e.target.value as Priority)}
                          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                        >
                          <option value="low">low</option>
                          <option value="med">med</option>
                          <option value="high">high</option>
                          <option value="urgent">urgent</option>
                        </select>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={togglePin}
                          className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-900"
                        >
                          {activeConv.pinned ? "Unpin" : "Pin"}
                        </button>
                        <button
                          onClick={toggleArchive}
                          className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-900"
                        >
                          {activeConv.is_archived ? "Unarchive" : "Archive"}
                        </button>
                        <button
                          onClick={snoozeThread}
                          className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-900"
                        >
                          Snooze
                        </button>
                        <button
                          onClick={markRead}
                          className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-900"
                        >
                          Mark read
                        </button>
                        <button
                          onClick={markUnread}
                          className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-900"
                        >
                          Mark unread
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">Pilih percakapan di kiri.</div>
                )}
              </div>

              <div className="h-[52vh] overflow-auto p-3 space-y-3">
                {loadingThread && (
                  <div className="text-sm text-slate-400">Loading chat…</div>
                )}

                {!loadingThread &&
                  activeMessages.map((m) => {
                    const isOut = m.direction === "out";
                    const statusLabel = m.status ?? "sent";
                    const attempted = statusLabel !== "queued";
                    const attemptedLabel = attempted ? "attempted" : "not attempted";
                    const statusClass =
                      statusLabel === "failed"
                        ? "border-rose-500/40 text-rose-200"
                        : statusLabel === "queued"
                          ? "border-amber-500/40 text-amber-200"
                          : "border-slate-700 text-slate-300";
                    const attemptedClass = attempted
                      ? "border-emerald-500/30 text-emerald-300"
                      : "border-slate-700 text-slate-400";
                    const attachments = getMessageAttachments(m);
                    return (
                      <div key={m.id} className={clsx("flex", isOut ? "justify-end" : "justify-start")}>
                        <div
                          className={clsx(
                            "max-w-[85%] rounded-2xl border px-3 py-2",
                            isOut
                              ? "bg-sky-500/10 border-sky-500/30 text-slate-100"
                              : "bg-slate-900/40 border-slate-800 text-slate-100"
                          )}
                        >
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {m.text}
                          </div>
                          {attachments.length > 0 && (
                            <div
                              className={clsx(
                                "mt-2 grid gap-2",
                                attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"
                              )}
                            >
                              {attachments.map((a) => {
                                const signed = attachmentUrls[a.id];
                                const rawUrl = a.url ?? signed?.url ?? null;
                                const displayUrl =
                                  rawUrl && rawUrl.startsWith("http") ? rawUrl : null;
                                const thumb =
                                  (a.thumbUrl ?? signed?.thumbUrl) &&
                                  (a.thumbUrl ?? signed?.thumbUrl)?.startsWith("http")
                                    ? (a.thumbUrl ?? signed?.thumbUrl)
                                    : displayUrl;
                                const lightboxTarget = displayUrl ?? thumb ?? null;
                                const isLoading =
                                  a.requiresSign && !displayUrl && attachmentStatus[a.id] === "loading";
                                const isError =
                                  a.requiresSign && !displayUrl && attachmentStatus[a.id] === "error";
                                const isPending = !a.requiresSign && !displayUrl;
                                const label = a.fileName || a.mimeType || "attachment";

                                if (a.kind === "image") {
                                  return (
                                    <div
                                      key={a.id}
                                      className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-xs text-slate-300"
                                    >
                                      <div className="mb-1 flex items-center justify-between">
                                        <span className="truncate">{label}</span>
                                        {isPending && (
                                          <span className="text-[10px] text-slate-500">
                                            pending url
                                          </span>
                                        )}
                                        {isLoading && (
                                          <span className="text-[10px] text-slate-500">
                                            loading
                                          </span>
                                        )}
                                        {isError && (
                                          <span className="text-[10px] text-rose-300">
                                            expired
                                          </span>
                                        )}
                                      </div>
                                      {thumb && (
                                        <button
                                          onClick={() => setLightboxUrl(lightboxTarget)}
                                          className="block"
                                        >
                                          <Image
                                            src={thumb}
                                            alt="attachment"
                                            width={220}
                                            height={160}
                                            unoptimized
                                            className="max-h-40 w-auto rounded-md border border-slate-800"
                                          />
                                        </button>
                                      )}
                                      {!thumb && (
                                        <div className="text-[11px] text-slate-500">
                                          Attachment unavailable
                                        </div>
                                      )}
                                    </div>
                                  );
                                }

                                if (a.kind === "video") {
                                  return (
                                    <div
                                      key={a.id}
                                      className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-xs text-slate-300"
                                    >
                                      <div className="mb-1 flex items-center justify-between">
                                        <span className="truncate">{label}</span>
                                        {isError && (
                                          <span className="text-[10px] text-rose-300">
                                            expired
                                          </span>
                                        )}
                                      </div>
                                      {displayUrl ? (
                                        <video
                                          controls
                                          src={displayUrl}
                                          className="w-full rounded-md border border-slate-800"
                                        />
                                      ) : (
                                        <div className="text-[11px] text-slate-500">
                                          {isLoading ? "Loading video..." : "Video unavailable"}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }

                                if (a.kind === "audio") {
                                  return (
                                    <div
                                      key={a.id}
                                      className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-xs text-slate-300"
                                    >
                                      <div className="mb-1 flex items-center justify-between">
                                        <span className="truncate">{label}</span>
                                        {isError && (
                                          <span className="text-[10px] text-rose-300">
                                            expired
                                          </span>
                                        )}
                                      </div>
                                      {displayUrl ? (
                                        <audio controls src={displayUrl} className="w-full" />
                                      ) : (
                                        <div className="text-[11px] text-slate-500">
                                          {isLoading ? "Loading audio..." : "Audio unavailable"}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={a.id}
                                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-xs text-slate-300"
                                  >
                                    <div className="mb-2 flex items-center justify-between">
                                      <span className="truncate">{label}</span>
                                      {isError && (
                                        <span className="text-[10px] text-rose-300">
                                          expired
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      {formatBytes(a.sizeBytes)}
                                    </div>
                                    {displayUrl ? (
                                      <a
                                        href={displayUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-2 inline-flex items-center gap-2 rounded-md border border-slate-700 px-2 py-1 text-[11px] hover:bg-slate-900"
                                      >
                                        Download
                                      </a>
                                    ) : (
                                      <div className="mt-2 text-[11px] text-slate-500">
                                        {isLoading ? "Loading file..." : "File unavailable"}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="mt-1 flex items-center justify-end gap-2 text-[11px] text-slate-400">
                            <span>{fmtTime(m.ts)}</span>
                            {isOut && (
                              <>
                                <span className={clsx("rounded-full border px-2 py-[1px]", statusClass)}>
                                  {statusLabel}
                                </span>
                                <span
                                  className={clsx(
                                    "rounded-full border px-2 py-[1px]",
                                    attemptedClass
                                  )}
                                >
                                  {attemptedLabel}
                                </span>
                              </>
                            )}
                          </div>
                          {isOut && statusLabel === "failed" && m.errorReason && (
                            <div className="mt-1 text-[11px] text-rose-300">
                              {m.errorReason}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {!loadingThread && activeMessages.length === 0 && (
                  <div className="text-sm text-slate-400">Belum ada pesan.</div>
                )}
              </div>

              <div className="border-t border-slate-800 p-3">
                <div className="flex gap-2">
                  <input
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    placeholder="Ketik balasan…"
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-700"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                  <button
                    onClick={send}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm hover:bg-slate-800"
                  >
                    Kirim
                  </button>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  *Default dry-run. Set ENABLE_WA_SEND=true untuk kirim WhatsApp asli.
                </div>
              </div>
            </div>
          </main>

          {/* RIGHT */}
          <section className="col-span-12 lg:col-span-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40">
              <div className="border-b border-slate-800 p-3">
                <div className="text-sm font-semibold">Info & Notes</div>
                <div className="text-xs text-slate-400">Internal (tidak terlihat user)</div>
              </div>

              <div className="p-3 space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="text-xs text-slate-400">Assigned</div>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span>{assignedLabel}</span>
                    {resolvedTeamName && (
                      <span className="rounded-full border border-slate-700 px-2 py-[1px] text-[11px] text-slate-300">
                        {resolvedTeamName}
                      </span>
                    )}
                  </div>
                  {takeoverActive && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-amber-300">
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-[1px]">
                        Taken over
                      </span>
                      <span>{takeoverLabel ?? "-"}</span>
                      <span>{fmtTime(activeConv?.takeover_at)}</span>
                    </div>
                  )}
                  {canTakeover && (
                    <div className="mt-3">
                      {!takeoverActive ? (
                        <button
                          onClick={takeOverThread}
                          className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-900"
                        >
                          Take over
                        </button>
                      ) : (
                        <button
                          onClick={releaseTakeover}
                          className="rounded-lg border border-amber-500/40 px-3 py-1 text-xs text-amber-200 hover:bg-amber-500/10"
                        >
                          Release
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="text-xs text-slate-400">Last seen</div>
                  <div className="mt-1 text-sm">{fmtTime(activeContact?.last_seen_at)}</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold">Comms status</div>
                    <span
                      className={clsx(
                        "text-[10px] px-2 py-[2px] rounded-full border",
                        commsBadgeColor(activeContact?.comms_status ?? "normal")
                      )}
                    >
                      {activeContact?.comms_status ?? "normal"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={activeContact?.comms_status ?? "normal"}
                      onChange={(e) =>
                        updateCommsStatus(
                          e.target.value as "normal" | "blacklisted" | "whitelisted"
                        )
                      }
                      className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                      disabled={commsSaving}
                    >
                      <option value="normal">Normal</option>
                      <option value="whitelisted">Whitelisted</option>
                      <option value="blacklisted">Blacklisted</option>
                    </select>
                    {commsSaving && (
                      <span className="text-xs text-slate-500">Saving...</span>
                    )}
                  </div>
                  {commsError && <div className="mt-2 text-xs text-rose-300">{commsError}</div>}
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold">Custom fields</div>
                    <button
                      onClick={saveCrmFields}
                      className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-900"
                      disabled={crmDisabled || !crmDirty || crmFields.length === 0}
                    >
                      {crmSaving ? "Saving..." : "Save"}
                    </button>
                  </div>

                  {crmLoading && (
                    <div className="text-sm text-slate-400">Loading custom fields...</div>
                  )}

                  {!crmLoading && crmFields.length === 0 && (
                    <div className="text-sm text-slate-400">Belum ada custom fields.</div>
                  )}

                  {!crmLoading && crmFields.length > 0 && (
                    <div className="space-y-2">
                      {crmFields.map((field) => {
                        const valueText = crmValues[field.id]?.valueText ?? "";
                        const valueBool = Boolean(crmValues[field.id]?.valueJson ?? false);
                        const choices = field.type === "select" ? fieldChoices(field) : [];
                        return (
                          <div key={field.id} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-slate-400">
                                {field.label}
                                {field.is_required ? " *" : ""}
                              </label>
                              <span className="text-[10px] text-slate-500">{field.key}</span>
                            </div>

                            {field.type === "text" && (
                              <input
                                value={valueText}
                                onChange={(e) => updateCrmValue(field, e.target.value)}
                                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm"
                                disabled={crmDisabled}
                              />
                            )}

                            {field.type === "number" && (
                              <input
                                type="number"
                                value={valueText}
                                onChange={(e) => updateCrmValue(field, e.target.value)}
                                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm"
                                disabled={crmDisabled}
                              />
                            )}

                            {field.type === "date" && (
                              <input
                                type="date"
                                value={valueText}
                                onChange={(e) => updateCrmValue(field, e.target.value)}
                                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm"
                                disabled={crmDisabled}
                              />
                            )}

                            {field.type === "select" && (
                              <select
                                value={valueText}
                                onChange={(e) => updateCrmValue(field, e.target.value)}
                                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm"
                                disabled={crmDisabled}
                              >
                                <option value="">Pilih...</option>
                                {choices.map((choice) => (
                                  <option key={choice} value={choice}>
                                    {choice}
                                  </option>
                                ))}
                              </select>
                            )}

                            {field.type === "bool" && (
                              <label className="flex items-center gap-2 text-sm text-slate-200">
                                <input
                                  type="checkbox"
                                  checked={valueBool}
                                  onChange={(e) => updateCrmValue(field, e.target.checked)}
                                  disabled={crmDisabled}
                                  className="h-4 w-4 rounded border border-slate-700 bg-slate-950"
                                />
                                {valueBool ? "Yes" : "No"}
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {crmError && <div className="mt-2 text-xs text-rose-300">{crmError}</div>}
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="text-xs text-slate-400">Thread</div>
                  <div className="mt-1 text-sm">
                    {activeConv?.pinned ? "Pinned" : "Not pinned"} -{" "}
                    {activeConv?.is_archived ? "Archived" : "Active"}
                  </div>
                  {activeConv?.snoozed_until && (
                    <div className="mt-1 text-xs text-slate-400">
                      Snoozed until {fmtTime(activeConv.snoozed_until)}
                    </div>
                  )}
                </div>

                {skillRoutingEnabled && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <div className="text-xs text-slate-400">Category</div>
                    <div className="mt-2 flex flex-col gap-2">
                      <select
                        value={activeConv?.category_id ?? ""}
                        onChange={(e) => setCategory(e.target.value || null)}
                        className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                        disabled={categoriesLoading}
                      >
                        <option value="">Uncategorized</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      {categoriesLoading && (
                        <span className="text-xs text-slate-500">Loading...</span>
                      )}
                      {categoriesError && (
                        <div className="text-xs text-rose-300">{categoriesError}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="text-xs text-slate-400">Transfer team</div>
                  <div className="mt-2 flex flex-col gap-2">
                    <select
                      value={transferTeamId}
                      onChange={(e) => setTransferTeamId(e.target.value)}
                      className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                    >
                      <option value="">Pilih team</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {t.is_default ? " (default)" : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={transferTeam}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
                      disabled={!transferTeamId}
                    >
                      Transfer
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold">Notes</div>
                    <button
                      onClick={addNote}
                      className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-900"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {activeNotes.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"
                      >
                        <div className="text-xs text-slate-400 flex items-center justify-between">
                          <span>{n.author}</span>
                          <span>{fmtTime(n.ts)}</span>
                        </div>
                        <div className="mt-1 text-sm">{n.text}</div>
                      </div>
                    ))}

                    {activeNotes.length === 0 && (
                      <div className="text-sm text-slate-400">Belum ada note.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold">Escalations</div>
                    <span className="text-xs text-slate-500">
                      {activeEscalations.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {activeEscalations.map((e) => (
                      <div
                        key={e.id}
                        className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"
                      >
                        <div className="text-xs text-slate-400 flex items-center justify-between">
                          <span>{e.breachType}</span>
                          <span>{fmtTime(e.createdAt)}</span>
                        </div>
                        <div className="mt-1 text-sm">{e.reason}</div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          Due {fmtTime(e.dueAt)}
                        </div>
                      </div>
                    ))}

                    {activeEscalations.length === 0 && (
                      <div className="text-sm text-slate-400">
                        Belum ada escalations.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="text-xs text-slate-400">SLA</div>
                    <span
                      className={clsx(
                        "text-[10px] px-2 py-[2px] rounded-full border",
                        slaBadgeColor(slaSummary.status)
                      )}
                    >
                      {slaSummary.status ?? "n/a"}
                    </span>
                  </div>
                  <div className="text-sm">{slaSummary.label}</div>
                  <div className="mt-1 text-xs text-slate-500">{firstResponseLabel}</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 text-xs text-slate-500">
          Shortcut: buka langsung{" "}
          <code className="rounded border border-slate-800 px-2 py-1 bg-slate-950">
            /admin/inbox/&lt;conversation_id&gt;
          </code>
        </div>
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute -top-3 -right-3 rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
              onClick={() => setLightboxUrl(null)}
            >
              Close
            </button>
            <Image
              src={lightboxUrl}
              alt="attachment"
              width={1200}
              height={800}
              unoptimized
              className="max-h-[90vh] w-auto rounded-lg border border-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
}
