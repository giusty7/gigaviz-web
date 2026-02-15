/**
 * Tests for lib/audit.ts — Audit event types and type integrity
 */
import { describe, it, expect } from "vitest";
import type { AuditAction, AuditEventInput } from "@/lib/audit";

describe("AuditAction type coverage", () => {
  const allActions: AuditAction[] = [
    "billing.requested",
    "feature.interest",
    "workspace.created",
    "workspace.updated",
    "workspace.deleted",
    "member.role_updated",
    "member.invited",
    "member.removed",
    "tokens.topup_requested",
    "tokens.topup_paid",
    "tokens.consumed",
    "contact.created",
    "contact.imported",
    "contact.exported",
    "contact.deleted",
    "template.created",
    "template.synced",
    "template.deleted",
    "message.sent",
    "message.received",
    "automation.created",
    "automation.updated",
    "automation.deleted",
    "auth.login",
    "auth.logout",
    "settings.updated",
  ];

  it("has 26 defined audit action types", () => {
    expect(allActions).toHaveLength(26);
  });

  it("all actions follow domain.action pattern", () => {
    for (const action of allActions) {
      expect(action).toMatch(/^[a-z]+\.[a-z_]+$/);
    }
  });

  it("covers all expected domains", () => {
    const domains = [...new Set(allActions.map((a) => a.split(".")[0]))];
    expect(domains).toContain("billing");
    expect(domains).toContain("workspace");
    expect(domains).toContain("member");
    expect(domains).toContain("tokens");
    expect(domains).toContain("contact");
    expect(domains).toContain("template");
    expect(domains).toContain("message");
    expect(domains).toContain("automation");
    expect(domains).toContain("auth");
    expect(domains).toContain("settings");
    expect(domains).toContain("feature");
  });

  it("has unique actions", () => {
    expect(new Set(allActions).size).toBe(allActions.length);
  });
});

describe("AuditEventInput type shape", () => {
  it("validates a complete input", () => {
    const input: AuditEventInput = {
      workspaceId: "ws-123",
      actorUserId: "user-123",
      actorEmail: "admin@example.com",
      action: "workspace.created",
      meta: { name: "Test Workspace" },
    };
    expect(input.workspaceId).toBe("ws-123");
    expect(input.actorUserId).toBe("user-123");
    expect(input.action).toBe("workspace.created");
    expect(input.meta).toEqual({ name: "Test Workspace" });
  });

  it("allows null optional fields", () => {
    const input: AuditEventInput = {
      workspaceId: "ws-123",
      actorUserId: null,
      actorEmail: null,
      action: "settings.updated",
      meta: null,
    };
    expect(input.actorUserId).toBeNull();
    expect(input.actorEmail).toBeNull();
    expect(input.meta).toBeNull();
  });

  it("allows undefined optional fields", () => {
    const input: AuditEventInput = {
      workspaceId: "ws-123",
      action: "auth.login",
    };
    expect(input.actorUserId).toBeUndefined();
    expect(input.meta).toBeUndefined();
  });

  it("allows custom string actions (extensible)", () => {
    const input: AuditEventInput = {
      workspaceId: "ws-123",
      action: "custom.new_action",
    };
    expect(input.action).toBe("custom.new_action");
  });
});
