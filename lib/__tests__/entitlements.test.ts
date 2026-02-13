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
  it("returns free plan for null", () => {
    const plan = getPlanMeta(null);
    expect(plan.plan_id).toBe("free");
  });

  it("returns free plan for undefined", () => {
    const plan = getPlanMeta(undefined);
    expect(plan.plan_id).toBe("free");
  });

  it("returns correct plan for each new plan_id", () => {
    const ids: PlanId[] = ["free", "starter", "growth", "business", "enterprise"];
    for (const id of ids) {
      const plan = getPlanMeta(id);
      expect(plan.plan_id).toBe(id);
      expect(plan.name).toBeTruthy();
    }
  });

  it("returns legacy plan entries for backward compat", () => {
    const legacyIds: PlanId[] = ["free_locked", "ind_starter", "ind_pro", "team_starter", "team_pro"];
    for (const id of legacyIds) {
      const plan = getPlanMeta(id);
      expect(plan.plan_id).toBe(id);
      expect(plan.name).toBeTruthy();
    }
  });

  it("returns fallback (free) for unknown plan ID", () => {
    const plan = getPlanMeta("nonexistent_plan");
    expect(plan.plan_id).toBe("free");
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
    const ctx: AccessContext = { plan_id: "free", is_admin: true };
    expect(canAccess(ctx, "meta_hub")).toBe(true);
    expect(canAccess(ctx, "mass_blast")).toBe(true);
    expect(canAccess(ctx, "audit_log")).toBe(true);
  });

  it("free can access dashboard_home but NOT meta_hub", () => {
    const ctx: AccessContext = { plan_id: "free" };
    expect(canAccess(ctx, "dashboard_home")).toBe(true);
    expect(canAccess(ctx, "meta_hub")).toBe(false);
  });

  it("starter can access meta_hub and office but NOT mass_blast", () => {
    const ctx: AccessContext = { plan_id: "starter" };
    expect(canAccess(ctx, "office")).toBe(true);
    expect(canAccess(ctx, "meta_hub")).toBe(true);
    expect(canAccess(ctx, "mass_blast")).toBe(false);
  });

  it("growth can access meta_hub but NOT mass_blast", () => {
    const ctx: AccessContext = { plan_id: "growth" };
    expect(canAccess(ctx, "meta_hub")).toBe(true);
    expect(canAccess(ctx, "mass_blast")).toBe(false);
  });

  it("business can access everything", () => {
    const ctx: AccessContext = { plan_id: "business" };
    expect(canAccess(ctx, "meta_hub")).toBe(true);
    expect(canAccess(ctx, "mass_blast")).toBe(true);
    expect(canAccess(ctx, "analytics")).toBe(true);
    expect(canAccess(ctx, "audit_log")).toBe(true);
  });

  it("effectiveEntitlements override plan features", () => {
    const ctx: AccessContext = {
      plan_id: "free",
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
    const plans: PlanId[] = ["free", "starter", "growth", "business", "enterprise"];
    for (const planId of plans) {
      const ctx: AccessContext = { plan_id: planId };
      for (const feature of baseFeatures) {
        expect(canAccess(ctx, feature)).toBe(true);
      }
    }
  });
});

describe("getPlanFeatures", () => {
  it("returns base features for free", () => {
    const features = getPlanFeatures("free");
    expect(features).toContain("dashboard_home");
    expect(features).not.toContain("meta_hub");
  });

  it("business has more features than starter", () => {
    const starterFeatures = getPlanFeatures("starter");
    const businessFeatures = getPlanFeatures("business");
    expect(businessFeatures.length).toBeGreaterThan(starterFeatures.length);
  });

  it("business includes mass_blast and audit_log", () => {
    const features = getPlanFeatures("business");
    expect(features).toContain("mass_blast");
    expect(features).toContain("audit_log");
  });

  it("growth does NOT include mass_blast", () => {
    const features = getPlanFeatures("growth");
    expect(features).not.toContain("mass_blast");
  });
});
