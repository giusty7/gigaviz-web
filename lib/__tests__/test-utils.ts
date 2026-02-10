/**
 * Test utilities for Gigaviz tests.
 *
 * Provides common helpers, factory functions, and mocks
 * for writing concise, readable tests.
 */

import { vi } from "vitest";

// ─── Factory Functions ────────────────────────────────────────────────

/** Create a mock workspace for testing */
export function createMockWorkspace(overrides?: Partial<MockWorkspace>): MockWorkspace {
  return {
    id: "ws_test_" + Math.random().toString(36).slice(2, 8),
    name: "Test Workspace",
    slug: "test-workspace",
    owner_id: "user_owner_123",
    workspace_type: "team",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/** Create a mock user for testing */
export function createMockUser(overrides?: Partial<MockUser>): MockUser {
  return {
    id: "user_" + Math.random().toString(36).slice(2, 8),
    email: "test@example.com",
    email_confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/** Create a mock contact for testing */
export function createMockContact(
  workspaceId: string,
  overrides?: Record<string, unknown>
) {
  return {
    id: "contact_" + Math.random().toString(36).slice(2, 8),
    workspace_id: workspaceId,
    normalized_phone: "+6281234567890",
    display_name: "Test Contact",
    wa_id: "6281234567890",
    phone: "+6281234567890",
    profile_name: "Test",
    email: null,
    tags: [],
    custom_fields: {},
    opt_in_status: "unknown",
    source: "test",
    last_seen_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/** Create a mock thread for testing */
export function createMockThread(
  workspaceId: string,
  contactId: string,
  overrides?: Record<string, unknown>
) {
  return {
    id: "thread_" + Math.random().toString(36).slice(2, 8),
    workspace_id: workspaceId,
    contact_id: contactId,
    channel: "whatsapp",
    status: "open",
    priority: "med",
    assignee_id: null,
    tags: [],
    subject: null,
    last_message_at: new Date().toISOString(),
    first_response_at: null,
    resolved_at: null,
    metadata: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/** Create a mock message for testing */
export function createMockMessage(
  workspaceId: string,
  threadId: string,
  overrides?: Record<string, unknown>
) {
  return {
    id: "msg_" + Math.random().toString(36).slice(2, 8),
    workspace_id: workspaceId,
    thread_id: threadId,
    contact_id: null,
    direction: "inbound",
    channel: "whatsapp",
    content: "Hello, test message",
    content_type: "text",
    media_url: null,
    media_type: null,
    wa_message_id: "wamid_" + Math.random().toString(36).slice(2, 8),
    status: "delivered",
    metadata: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Supabase Mock Builder ────────────────────────────────────────────

type QueryResult = {
  data: unknown;
  error: null | { code: string; message: string };
  count?: number;
};

/**
 * Creates a chainable mock Supabase client for testing.
 *
 * Usage:
 * ```ts
 * const mockDb = createMockSupabase({
 *   contacts: [createMockContact("ws_123")],
 * });
 * vi.mocked(supabaseAdmin).mockReturnValue(mockDb);
 * ```
 */
export function createMockSupabase(tableData: Record<string, unknown[]> = {}) {
  const createQueryBuilder = (tableName: string) => {
    let currentData = tableData[tableName] ?? [];
    const filters: Array<(item: Record<string, unknown>) => boolean> = [];

    const builder: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn((data: unknown) => {
        const inserted = Array.isArray(data) ? data : [data];
        currentData = [...currentData, ...inserted];
        return builder;
      }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn((col: string, val: unknown) => {
        filters.push((item) => item[col] === val);
        return builder;
      }),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn(() => {
        const filtered = currentData.filter((item) =>
          filters.every((f) => f(item as Record<string, unknown>))
        );
        return Promise.resolve({
          data: filtered[0] ?? null,
          error: filtered.length === 0 ? null : null,
        } as QueryResult);
      }),
      maybeSingle: vi.fn(() => {
        const filtered = currentData.filter((item) =>
          filters.every((f) => f(item as Record<string, unknown>))
        );
        return Promise.resolve({
          data: filtered[0] ?? null,
          error: null,
        } as QueryResult);
      }),
      then: vi.fn((resolve: (val: QueryResult) => void) => {
        const filtered = currentData.filter((item) =>
          filters.every((f) => f(item as Record<string, unknown>))
        );
        return resolve({
          data: filtered,
          error: null,
          count: filtered.length,
        });
      }),
    };

    return builder;
  };

  return {
    from: vi.fn((tableName: string) => createQueryBuilder(tableName)),
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: createMockUser() },
        error: null,
      }),
    },
  };
}

// ─── Type Definitions ────────────────────────────────────────────────

export type MockWorkspace = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  workspace_type: string;
  created_at: string;
  updated_at: string;
};

export type MockUser = {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
};

// ─── Assertion Helpers ────────────────────────────────────────────────

/** Assert workspace scoping — every row has the expected workspace_id */
export function assertWorkspaceScoped(
  rows: Array<Record<string, unknown>>,
  expectedWorkspaceId: string
) {
  for (const row of rows) {
    if (row.workspace_id !== expectedWorkspaceId) {
      throw new Error(
        `Row ${row.id} has workspace_id=${row.workspace_id}, expected=${expectedWorkspaceId}`
      );
    }
  }
}
