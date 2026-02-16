/**
 * Tests for Studio-related entitlement checks
 * Validates canAccess() for studio/graph/tracks/office across all plan tiers
 */
import { describe, it, expect } from "vitest";
import {
  canAccess,
  canonicalizePlanId,
  getPlanFeatures,
  getPlanMeta,
  planMeta,
  type AccessContext,
  type FeatureKey,
  type PlanId,
} from "@/lib/entitlements";

// ═══════════════════════════════════════════════════════════════════
// canAccess — Studio feature keys per plan tier
// ═══════════════════════════════════════════════════════════════════
describe("canAccess — Studio features per plan", () => {
  const studioFeatures: FeatureKey[] = ["office", "graph", "tracks", "studio", "studio_graph"];

  // Define expected access matrix:
  // plan → which Studio features should be accessible
  const accessMatrix: Record<string, Partial<Record<FeatureKey, boolean>>> = {
    free: { office: false, graph: false, tracks: false, studio: false, studio_graph: false },
    starter: { office: true, graph: false, tracks: false, studio: false, studio_graph: false },
    growth: { office: true, graph: true, tracks: true, studio: false, studio_graph: false },
    business: { office: true, graph: true, tracks: true, studio: true, studio_graph: true },
    enterprise: { office: true, graph: true, tracks: true, studio: true, studio_graph: true },
  };

  for (const [planId, featureMap] of Object.entries(accessMatrix)) {
    describe(`plan: ${planId}`, () => {
      const ctx: AccessContext = { plan_id: planId as PlanId };

      for (const feature of studioFeatures) {
        const expected = featureMap[feature];
        it(`${expected ? "✅ grants" : "🚫 denies"} ${feature}`, () => {
          expect(canAccess(ctx, feature)).toBe(expected);
        });
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// canAccess — Admin override
// ═══════════════════════════════════════════════════════════════════
describe("canAccess — admin override", () => {
  it("admin on free plan can access studio", () => {
    const ctx: AccessContext = { plan_id: "free", is_admin: true };
    expect(canAccess(ctx, "studio")).toBe(true);
  });

  it("admin on free plan can access graph", () => {
    const ctx: AccessContext = { plan_id: "free", is_admin: true };
    expect(canAccess(ctx, "graph")).toBe(true);
  });

  it("admin on free plan can access all studio features", () => {
    const ctx: AccessContext = { plan_id: "free", is_admin: true };
    const features: FeatureKey[] = ["office", "graph", "tracks", "studio", "studio_graph"];
    for (const f of features) {
      expect(canAccess(ctx, f)).toBe(true);
    }
  });

  it("is_admin=false does not grant override", () => {
    const ctx: AccessContext = { plan_id: "free", is_admin: false };
    expect(canAccess(ctx, "studio")).toBe(false);
  });

  it("is_admin=null does not grant override", () => {
    const ctx: AccessContext = { plan_id: "free", is_admin: null };
    expect(canAccess(ctx, "studio")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// canAccess — Entitlement overrides
// ═══════════════════════════════════════════════════════════════════
describe("canAccess — entitlement overrides", () => {
  it("free plan with studio entitlement can access studio", () => {
    const ctx: AccessContext = {
      plan_id: "free",
      effectiveEntitlements: ["studio"],
    };
    expect(canAccess(ctx, "studio")).toBe(true);
  });

  it("free plan with graph entitlement can access graph", () => {
    const ctx: AccessContext = {
      plan_id: "free",
      effectiveEntitlements: ["graph"],
    };
    expect(canAccess(ctx, "graph")).toBe(true);
  });

  it("starter plan with tracks entitlement can access tracks (upgrade)", () => {
    const ctx: AccessContext = {
      plan_id: "starter",
      effectiveEntitlements: ["tracks"],
    };
    expect(canAccess(ctx, "tracks")).toBe(true);
  });

  it("entitlement for one feature does not grant another", () => {
    const ctx: AccessContext = {
      plan_id: "free",
      effectiveEntitlements: ["graph"],
    };
    expect(canAccess(ctx, "studio")).toBe(false);
    expect(canAccess(ctx, "tracks")).toBe(false);
  });

  it("empty entitlement array does not grant access", () => {
    const ctx: AccessContext = {
      plan_id: "free",
      effectiveEntitlements: [],
    };
    expect(canAccess(ctx, "studio")).toBe(false);
  });

  it("null entitlement array does not grant access", () => {
    const ctx: AccessContext = {
      plan_id: "free",
      effectiveEntitlements: null,
    };
    expect(canAccess(ctx, "studio")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// canAccess — Legacy plan IDs
// ═══════════════════════════════════════════════════════════════════
describe("canAccess — legacy plan IDs", () => {
  it("team_pro grants studio (same as business)", () => {
    const ctx: AccessContext = { plan_id: "team_pro" as PlanId };
    expect(canAccess(ctx, "studio")).toBe(true);
    expect(canAccess(ctx, "studio_graph")).toBe(true);
  });

  it("ind_pro grants graph and tracks (same as growth)", () => {
    const ctx: AccessContext = { plan_id: "ind_pro" as PlanId };
    expect(canAccess(ctx, "graph")).toBe(true);
    expect(canAccess(ctx, "tracks")).toBe(true);
    expect(canAccess(ctx, "studio")).toBe(false);
  });

  it("ind_starter grants office (same as starter)", () => {
    const ctx: AccessContext = { plan_id: "ind_starter" as PlanId };
    expect(canAccess(ctx, "office")).toBe(true);
    expect(canAccess(ctx, "graph")).toBe(false);
  });

  it("free_locked denies all studio features", () => {
    const ctx: AccessContext = { plan_id: "free_locked" as PlanId };
    expect(canAccess(ctx, "office")).toBe(false);
    expect(canAccess(ctx, "graph")).toBe(false);
    expect(canAccess(ctx, "studio")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// canAccess — Base features on all plans
// ═══════════════════════════════════════════════════════════════════
describe("canAccess — base features on all plans", () => {
  const plans: PlanId[] = ["free", "starter", "growth", "business", "enterprise"];
  const baseFeatures: FeatureKey[] = [
    "dashboard_home",
    "account_settings",
    "plan_comparison_view",
    "tokens_view",
    "billing_manage",
  ];

  for (const plan of plans) {
    it(`${plan} plan grants all base features`, () => {
      const ctx: AccessContext = { plan_id: plan };
      for (const f of baseFeatures) {
        expect(canAccess(ctx, f)).toBe(true);
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// canAccess — unknown/missing plan fallback
// ═══════════════════════════════════════════════════════════════════
describe("canAccess — unknown plan fallback", () => {
  it("unknown plan_id falls back to base features only", () => {
    const ctx: AccessContext = { plan_id: "nonexistent" as PlanId };
    expect(canAccess(ctx, "dashboard_home")).toBe(true);
    expect(canAccess(ctx, "studio")).toBe(false);
    expect(canAccess(ctx, "office")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// canonicalizePlanId
// ═══════════════════════════════════════════════════════════════════
describe("canonicalizePlanId", () => {
  it("maps free_locked → free", () => {
    expect(canonicalizePlanId("free_locked")).toBe("free");
  });

  it("maps ind_starter → starter", () => {
    expect(canonicalizePlanId("ind_starter")).toBe("starter");
  });

  it("maps ind_pro → growth", () => {
    expect(canonicalizePlanId("ind_pro")).toBe("growth");
  });

  it("maps team_starter → growth", () => {
    expect(canonicalizePlanId("team_starter")).toBe("growth");
  });

  it("maps team_pro → business", () => {
    expect(canonicalizePlanId("team_pro")).toBe("business");
  });

  it("passes through canonical plan IDs unchanged", () => {
    const canonical: PlanId[] = ["free", "starter", "growth", "business", "enterprise"];
    for (const id of canonical) {
      expect(canonicalizePlanId(id)).toBe(id);
    }
  });

  it("returns free for null", () => {
    expect(canonicalizePlanId(null)).toBe("free");
  });

  it("returns free for undefined", () => {
    expect(canonicalizePlanId(undefined)).toBe("free");
  });

  it("returns free for unknown string", () => {
    expect(canonicalizePlanId("random_plan")).toBe("free");
  });
});

// ═══════════════════════════════════════════════════════════════════
// getPlanFeatures
// ═══════════════════════════════════════════════════════════════════
describe("getPlanFeatures", () => {
  it("free plan returns only base features", () => {
    const features = getPlanFeatures("free");
    expect(features).toContain("dashboard_home");
    expect(features).not.toContain("meta_hub");
    expect(features).not.toContain("studio");
  });

  it("business plan includes studio and studio_graph", () => {
    const features = getPlanFeatures("business");
    expect(features).toContain("studio");
    expect(features).toContain("studio_graph");
    expect(features).toContain("marketplace");
    expect(features).toContain("apps");
  });

  it("growth plan includes graph and tracks but not studio", () => {
    const features = getPlanFeatures("growth");
    expect(features).toContain("graph");
    expect(features).toContain("tracks");
    expect(features).not.toContain("studio");
    expect(features).not.toContain("studio_graph");
  });

  it("starter plan includes office but not graph", () => {
    const features = getPlanFeatures("starter");
    expect(features).toContain("office");
    expect(features).not.toContain("graph");
    expect(features).not.toContain("tracks");
  });
});

// ═══════════════════════════════════════════════════════════════════
// getPlanMeta
// ═══════════════════════════════════════════════════════════════════
describe("getPlanMeta", () => {
  it("returns correct meta for business plan", () => {
    const meta = getPlanMeta("business");
    expect(meta.plan_id).toBe("business");
    expect(meta.seat_limit).toBe(25);
    expect(meta.billing_mode).toBe("team");
  });

  it("returns free plan for null", () => {
    const meta = getPlanMeta(null);
    expect(meta.plan_id).toBe("free");
  });

  it("returns free plan for undefined", () => {
    const meta = getPlanMeta(undefined);
    expect(meta.plan_id).toBe("free");
  });

  it("returns free plan for unknown plan_id", () => {
    const meta = getPlanMeta("xyz_unknown");
    expect(meta.plan_id).toBe("free");
  });

  it("all plan metas have required fields", () => {
    for (const meta of planMeta) {
      expect(meta.plan_id).toBeTruthy();
      expect(meta.name).toBeTruthy();
      expect(meta.billing_mode).toMatch(/individual|team/);
      expect(meta.seat_limit).toBeGreaterThan(0);
      expect(meta.highlightBenefits.length).toBeGreaterThan(0);
      expect(meta.ctaLabel).toBeTruthy();
    }
  });

  it("enterprise has highest seat limit", () => {
    const enterprise = getPlanMeta("enterprise");
    const business = getPlanMeta("business");
    expect(enterprise.seat_limit).toBeGreaterThan(business.seat_limit);
  });
});
