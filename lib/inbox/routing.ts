import { logger } from "@/lib/logging";

type DbQuery = {
  select: (columns: string) => DbQuery;
  eq: (column: string, value: unknown) => DbQuery;
  in: (column: string, values: unknown[]) => DbQuery;
  order: (column: string, options?: { ascending?: boolean }) => DbQuery;
  update: (values: Record<string, unknown>) => DbQuery;
  insert: (values: Record<string, unknown> | Record<string, unknown>[]) => DbQuery;
  single: () => Promise<DbResult<unknown>>;
  maybeSingle: () => Promise<DbResult<unknown>>;
};

type DbClient = {
  from: (table: string) => DbQuery;
  rpc: (fn: string, args: Record<string, unknown>) => Promise<DbResult<unknown>>;
};

type DbResult<T> = { data: T | null; error: { message: string } | null };

export type RoutingCategory = {
  id: string;
  key: string;
  label: string;
};

type ConversationRow = {
  id: string;
  category_id: string | null;
  team_id: string | null;
  assigned_member_id: string | null;
  assigned_to: string | null;
};

type TeamRow = {
  id: string;
  name: string | null;
  is_default: boolean | null;
};

type RoutingRuleRow = {
  id: string;
  category_id: string;
  keywords: string[] | null;
};

export function isSkillRoutingEnabled() {
  return process.env.SKILL_ROUTING_ENABLED === "true";
}

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase();
}

export async function inferCategoryFromRules(params: {
  db: unknown;
  workspaceId: string;
  text: string;
}) {
  const { db, workspaceId, text } = params;
  const client = db as DbClient;
  const haystack = text.toLowerCase();

  const { data: rulesRaw } = (await (client
    .from("routing_rules")
    .select("id, category_id, keywords")
    .eq("workspace_id", workspaceId) as unknown as Promise<
    DbResult<RoutingRuleRow[]>
  >)) as DbResult<RoutingRuleRow[]>;

  const rules = (rulesRaw ?? []) as RoutingRuleRow[];
  if (rules.length === 0) return null;

  const categoryIds = Array.from(
    new Set(rules.map((rule) => rule.category_id).filter(Boolean))
  );
  if (categoryIds.length === 0) return null;

  const { data: categoriesRaw } = (await (client
    .from("routing_categories")
    .select("id, key, label")
    .in("id", categoryIds)
    .eq("workspace_id", workspaceId)
    .order("key", { ascending: true }) as unknown as Promise<
    DbResult<RoutingCategory[]>
  >)) as DbResult<RoutingCategory[]>;

  const categories = (categoriesRaw ?? []) as RoutingCategory[];
  const categoryById = Object.fromEntries(categories.map((cat) => [cat.id, cat]));

  const sorted = rules
    .slice()
    .sort((a, b) => {
      const aKey = categoryById[a.category_id]?.key ?? "";
      const bKey = categoryById[b.category_id]?.key ?? "";
      if (aKey !== bKey) return aKey.localeCompare(bKey);
      return a.id.localeCompare(b.id);
    });

  for (const rule of sorted) {
    const keywords = Array.isArray(rule.keywords) ? rule.keywords : [];
    for (const keyword of keywords) {
      if (typeof keyword !== "string") continue;
      const normalized = normalizeKeyword(keyword);
      if (!normalized) continue;
      if (haystack.includes(normalized)) {
        return {
          categoryId: rule.category_id,
          category: categoryById[rule.category_id] ?? null,
          matchedKeyword: normalized,
        };
      }
    }
  }

  return null;
}

