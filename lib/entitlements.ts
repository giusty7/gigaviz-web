export type FeatureKey =
  // Base features
  | "dashboard_home"
  | "account_settings"
  | "plan_comparison_view"
  | "billing_manage"
  | "tokens_view"
  // 10 Hubs (modules)
  | "core_os"
  | "meta_hub"
  | "studio"
  | "helper"
  | "office"
  | "marketplace"
  | "arena"
  | "pay"
  | "trade"
  | "community"
  // Legacy/capability keys
  | "graph"
  | "tracks"
  | "inbox"
  | "automation"
  | "studio_graph"
  | "mass_blast"
  | "wa_blast"
  | "analytics"
  | "member_invites"
  | "roles_permissions"
  | "audit_log"
  | "meta_connect"
  | "meta_send"
  | "meta_templates"
  | "meta_webhooks";

export type PlanId =
  | "free_locked"
  | "ind_starter"
  | "ind_pro"
  | "team_starter"
  | "team_pro";

export type BillingMode = "individual" | "team";

export type PlanMeta = {
  plan_id: PlanId;
  name: string;
  billing_mode: BillingMode;
  seat_limit: number;
  highlightBenefits: string[];
  ctaLabel: string;
};

const baseFeatures: FeatureKey[] = [
  "dashboard_home",
  "account_settings",
  "plan_comparison_view",
  "tokens_view",
  "billing_manage",
];

const planFeatures: Record<PlanId, FeatureKey[]> = {
  free_locked: baseFeatures,
  ind_starter: [...baseFeatures, "office", "graph"],
  ind_pro: [
    ...baseFeatures,
    "office",
    "graph",
    "helper",
    "tracks",
    "meta_hub",
    "meta_templates",
    "meta_webhooks",
    "meta_send",
  ],
  team_starter: [
    ...baseFeatures,
    "office",
    "graph",
    "member_invites",
    "roles_permissions",
  ],
  team_pro: [
    ...baseFeatures,
    "office",
    "graph",
    "helper",
    "tracks",
    "meta_hub",
    "meta_templates",
    "meta_webhooks",
    "meta_send",
    "meta_connect",
    "member_invites",
    "roles_permissions",
    "mass_blast",
    "analytics",
    "audit_log",
  ],
};

export const planMeta: PlanMeta[] = [
  {
    plan_id: "free_locked",
    name: "Free (Locked)",
    billing_mode: "individual",
    seat_limit: 1,
    highlightBenefits: [
      "Dashboard & plan comparison only",
      "Tokens wallet visibility",
      "Settings access",
    ],
    ctaLabel: "Unlock Features",
  },
  {
    plan_id: "ind_starter",
    name: "Individual Starter",
    billing_mode: "individual",
    seat_limit: 1,
    highlightBenefits: ["Office automation", "Graph previews", "Usage-based tokens"],
    ctaLabel: "Upgrade to Starter",
  },
  {
    plan_id: "ind_pro",
    name: "Individual Pro",
    billing_mode: "individual",
    seat_limit: 1,
    highlightBenefits: [
      "Helper + Tracks",
      "Meta Hub basics",
      "Higher token throughput",
    ],
    ctaLabel: "Go Pro",
  },
  {
    plan_id: "team_starter",
    name: "Team Starter",
    billing_mode: "team",
    seat_limit: 5,
    highlightBenefits: [
      "Shared workspace",
      "Member invites",
      "Role-based access",
    ],
    ctaLabel: "Start a Team",
  },
  {
    plan_id: "team_pro",
    name: "Team Pro",
    billing_mode: "team",
    seat_limit: 25,
    highlightBenefits: [
      "All modules unlocked",
      "Mass blast + analytics",
      "Audit-ready activity logs",
    ],
    ctaLabel: "Unlock Everything",
  },
];

export function getPlanMeta(planId?: string | null) {
  return planMeta.find((plan) => plan.plan_id === planId) ?? planMeta[0];
}

export function canAccess(
  plan: { plan_id: PlanId; is_admin?: boolean | null },
  featureKey: FeatureKey
) {
  if (plan.is_admin) return true;
  const features = planFeatures[plan.plan_id] ?? baseFeatures;
  return features.includes(featureKey);
}

export function getPlanFeatures(planId: PlanId) {
  return planFeatures[planId] ?? baseFeatures;
}
