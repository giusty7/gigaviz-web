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

// New unified plan tiers + legacy IDs for backward compatibility
export type PlanId =
  // New plan tiers (primary)
  | "free"
  | "starter"
  | "growth"
  | "business"
  | "enterprise"
  // Legacy IDs (kept for backward compat with existing subscriptions)
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

/**
 * Map legacy plan IDs to new canonical plan IDs.
 * Existing subscriptions keep working even though the DB may still have old codes.
 */
export function canonicalizePlanId(planId: string | null | undefined): PlanId {
  const legacyMap: Record<string, PlanId> = {
    free_locked: "free",
    ind_starter: "starter",
    ind_pro: "growth",
    team_starter: "growth",
    team_pro: "business",
  };
  if (!planId) return "free";
  if (legacyMap[planId]) return legacyMap[planId];
  // Already a new-style ID
  const validIds: PlanId[] = ["free", "starter", "growth", "business", "enterprise"];
  if (validIds.includes(planId as PlanId)) return planId as PlanId;
  return "free";
}

const baseFeatures: FeatureKey[] = [
  "dashboard_home",
  "account_settings",
  "plan_comparison_view",
  "tokens_view",
  "billing_manage",
];

const planFeatures: Record<string, FeatureKey[]> = {
  // ── New plan tiers ──
  free: baseFeatures,

  starter: [
    ...baseFeatures,
    "core_os",
    "meta_hub",
    "meta_templates",
    "meta_send",
    "meta_webhooks",
    "helper",
    "office",
    "inbox",
  ],

  growth: [
    ...baseFeatures,
    "core_os",
    "meta_hub",
    "meta_templates",
    "meta_send",
    "meta_webhooks",
    "meta_connect",
    "helper",
    "office",
    "graph",
    "tracks",
    "inbox",
    "automation",
    "member_invites",
    "roles_permissions",
    "audit_log",
  ],

  business: [
    ...baseFeatures,
    "core_os",
    "meta_hub",
    "meta_templates",
    "meta_send",
    "meta_webhooks",
    "meta_connect",
    "helper",
    "office",
    "graph",
    "tracks",
    "studio",
    "studio_graph",
    "marketplace",
    "arena",
    "pay",
    "trade",
    "community",
    "inbox",
    "automation",
    "mass_blast",
    "wa_blast",
    "analytics",
    "member_invites",
    "roles_permissions",
    "audit_log",
  ],

  enterprise: [
    ...baseFeatures,
    "core_os",
    "meta_hub",
    "meta_templates",
    "meta_send",
    "meta_webhooks",
    "meta_connect",
    "helper",
    "office",
    "graph",
    "tracks",
    "studio",
    "studio_graph",
    "marketplace",
    "arena",
    "pay",
    "trade",
    "community",
    "inbox",
    "automation",
    "mass_blast",
    "wa_blast",
    "analytics",
    "member_invites",
    "roles_permissions",
    "audit_log",
  ],

  // ── Legacy plan IDs (resolve to canonical features) ──
  free_locked: baseFeatures,
  ind_starter: [
    ...baseFeatures,
    "core_os",
    "meta_hub",
    "meta_templates",
    "meta_send",
    "meta_webhooks",
    "helper",
    "office",
    "inbox",
  ],
  ind_pro: [
    ...baseFeatures,
    "core_os",
    "meta_hub",
    "meta_templates",
    "meta_send",
    "meta_webhooks",
    "meta_connect",
    "helper",
    "office",
    "graph",
    "tracks",
    "inbox",
    "automation",
    "member_invites",
    "roles_permissions",
    "audit_log",
  ],
  team_starter: [
    ...baseFeatures,
    "core_os",
    "meta_hub",
    "meta_templates",
    "meta_send",
    "meta_webhooks",
    "meta_connect",
    "helper",
    "office",
    "graph",
    "tracks",
    "inbox",
    "automation",
    "member_invites",
    "roles_permissions",
    "audit_log",
  ],
  team_pro: [
    ...baseFeatures,
    "core_os",
    "meta_hub",
    "meta_templates",
    "meta_send",
    "meta_webhooks",
    "meta_connect",
    "helper",
    "office",
    "graph",
    "tracks",
    "studio",
    "studio_graph",
    "marketplace",
    "arena",
    "pay",
    "trade",
    "community",
    "inbox",
    "automation",
    "mass_blast",
    "wa_blast",
    "analytics",
    "member_invites",
    "roles_permissions",
    "audit_log",
  ],
};

