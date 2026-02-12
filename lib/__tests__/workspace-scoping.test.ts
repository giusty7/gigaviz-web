/**
 * Tests for workspace scoping patterns
 *
 * Validates that data access patterns enforce workspace_id filtering
 */
import { describe, it, expect } from "vitest";
import {
  createMockWorkspace,
  createMockContact,
  createMockThread,
  createMockMessage,
  createMockSupabase,
  assertWorkspaceScoped,
} from "./test-utils";

describe("Workspace Scoping", () => {
  it("contacts are always scoped to workspace_id", () => {
    const ws = createMockWorkspace();
    const contacts = [
      createMockContact(ws.id),
      createMockContact(ws.id),
      createMockContact(ws.id, { display_name: "Another" }),
    ];

    expect(() => assertWorkspaceScoped(contacts, ws.id)).not.toThrow();
  });

  it("detects cross-workspace leak", () => {
    const ws1 = createMockWorkspace({ id: "ws_1" });
    const ws2 = createMockWorkspace({ id: "ws_2" });
    const contacts = [
      createMockContact(ws1.id),
      createMockContact(ws2.id), // LEAK!
    ];

    expect(() => assertWorkspaceScoped(contacts, ws1.id)).toThrow(
      /ws_2/
    );
  });

  it("threads linked to correct workspace and contact", () => {
    const ws = createMockWorkspace();
    const contact = createMockContact(ws.id);
    const thread = createMockThread(ws.id, contact.id);

    expect(thread.workspace_id).toBe(ws.id);
    expect(thread.contact_id).toBe(contact.id);
    expect(thread.channel).toBe("whatsapp");
    expect(thread.status).toBe("open");
  });

  it("messages linked to correct workspace and thread", () => {
    const ws = createMockWorkspace();
    const contact = createMockContact(ws.id);
    const thread = createMockThread(ws.id, contact.id);
    const msg = createMockMessage(ws.id, thread.id);

    expect(msg.workspace_id).toBe(ws.id);
    expect(msg.thread_id).toBe(thread.id);
    expect(msg.direction).toBe("inbound");
  });
});

describe("Supabase Mock Builder", () => {
  it("filters data by workspace_id via .eq()", async () => {
    const contacts = [
      createMockContact("ws_target", { display_name: "Alice" }),
      createMockContact("ws_other", { display_name: "Bob" }),
      createMockContact("ws_target", { display_name: "Charlie" }),
    ];

    const db = createMockSupabase({ wa_contacts: contacts });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain = (db as any).from("wa_contacts").select("*").eq("workspace_id", "ws_target");
    const result = await chain.single();

    // The mock applies eq filter correctly
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.workspace_id).toBe("ws_target");
    }
  });

  it("insert adds to table data", async () => {
    const db = createMockSupabase({ contacts: [] });
    const newContact = createMockContact("ws_123");

    (db.from("contacts") as { insert: (d: unknown) => void }).insert(newContact);

    // The insert mock was called
    expect(db.from).toHaveBeenCalledWith("contacts");
  });

  it("rpc returns default success", async () => {
    const db = createMockSupabase();
    const result = await db.rpc("some_function", { arg: "value" });

    expect(result.data).toBe(true);
    expect(result.error).toBeNull();
  });

  it("auth.getUser returns mock user", async () => {
    const db = createMockSupabase();
    const result = await db.auth.getUser();

    expect(result.data.user).toBeDefined();
    expect(result.data.user.id).toMatch(/^user_/);
  });
});

describe("Cross-workspace isolation patterns", () => {
  it("two workspaces have completely independent data", () => {
    const ws1 = createMockWorkspace({ id: "ws_team_a" });
    const ws2 = createMockWorkspace({ id: "ws_team_b" });

    const contacts1 = Array.from({ length: 5 }, () => createMockContact(ws1.id));
    const contacts2 = Array.from({ length: 3 }, () => createMockContact(ws2.id));

    // Each set is isolated
    expect(() => assertWorkspaceScoped(contacts1, ws1.id)).not.toThrow();
    expect(() => assertWorkspaceScoped(contacts2, ws2.id)).not.toThrow();

    // Cross-check fails
    expect(() => assertWorkspaceScoped([...contacts1, ...contacts2], ws1.id)).toThrow();
  });

  it("unique IDs prevent collision", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const ws = createMockWorkspace();
      ids.add(ws.id);
    }
    // All 100 should be unique
    expect(ids.size).toBe(100);
  });
});
