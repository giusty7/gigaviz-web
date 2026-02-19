import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isSkillRoutingEnabled,
  inferCategoryFromRules,
  routeToCategoryTeam,
  maybeAutoRouteInbound,
} from "@/lib/inbox/routing";

/* ── Mock DB helper ──────────────────────────────────────────── */

function createMockQuery(data: unknown = null, error: { message: string } | null = null) {
  const result = { data, error };
  const query: Record<string, unknown> = {};

  // Each method returns the query for chaining, final methods return the result
  query.select = vi.fn().mockReturnValue(query);
  query.eq = vi.fn().mockReturnValue(query);
  query.in = vi.fn().mockReturnValue(query);
  query.order = vi.fn().mockReturnValue(query);
  query.update = vi.fn().mockReturnValue(query);
  query.insert = vi.fn().mockReturnValue(query);
  query.single = vi.fn().mockResolvedValue(result);
  query.maybeSingle = vi.fn().mockResolvedValue(result);

  // Make query also act as a thenable (for queries that resolve without .single/.maybeSingle)
  (query as unknown as Promise<typeof result>).then = (
    (resolve: (v: typeof result) => void) => Promise.resolve(result).then(resolve)
  ) as typeof Promise.prototype.then;

  return query;
}

function createMockDb(tables: Record<string, unknown>) {
  return {
    from: vi.fn((table: string) => {
      if (tables[table]) return tables[table];
      return createMockQuery();
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

/* ── isSkillRoutingEnabled ───────────────────────────────────── */

describe("isSkillRoutingEnabled", () => {
  const originalEnv = process.env.SKILL_ROUTING_ENABLED;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.SKILL_ROUTING_ENABLED = originalEnv;
    } else {
      delete process.env.SKILL_ROUTING_ENABLED;
    }
  });

  it('returns true when SKILL_ROUTING_ENABLED is "true"', () => {
    process.env.SKILL_ROUTING_ENABLED = "true";
    expect(isSkillRoutingEnabled()).toBe(true);
  });

  it('returns false when SKILL_ROUTING_ENABLED is "false"', () => {
    process.env.SKILL_ROUTING_ENABLED = "false";
    expect(isSkillRoutingEnabled()).toBe(false);
  });

  it("returns false when SKILL_ROUTING_ENABLED is not set", () => {
    delete process.env.SKILL_ROUTING_ENABLED;
    expect(isSkillRoutingEnabled()).toBe(false);
  });

  it("returns false when SKILL_ROUTING_ENABLED is empty string", () => {
    process.env.SKILL_ROUTING_ENABLED = "";
    expect(isSkillRoutingEnabled()).toBe(false);
  });
});

/* ── inferCategoryFromRules ──────────────────────────────────── */

describe("inferCategoryFromRules", () => {
  it("returns null when no routing rules exist", async () => {
    const rulesQuery = createMockQuery([]);
    const db = createMockDb({ routing_rules: rulesQuery });

    const result = await inferCategoryFromRules({
      db,
      workspaceId: "ws_1",
      text: "Hello world",
    });

    expect(result).toBeNull();
  });

  it("matches a keyword in the text (case-insensitive)", async () => {
    const rulesQuery = createMockQuery([
      { id: "r1", category_id: "cat_billing", keywords: ["invoice", "payment"] },
    ]);
    const categoriesQuery = createMockQuery([
      { id: "cat_billing", key: "billing", label: "Billing" },
    ]);

    const db = createMockDb({
      routing_rules: rulesQuery,
      routing_categories: categoriesQuery,
    });

    const result = await inferCategoryFromRules({
      db,
      workspaceId: "ws_1",
      text: "I need help with my Invoice please",
    });

    expect(result).not.toBeNull();
    expect(result?.categoryId).toBe("cat_billing");
    expect(result?.matchedKeyword).toBe("invoice");
  });

  it("returns null when no keywords match", async () => {
    const rulesQuery = createMockQuery([
      { id: "r1", category_id: "cat_billing", keywords: ["invoice", "payment"] },
    ]);
    const categoriesQuery = createMockQuery([
      { id: "cat_billing", key: "billing", label: "Billing" },
    ]);

    const db = createMockDb({
      routing_rules: rulesQuery,
      routing_categories: categoriesQuery,
    });

    const result = await inferCategoryFromRules({
      db,
      workspaceId: "ws_1",
      text: "I have a general question",
    });

    expect(result).toBeNull();
  });

  it("returns null when rules have no category_ids", async () => {
    const rulesQuery = createMockQuery([
      { id: "r1", category_id: "", keywords: ["hello"] },
    ]);

    const db = createMockDb({ routing_rules: rulesQuery });

    const result = await inferCategoryFromRules({
      db,
      workspaceId: "ws_1",
      text: "hello there",
    });

    // category_id is empty string → filtered out
    expect(result).toBeNull();
  });

  it("handles rules with non-array keywords gracefully", async () => {
    const rulesQuery = createMockQuery([
      { id: "r1", category_id: "cat_1", keywords: null },
    ]);
    const categoriesQuery = createMockQuery([
      { id: "cat_1", key: "general", label: "General" },
    ]);

    const db = createMockDb({
      routing_rules: rulesQuery,
      routing_categories: categoriesQuery,
    });

    const result = await inferCategoryFromRules({
      db,
      workspaceId: "ws_1",
      text: "test message",
    });

    expect(result).toBeNull();
  });

  it("matches first keyword by category key sort order", async () => {
    const rulesQuery = createMockQuery([
      { id: "r2", category_id: "cat_support", keywords: ["help"] },
      { id: "r1", category_id: "cat_billing", keywords: ["help"] },
    ]);
    const categoriesQuery = createMockQuery([
      { id: "cat_support", key: "support", label: "Support" },
      { id: "cat_billing", key: "billing", label: "Billing" },
    ]);

    const db = createMockDb({
      routing_rules: rulesQuery,
      routing_categories: categoriesQuery,
    });

    const result = await inferCategoryFromRules({
      db,
      workspaceId: "ws_1",
      text: "I need help",
    });

    expect(result).not.toBeNull();
    // "billing" comes before "support" alphabetically
    expect(result?.categoryId).toBe("cat_billing");
  });

  it("trims and lowercases keywords before matching", async () => {
    const rulesQuery = createMockQuery([
      { id: "r1", category_id: "cat_1", keywords: ["  URGENT  "] },
    ]);
    const categoriesQuery = createMockQuery([
      { id: "cat_1", key: "priority", label: "Priority" },
    ]);

    const db = createMockDb({
      routing_rules: rulesQuery,
      routing_categories: categoriesQuery,
    });

    const result = await inferCategoryFromRules({
      db,
      workspaceId: "ws_1",
      text: "this is urgent!",
    });

    expect(result).not.toBeNull();
    expect(result?.matchedKeyword).toBe("urgent");
  });
});

/* ── routeToCategoryTeam ─────────────────────────────────────── */

describe("routeToCategoryTeam", () => {
  it("returns error when conversation is not found", async () => {
    const convQuery = createMockQuery(null, null);
    const db = createMockDb({ conversations: convQuery });

    const result = await routeToCategoryTeam({
      db,
      workspaceId: "ws_1",
      conversationId: "conv_not_found",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("conversation_not_found");
    }
  });

  it("returns routed:false when no category is available", async () => {
    const convQuery = createMockQuery({
      id: "conv_1",
      category_id: null,
      team_id: null,
      assigned_member_id: null,
      assigned_to: null,
    });
    const db = createMockDb({ conversations: convQuery });

    const result = await routeToCategoryTeam({
      db,
      workspaceId: "ws_1",
      conversationId: "conv_1",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.routed).toBe(false);
    }
  });

  it("returns routed:false when no teams are mapped to the category", async () => {
    const convQuery = createMockQuery({
      id: "conv_1",
      category_id: "cat_1",
      team_id: null,
      assigned_member_id: null,
      assigned_to: null,
    });
    const catQuery = createMockQuery({
      id: "cat_1",
      key: "billing",
      label: "Billing",
    });
    const teamCatQuery = createMockQuery([]);

    const db = createMockDb({
      conversations: convQuery,
      routing_categories: catQuery,
      team_categories: teamCatQuery,
    });

    const result = await routeToCategoryTeam({
      db,
      workspaceId: "ws_1",
      conversationId: "conv_1",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.routed).toBe(false);
    }
  });
});

/* ── maybeAutoRouteInbound ───────────────────────────────────── */

describe("maybeAutoRouteInbound", () => {
  const originalEnv = process.env.SKILL_ROUTING_ENABLED;

  beforeEach(() => {
    process.env.SKILL_ROUTING_ENABLED = "true";
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.SKILL_ROUTING_ENABLED = originalEnv;
    } else {
      delete process.env.SKILL_ROUTING_ENABLED;
    }
  });

  it("does nothing when skill routing is disabled", async () => {
    process.env.SKILL_ROUTING_ENABLED = "false";
    const db = createMockDb({});

    await maybeAutoRouteInbound({
      db,
      workspaceId: "ws_1",
      conversationId: "conv_1",
      text: "test",
    });

    // db.from should not be called
    expect(db.from).not.toHaveBeenCalled();
  });

  it("does nothing when conversation is not found", async () => {
    const convQuery = createMockQuery(null);
    const db = createMockDb({ conversations: convQuery });

    await maybeAutoRouteInbound({
      db,
      workspaceId: "ws_1",
      conversationId: "conv_missing",
      text: "test",
    });

    // Only conversations table should be queried
    expect(db.from).toHaveBeenCalledWith("conversations");
  });
});
