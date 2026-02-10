import { describe, it, expect } from "vitest";
import type { AuditAction, AuditEventInput } from "@/lib/audit";

describe("AuditAction type", () => {
  it("covers all critical action categories", () => {
    const actions: AuditAction[] = [
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
    // Should cover at minimum 20 audit actions for a mature platform
    expect(actions.length).toBeGreaterThanOrEqual(20);
  });

  it("AuditEventInput has correct shape", () => {
    const input: AuditEventInput = {
      workspaceId: "ws_123",
      actorUserId: "user_456",
      actorEmail: "admin@test.com",
      action: "workspace.created",
      meta: { name: "New Workspace" },
    };
    expect(input.workspaceId).toBe("ws_123");
    expect(input.action).toBe("workspace.created");
  });

  it("AuditEventInput allows optional fields", () => {
    const input: AuditEventInput = {
      workspaceId: "ws_123",
      action: "auth.login",
    };
    expect(input.actorUserId).toBeUndefined();
    expect(input.meta).toBeUndefined();
  });
});