export const planMeta: PlanMeta[] = [
  {
    plan_id: "free",
    name: "Free",
    billing_mode: "individual",
    seat_limit: 1,
    highlightBenefits: [
      "Dashboard & analytics preview",
      "100 WhatsApp messages/month",
      "5.000 AI tokens/month",
    ],
    ctaLabel: "Get Started Free",
  },
  {
    plan_id: "starter",
    name: "Starter",
    billing_mode: "individual",
    seat_limit: 3,
    highlightBenefits: [
      "Meta Hub + Helper + Office",
      "2.000 WA messages/month",
      "AI auto-reply & smart inbox",
    ],
    ctaLabel: "Start Free Trial",
  },
  {
    plan_id: "growth",
    name: "Growth",
    billing_mode: "team",
    seat_limit: 10,
    highlightBenefits: [
      "WhatsApp + Instagram + Messenger",
      "10.000 WA messages/month",
      "AI CRM insights & automation",
    ],
    ctaLabel: "Start Free Trial",
  },
  {
    plan_id: "business",
    name: "Business",
    billing_mode: "team",
    seat_limit: 25,
    highlightBenefits: [
      "All 10 modules unlocked",
      "50.000 WA messages/month",
      "Mass broadcast & advanced analytics",
    ],
    ctaLabel: "Start Free Trial",
  },
  {
    plan_id: "enterprise",
    name: "Enterprise",
    billing_mode: "team",
    seat_limit: 999,
    highlightBenefits: [
      "Unlimited seats & workspaces",
      "Custom SLA & dedicated support",
      "SSO & custom integrations",
    ],
    ctaLabel: "Talk to Sales",
  },
  // Legacy entries for backward compat lookups
  {
    plan_id: "free_locked",
    name: "Free",
    billing_mode: "individual",
    seat_limit: 1,
    highlightBenefits: ["Dashboard & plan comparison only"],
    ctaLabel: "Upgrade",
  },
  {
    plan_id: "ind_starter",
    name: "Starter",
    billing_mode: "individual",
    seat_limit: 3,
    highlightBenefits: ["Office automation", "Graph previews"],
    ctaLabel: "Upgrade",
  },
  {
    plan_id: "ind_pro",
    name: "Growth",
    billing_mode: "individual",
    seat_limit: 10,
    highlightBenefits: ["Helper + Meta Hub", "Higher throughput"],
    ctaLabel: "Upgrade",
  },
  {
    plan_id: "team_starter",
    name: "Growth",
    billing_mode: "team",
    seat_limit: 10,
    highlightBenefits: ["Shared workspace", "Role-based access"],
    ctaLabel: "Upgrade",
  },
  {
    plan_id: "team_pro",
    name: "Business",
    billing_mode: "team",
    seat_limit: 25,
    highlightBenefits: ["All modules unlocked", "Mass blast + analytics"],
    ctaLabel: "Upgrade",
  },
];

export function getPlanMeta(planId?: string | null) {
  return planMeta.find((plan) => plan.plan_id === planId) ?? planMeta[0];
}

export type AccessContext = {
  plan_id: PlanId;
  is_admin?: boolean | null;
  effectiveEntitlements?: string[] | null;
};

export function canAccess(ctx: AccessContext, featureKey: FeatureKey) {
  if (ctx.is_admin) return true;
  if (ctx.effectiveEntitlements?.includes(featureKey)) return true;
  const features = planFeatures[ctx.plan_id] ?? baseFeatures;
  return features.includes(featureKey);
}

export function getPlanFeatures(planId: PlanId) {
  return planFeatures[planId] ?? baseFeatures;
}
