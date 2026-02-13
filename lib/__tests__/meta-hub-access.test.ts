/**
 * Sprint 16: Meta Hub access, config, and entitlement tests
 * Tests pure functions for feature gating and access control
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getMetaHubAccess, type MetaHubAccess } from "@/lib/meta-hub/access";
import { getMetaHubFlags, type MetaHubFlags } from "@/lib/meta-hub/config";
import {
  canAccess,
  getPlanMeta,
  getPlanFeatures,
  planMeta,
  type PlanId,
  type AccessContext,
} from "@/lib/entitlements";

// ---------------------------------------------------------------------------
// getMetaHubAccess
// ---------------------------------------------------------------------------
describe("getMetaHubAccess", () => {
  it("grants full access for team_pro plan", () => {
    const result = getMetaHubAccess({ planId: "team_pro" });
    expect(result).toEqual<MetaHubAccess>({
      metaHub: true,
      templates: true,
      send: true,
      webhooks: true,
    });
  });

  it("grants full access for ind_pro plan", () => {
    const result = getMetaHubAccess({ planId: "ind_pro" });
    expect(result.metaHub).toBe(true);
    expect(result.templates).toBe(true);
    expect(result.send).toBe(true);
    expect(result.webhooks).toBe(true);
  });

  it("denies access for free_locked plan", () => {
    const result = getMetaHubAccess({ planId: "free_locked" });
    expect(result.metaHub).toBe(false);
    expect(result.templates).toBe(false);
    expect(result.send).toBe(false);
    expect(result.webhooks).toBe(false);
  });

  it("denies access for ind_starter plan", () => {
    const result = getMetaHubAccess({ planId: "ind_starter" });
    expect(result.metaHub).toBe(false);
  });

  it("denies access for team_starter plan", () => {
    const result = getMetaHubAccess({ planId: "team_starter" });
    expect(result.metaHub).toBe(false);
  });

  it("grants access when is_admin is true regardless of plan", () => {
    const result = getMetaHubAccess({
      planId: "free_locked",
      isAdmin: true,
    });
    expect(result.metaHub).toBe(true);
    expect(result.templates).toBe(true);
    expect(result.send).toBe(true);
    expect(result.webhooks).toBe(true);
  });

  it("grants access via effectiveEntitlements override", () => {
    const result = getMetaHubAccess({
      planId: "free_locked",
      effectiveEntitlements: ["meta_hub", "meta_templates", "meta_send", "meta_webhooks"],
    });
    expect(result.metaHub).toBe(true);
    expect(result.templates).toBe(true);
    expect(result.send).toBe(true);
    expect(result.webhooks).toBe(true);
  });

  it("grants partial access via effectiveEntitlements", () => {
    const result = getMetaHubAccess({
      planId: "free_locked",
      effectiveEntitlements: ["meta_hub"],
    });
    expect(result.metaHub).toBe(true);
    expect(result.templates).toBe(false);
    expect(result.send).toBe(false);
    expect(result.webhooks).toBe(false);
  });

  it("handles null isAdmin gracefully", () => {
    const result = getMetaHubAccess({
      planId: "free_locked",
      isAdmin: null,
    });
    expect(result.metaHub).toBe(false);
  });

  it("handles null effectiveEntitlements gracefully", () => {
    const result = getMetaHubAccess({
      planId: "free_locked",
      effectiveEntitlements: null,
    });
    expect(result.metaHub).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getMetaHubFlags
// ---------------------------------------------------------------------------
describe("getMetaHubFlags", () => {
  beforeEach(() => {
    vi.stubEnv("META_HUB_WA_ENABLED", "");
    vi.stubEnv("META_HUB_IG_ENABLED", "");
    vi.stubEnv("META_HUB_MS_ENABLED", "");
    vi.stubEnv("META_HUB_ADS_ENABLED", "");
    vi.stubEnv("META_HUB_INSIGHTS_ENABLED", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns default flags when env vars are empty strings", () => {
    // When env var is empty string, toBool("") → fallback
    // WA defaults to true, others default to false
    const flags = getMetaHubFlags();
    expect(flags.waEnabled).toBe(true); // fallback = true
    expect(flags.igEnabled).toBe(false);
    expect(flags.msEnabled).toBe(false);
    expect(flags.adsEnabled).toBe(false);
    expect(flags.insightsEnabled).toBe(false);
  });

  it("enables flags when env vars are 'true'", () => {
    vi.stubEnv("META_HUB_WA_ENABLED", "true");
    vi.stubEnv("META_HUB_IG_ENABLED", "true");
    vi.stubEnv("META_HUB_MS_ENABLED", "true");
    vi.stubEnv("META_HUB_ADS_ENABLED", "true");
    vi.stubEnv("META_HUB_INSIGHTS_ENABLED", "true");
    const flags = getMetaHubFlags();
    expect(flags).toEqual<MetaHubFlags>({
      waEnabled: true,
      igEnabled: true,
      msEnabled: true,
      adsEnabled: true,
      insightsEnabled: true,
    });
  });

  it("returns false for non-true string values", () => {
    vi.stubEnv("META_HUB_IG_ENABLED", "false");
    vi.stubEnv("META_HUB_MS_ENABLED", "1");
    vi.stubEnv("META_HUB_ADS_ENABLED", "yes");
    const flags = getMetaHubFlags();
    expect(flags.igEnabled).toBe(false);
    expect(flags.msEnabled).toBe(false);
    expect(flags.adsEnabled).toBe(false);
  });

  it("is case-insensitive — 'TRUE' treated as true", () => {
    vi.stubEnv("META_HUB_IG_ENABLED", "TRUE");
    vi.stubEnv("META_HUB_MS_ENABLED", "True");
    const flags = getMetaHubFlags();
    expect(flags.igEnabled).toBe(true);
    expect(flags.msEnabled).toBe(true);
  });

  it("returns correct type shape", () => {
    const flags = getMetaHubFlags();
    expect(flags).toHaveProperty("waEnabled");
    expect(flags).toHaveProperty("igEnabled");
    expect(flags).toHaveProperty("msEnabled");
    expect(flags).toHaveProperty("adsEnabled");
    expect(flags).toHaveProperty("insightsEnabled");
    expect(typeof flags.waEnabled).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// canAccess (entitlements)
// ---------------------------------------------------------------------------
describe("canAccess", () => {
  it("grants base features to all plans", () => {
    const plans: PlanId[] = ["free_locked", "ind_starter", "ind_pro", "team_starter", "team_pro"];
    for (const planId of plans) {
      const ctx: AccessContext = { plan_id: planId };
      expect(canAccess(ctx, "dashboard_home"), `${planId} should have dashboard_home`).toBe(true);
      expect(canAccess(ctx, "account_settings"), `${planId} should have account_settings`).toBe(true);
      expect(canAccess(ctx, "tokens_view"), `${planId} should have tokens_view`).toBe(true);
    }
  });

  it("denies meta_hub for free_locked", () => {
    expect(canAccess({ plan_id: "free_locked" }, "meta_hub")).toBe(false);
  });

  it("denies meta_hub for ind_starter", () => {
    expect(canAccess({ plan_id: "ind_starter" }, "meta_hub")).toBe(false);
  });

  it("grants meta_hub for ind_pro", () => {
    expect(canAccess({ plan_id: "ind_pro" }, "meta_hub")).toBe(true);
  });

  it("grants meta_hub for team_pro", () => {
    expect(canAccess({ plan_id: "team_pro" }, "meta_hub")).toBe(true);
  });

  it("grants helper for ind_pro and team_pro", () => {
    expect(canAccess({ plan_id: "ind_pro" }, "helper")).toBe(true);
    expect(canAccess({ plan_id: "team_pro" }, "helper")).toBe(true);
  });

  it("denies helper for free and starter plans", () => {
    expect(canAccess({ plan_id: "free_locked" }, "helper")).toBe(false);
    expect(canAccess({ plan_id: "ind_starter" }, "helper")).toBe(false);
    expect(canAccess({ plan_id: "team_starter" }, "helper")).toBe(false);
  });

  it("admin bypasses all plan restrictions", () => {
    const ctx: AccessContext = { plan_id: "free_locked", is_admin: true };
    expect(canAccess(ctx, "meta_hub")).toBe(true);
    expect(canAccess(ctx, "helper")).toBe(true);
    expect(canAccess(ctx, "mass_blast")).toBe(true);
    expect(canAccess(ctx, "audit_log")).toBe(true);
  });

  it("effectiveEntitlements override grants access", () => {
    const ctx: AccessContext = {
      plan_id: "free_locked",
      effectiveEntitlements: ["meta_hub", "helper"],
    };
    expect(canAccess(ctx, "meta_hub")).toBe(true);
    expect(canAccess(ctx, "helper")).toBe(true);
    expect(canAccess(ctx, "mass_blast")).toBe(false); // Not in override
  });

  it("team_starter gets member management features", () => {
    const ctx: AccessContext = { plan_id: "team_starter" };
    expect(canAccess(ctx, "member_invites")).toBe(true);
    expect(canAccess(ctx, "roles_permissions")).toBe(true);
  });

  it("ind_starter does not get member management features", () => {
    const ctx: AccessContext = { plan_id: "ind_starter" };
    expect(canAccess(ctx, "member_invites")).toBe(false);
    expect(canAccess(ctx, "roles_permissions")).toBe(false);
  });

  it("only team_pro gets mass_blast and analytics", () => {
    expect(canAccess({ plan_id: "team_pro" }, "mass_blast")).toBe(true);
    expect(canAccess({ plan_id: "team_pro" }, "analytics")).toBe(true);
    expect(canAccess({ plan_id: "ind_pro" }, "mass_blast")).toBe(false);
    expect(canAccess({ plan_id: "team_starter" }, "analytics")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getPlanMeta
// ---------------------------------------------------------------------------
describe("getPlanMeta", () => {
  it("returns correct plan for valid plan_id", () => {
    const plan = getPlanMeta("ind_pro");
    expect(plan.plan_id).toBe("ind_pro");
    expect(plan.name).toBe("Individual Pro");
    expect(plan.billing_mode).toBe("individual");
    expect(plan.seat_limit).toBe(1);
  });

  it("returns free_locked as fallback for null", () => {
    const plan = getPlanMeta(null);
    expect(plan.plan_id).toBe("free_locked");
  });

  it("returns free_locked as fallback for undefined", () => {
    const plan = getPlanMeta(undefined);
    expect(plan.plan_id).toBe("free_locked");
  });

  it("returns free_locked as fallback for invalid plan", () => {
    const plan = getPlanMeta("nonexistent_plan");
    expect(plan.plan_id).toBe("free_locked");
  });

  it("all plan metas have required fields", () => {
    for (const plan of planMeta) {
      expect(plan.plan_id).toBeTruthy();
      expect(plan.name).toBeTruthy();
      expect(["individual", "team"]).toContain(plan.billing_mode);
      expect(plan.seat_limit).toBeGreaterThan(0);
      expect(plan.highlightBenefits.length).toBeGreaterThan(0);
      expect(plan.ctaLabel).toBeTruthy();
    }
  });

  it("planMeta has exactly 5 plans", () => {
    expect(planMeta).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// getPlanFeatures
// ---------------------------------------------------------------------------
describe("getPlanFeatures", () => {
  it("free_locked gets base features only", () => {
    const features = getPlanFeatures("free_locked");
    expect(features).toContain("dashboard_home");
    expect(features).toContain("account_settings");
    expect(features).not.toContain("meta_hub");
    expect(features).not.toContain("helper");
  });

  it("ind_pro features include meta_hub and helper", () => {
    const features = getPlanFeatures("ind_pro");
    expect(features).toContain("meta_hub");
    expect(features).toContain("helper");
    expect(features).toContain("meta_templates");
    expect(features).toContain("meta_send");
  });

  it("team_pro has the most features", () => {
    const teamProFeatures = getPlanFeatures("team_pro");
    const otherPlans: PlanId[] = ["free_locked", "ind_starter", "ind_pro", "team_starter"];
    for (const planId of otherPlans) {
      const features = getPlanFeatures(planId);
      expect(teamProFeatures.length).toBeGreaterThanOrEqual(features.length);
    }
  });

  it("each plan features array is non-empty", () => {
    const plans: PlanId[] = ["free_locked", "ind_starter", "ind_pro", "team_starter", "team_pro"];
    for (const planId of plans) {
      const features = getPlanFeatures(planId);
      expect(features.length).toBeGreaterThan(0);
    }
  });
});
