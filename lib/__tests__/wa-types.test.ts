import { describe, it, expect } from "vitest";
import type { WaContact, OptInStatus, SegmentRules } from "@/types/wa-contacts";
import type { WaTemplate, WaSendJob } from "@/types/wa-templates";

describe("WaContact type (canonical from wa-contacts)", () => {
  it("has correct shape with opt_in_status", () => {
    const contact: WaContact = {
      id: "c_1",
      workspace_id: "ws_1",
      normalized_phone: "+628123",
      display_name: "Test User",
      tags: ["customer"],
      custom_fields: { company: "Acme" },
      opt_in_status: "opted_in",
      opt_in_at: "2026-01-01T00:00:00Z",
      opt_out_at: null,
      source: "import",
      last_seen_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      wa_id: "628123",
      phone: "+628123",
      profile_name: "Test",
    };
    expect(contact.opt_in_status).toBe("opted_in");
    expect(contact.custom_fields).toHaveProperty("company");
  });

  it("OptInStatus type covers all states", () => {
    const statuses: OptInStatus[] = ["unknown", "opted_in", "opted_out"];
    expect(statuses).toHaveLength(3);
  });
});

describe("WaTemplate type", () => {
  it("has required fields", () => {
    const template: WaTemplate = {
      id: "t_1",
      workspace_id: "ws_1",
      phone_number_id: "pn_1",
      name: "welcome_msg",
      language: "en",
      status: "APPROVED",
      category: "MARKETING",
      body: "Hello {{1}}!",
      header: null,
      footer: null,
      buttons: null,
      meta_template_id: "mt_1",
      meta_payload: null,
      meta_response: null,
      components_json: null,
      variable_count: 1,
      has_buttons: false,
      quality_score: "GREEN",
      rejection_reason: null,
      last_synced_at: "2026-01-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(template.status).toBe("APPROVED");
    expect(template.variable_count).toBe(1);
  });
});

describe("WaSendJob type", () => {
  it("has correct status enum", () => {
    const validStatuses: WaSendJob["status"][] = [
      "pending",
      "processing",
      "completed",
      "failed",
      "cancelled",
    ];
    expect(validStatuses).toHaveLength(5);
  });
});

describe("SegmentRules type", () => {
  it("supports filtering configuration", () => {
    const rules: SegmentRules = {
      includeTags: ["vip", "active"],
      excludeTags: ["blocked"],
      customFieldFilters: [
        { field: "company", operator: "equals", value: "Acme" },
        { field: "notes", operator: "exists" },
      ],
      optInOnly: true,
    };
    expect(rules.includeTags).toHaveLength(2);
    expect(rules.customFieldFilters).toHaveLength(2);
  });
});
