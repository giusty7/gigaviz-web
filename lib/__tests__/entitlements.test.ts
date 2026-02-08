import { describe, it, expect } from "vitest";
import {
  getPlanMeta,
  canAccess,
  getPlanFeatures,
  planMeta,
  type PlanId,
  type AccessContext,
  type FeatureKey,
} from "../entitlements";

describe("getPlanMeta", () => {
  it("returns free_locked plan for null", () => {
    const plan = getPlanMeta(null);
    expect(plan.plan_id).toBe("free_locked");
  });

  it("returns free_locked plan for undefined", () => {
    const plan = getPlanMeta(undefined);
    expect(plan.plan_id).toBe("free_locked");
  });

  it("returns correct plan for each valid plan_id", () => {
    const ids: PlanId[] = ["free_locked", "ind_starter", "ind_pro", "team_starter", "team_pro"];
    for (const id of ids) {
      const plan = getPlanMeta(id);
      expect(plan.plan_id).toBe(id);
      expect(plan.name).toBeTruthy();
    }
  });

  it("returns fallback (free_locked) for unknown plan ID", () => {
    const plan = getPlanMeta("nonexistent_plan");
    expect(plan.plan_id).toBe("free_locked");
  });

  it("every plan has required fields", () => {
    for (const plan of planMeta) {
      expect(plan.plan_id).toBeTruthy();
      expect(plan.name).toBeTruthy();
      expect(plan.billing_mode).toMatch(/individual|team/);
      expect(plan.seat_limit).toBeGreaterThan(0);
      expect(plan.highlightBenefits.length).toBeGreaterThan(0);
      expect(plan.ctaLabel).toBeTruthy();
    }
  });
});

describe("canAccess", () => {
  it("admin can access any feature", () => {
    const ctx: AccessContext = { plan_id: "free_locked", is_admin: true };
    expect(canAccess(ctx, "meta_hub")).toBe(true);
    expect(canAccess(ctx, "mass_blast")).toBe(true);
    expect(canAccess(ctx, "audit_log")).toBe(true);
  });

  it("free_locked can access dashboard_home but NOT meta_hub", () => {
    const ctx: AccessContext = { plan_id: "free_locked" };
    expect(canAccess(ctx, "dashboard_home")).toBe(true);
    expect(canAccess(ctx, "meta_hub")).toBe(false);
  });

  it("ind_starter can access office but NOT meta_hub", () => {
    const ctx: AccessContext = { plan_id: "ind_starter" };
    expect(canAccess(ctx, "office")).toBe(true);
    expect(canAccess(ctx, "meta_hub")).toBe(false);
  });

  it("ind_pro can access meta_hub but NOT mass_blast", () => {
    const ctx: AccessContext = { plan_id: "ind_pro" };
    expect(canAccess(ctx, "meta_hub")).toBe(true);
    expect(canAccess(ctx, "mass_blast")).toBe(false);
  });

  it("team_pro can access everything", () => {
    const ctx: AccessContext = { plan_id: "team_pro" };
    expect(canAccess(ctx, "meta_hub")).toBe(true);
    expect(canAccess(ctx, "mass_blast")).toBe(true);
    expect(canAccess(ctx, "analytics")).toBe(true);
    expect(canAccess(ctx, "audit_log")).toBe(true);
  });

  it("effectiveEntitlements override plan features", () => {
    const ctx: AccessContext = {
      plan_id: "free_locked",
      effectiveEntitlements: ["meta_hub", "mass_blast"],
    };
    expect(canAccess(ctx, "meta_hub")).toBe(true);
    expect(canAccess(ctx, "mass_blast")).toBe(true);
    // But not features outside entitlements+plan
    expect(canAccess(ctx, "audit_log")).toBe(false);
  });

  it("base features accessible to all plans", () => {
    const baseFeatures: FeatureKey[] = [
      "dashboard_home",
      "account_settings",
      "plan_comparison_view",
      "tokens_view",
      "billing_manage",
    ];
    const plans: PlanId[] = ["free_locked", "ind_starter", "ind_pro", "team_starter", "team_pro"];
    for (const planId of plans) {
      const ctx: AccessContext = { plan_id: planId };
      for (const feature of baseFeatures) {
        expect(canAccess(ctx, feature)).toBe(true);
      }
    }
  });
});

describe("getPlanFeatures", () => {
  it("returns base features for free_locked", () => {
    const features = getPlanFeatures("free_locked");
    expect(features).toContain("dashboard_home");
    expect(features).not.toContain("meta_hub");
  });

  it("team_pro has more features than ind_starter", () => {
    const starterFeatures = getPlanFeatures("ind_starter");
    const proFeatures = getPlanFeatures("team_pro");
    expect(proFeatures.length).toBeGreaterThan(starterFeatures.length);
  });

  it("team_pro includes mass_blast and audit_log", () => {
    const features = getPlanFeatures("team_pro");
    expect(features).toContain("mass_blast");
    expect(features).toContain("audit_log");
  });

  it("ind_pro does NOT include mass_blast", () => {
    const features = getPlanFeatures("ind_pro");
    expect(features).not.toContain("mass_blast");
  });
});