export async function routeToCategoryTeam(params: {
  db: unknown;
  workspaceId: string;
  conversationId: string;
  createdBy?: string | null;
  category?: RoutingCategory | null;
}) {
  const { db, workspaceId, conversationId, createdBy, category } = params;
  const client = db as DbClient;

  const { data: convRaw, error: convErr } = (await (client
    .from("conversations")
    .select("id, category_id, team_id, assigned_member_id, assigned_to")
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId)
    .maybeSingle() as unknown as Promise<DbResult<ConversationRow>>)) as DbResult<
    ConversationRow
  >;

  const conv = convRaw as ConversationRow | null;
  if (convErr || !conv?.id) {
    return { ok: false as const, error: convErr?.message ?? "conversation_not_found" };
  }

  const categoryId = category?.id ?? conv.category_id;
  if (!categoryId) return { ok: true as const, routed: false as const };

  let resolvedCategory = category ?? null;
  if (!resolvedCategory) {
    const { data: categoryRaw } = (await (client
      .from("routing_categories")
      .select("id, key, label")
      .eq("workspace_id", workspaceId)
      .eq("id", categoryId)
      .maybeSingle() as unknown as Promise<DbResult<RoutingCategory>>)) as DbResult<
      RoutingCategory
    >;
    resolvedCategory = (categoryRaw as RoutingCategory | null) ?? null;
  }

  if (!resolvedCategory) return { ok: true as const, routed: false as const };

  const { data: mappingsRaw } = (await (client
    .from("team_categories")
    .select("team_id")
    .eq("category_id", categoryId)
    .eq("is_active", true) as unknown as Promise<
    DbResult<Array<{ team_id: string | null }>>
  >)) as DbResult<Array<{ team_id: string | null }>>;

  const teamIds = (mappingsRaw ?? [])
    .map((row) => row.team_id)
    .filter((id): id is string => Boolean(id));

  if (teamIds.length === 0) return { ok: true as const, routed: false as const };

  const { data: teamsRaw } = (await (client
    .from("teams")
    .select("id, name, is_default")
    .eq("workspace_id", workspaceId)
    .in("id", teamIds) as unknown as Promise<DbResult<TeamRow[]>>)) as DbResult<
    TeamRow[]
  >;

  const teams = (teamsRaw ?? []) as TeamRow[];
  if (teams.length === 0) return { ok: true as const, routed: false as const };

  const chosenTeam = teams
    .slice()
    .sort((a, b) => {
      const aDefault = a.is_default ? 1 : 0;
      const bDefault = b.is_default ? 1 : 0;
      if (aDefault !== bDefault) return bDefault - aDefault;
      const aName = (a.name ?? "").toLowerCase();
      const bName = (b.name ?? "").toLowerCase();
      if (aName !== bName) return aName.localeCompare(bName);
      return a.id.localeCompare(b.id);
    })[0];

  if (!chosenTeam?.id) return { ok: true as const, routed: false as const };

  const previousTeamId = conv.team_id ?? null;
  const needsTeamUpdate = previousTeamId !== chosenTeam.id;

  if (needsTeamUpdate) {
    const { error: updErr } = (await (client
      .from("conversations")
      .update({
        team_id: chosenTeam.id,
        assigned_member_id: null,
        assigned_to: null,
      })
      .eq("workspace_id", workspaceId)
      .eq("id", conversationId) as unknown as Promise<DbResult<unknown>>)) as DbResult<
      unknown
    >;

    if (updErr) {
      return { ok: false as const, error: updErr.message };
    }
  }

  const { error: eventErr } = (await (client
    .from("conversation_events")
    .insert({
      conversation_id: conversationId,
      type: "routed",
      meta: {
        category: resolvedCategory,
        team_id: chosenTeam.id,
        previous_team_id: previousTeamId,
      },
      created_by: createdBy ?? "system",
    }) as unknown as Promise<DbResult<unknown>>)) as DbResult<unknown>;

  if (eventErr) {
    logger.info("CONVERSATION_EVENT_INSERT_ERROR", eventErr.message);
  }

  const shouldAutoAssign = needsTeamUpdate || !conv.assigned_member_id;
  if (shouldAutoAssign) {
    const { error: rpcErr } = await client.rpc("assign_conversation_round_robin", {
      p_conversation_id: conversationId,
      p_team_id: chosenTeam.id,
    });
    if (rpcErr) {
      logger.info("CONVERSATION_AUTO_ASSIGN_ERROR", rpcErr.message);
    }
  }

  return {
    ok: true as const,
    routed: true as const,
    teamId: chosenTeam.id,
    categoryId,
    previousTeamId,
  };
}

export async function maybeAutoRouteInbound(params: {
  db: unknown;
  workspaceId: string;
  conversationId: string;
  text: string;
}) {
  const { db, workspaceId, conversationId, text } = params;
  if (!isSkillRoutingEnabled()) return;
  const client = db as DbClient;

  const { data: convRaw } = (await (client
    .from("conversations")
    .select("id, category_id, team_id, assigned_member_id, assigned_to")
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId)
    .maybeSingle() as unknown as Promise<DbResult<ConversationRow>>)) as DbResult<
    ConversationRow
  >;

  const conv = convRaw as ConversationRow | null;
  if (!conv?.id) return;

  if (conv.category_id) {
    await routeToCategoryTeam({
      db,
      workspaceId,
      conversationId,
      category: null,
      createdBy: "system",
    });
    return;
  }

  const inferred = await inferCategoryFromRules({ db, workspaceId, text });
  if (!inferred?.categoryId) return;

  const { error: updErr } = (await (client
    .from("conversations")
    .update({ category_id: inferred.categoryId })
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId) as unknown as Promise<DbResult<unknown>>)) as DbResult<
    unknown
  >;

  if (updErr) {
    logger.info("CONVERSATION_CATEGORY_UPDATE_ERROR", updErr.message);
    return;
  }

  await routeToCategoryTeam({
    db,
    workspaceId,
    conversationId,
    category: inferred.category ?? null,
    createdBy: "system",
  });
}
