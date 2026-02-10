import { describe, it, expect } from "vitest";
import {
  createMockWorkspace,
  createMockUser,
  createMockContact,
  createMockThread,
  createMockMessage,
  createMockSupabase,
  assertWorkspaceScoped,
} from "./test-utils";

describe("test-utils", () => {
  describe("createMockWorkspace", () => {
    it("creates workspace with default values", () => {
      const ws = createMockWorkspace();
      expect(ws.id).toMatch(/^ws_test_/);
      expect(ws.name).toBe("Test Workspace");
      expect(ws.slug).toBe("test-workspace");
      expect(ws.workspace_type).toBe("team");
    });

    it("allows overriding fields", () => {
      const ws = createMockWorkspace({ name: "Custom", slug: "custom" });
      expect(ws.name).toBe("Custom");
      expect(ws.slug).toBe("custom");
    });

    it("generates unique IDs", () => {
      const ws1 = createMockWorkspace();
      const ws2 = createMockWorkspace();
      expect(ws1.id).not.toBe(ws2.id);
    });
  });

  describe("createMockUser", () => {
    it("creates user with default values", () => {
      const user = createMockUser();
      expect(user.id).toMatch(/^user_/);
      expect(user.email).toBe("test@example.com");
      expect(user.email_confirmed_at).toBeTruthy();
    });

    it("allows custom email", () => {
      const user = createMockUser({ email: "admin@gigaviz.com" });
      expect(user.email).toBe("admin@gigaviz.com");
    });
  });

  describe("createMockContact", () => {
    it("creates contact scoped to workspace", () => {
      const contact = createMockContact("ws_123");
      expect(contact.workspace_id).toBe("ws_123");
      expect(contact.normalized_phone).toBe("+6281234567890");
      expect(contact.tags).toEqual([]);
    });
  });

  describe("createMockThread", () => {
    it("creates thread linked to workspace and contact", () => {
      const thread = createMockThread("ws_123", "contact_456");
      expect(thread.workspace_id).toBe("ws_123");
      expect(thread.contact_id).toBe("contact_456");
      expect(thread.channel).toBe("whatsapp");
      expect(thread.status).toBe("open");
    });
  });

  describe("createMockMessage", () => {
    it("creates message linked to workspace and thread", () => {
      const msg = createMockMessage("ws_123", "thread_789");
      expect(msg.workspace_id).toBe("ws_123");
      expect(msg.thread_id).toBe("thread_789");
      expect(msg.direction).toBe("inbound");
      expect(msg.content).toBe("Hello, test message");
    });
  });

  describe("createMockSupabase", () => {
    it("creates chainable query builder", () => {
      const db = createMockSupabase();
      expect(typeof db.from).toBe("function");
      expect(typeof db.rpc).toBe("function");
    });

    it("from() returns query builder with select/insert/eq", () => {
      const db = createMockSupabase();
      const query = db.from("contacts");
      expect(typeof query.select).toBe("function");
      expect(typeof query.insert).toBe("function");
      expect(typeof query.eq).toBe("function");
    });
  });

  describe("assertWorkspaceScoped", () => {
    it("passes when all rows match workspace", () => {
      const rows = [
        { id: "1", workspace_id: "ws_123" },
        { id: "2", workspace_id: "ws_123" },
      ];
      expect(() => assertWorkspaceScoped(rows, "ws_123")).not.toThrow();
    });

    it("throws when a row has wrong workspace", () => {
      const rows = [
        { id: "1", workspace_id: "ws_123" },
        { id: "2", workspace_id: "ws_OTHER" },
      ];
      expect(() => assertWorkspaceScoped(rows, "ws_123")).toThrow();
    });
  });
});
