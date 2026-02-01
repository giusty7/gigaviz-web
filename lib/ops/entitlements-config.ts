/**
 * Entitlements Configuration
 * 
 * Centralized definition of all workspace entitlements (hubs + capabilities).
 * Used across ops console, workspace panels, and entitlement management.
 */

export type EntitlementKey = string;

export type EntitlementDefinition = {
  key: EntitlementKey;
  label: string;
  description?: string;
  category: "hub" | "capability";
  requiresPayload?: boolean;
  payloadSchema?: string; // JSON schema description
  icon?: string; // Lucide icon name
};

/**
 * Hub Entitlements (10 modules)
 * 
 * Hubs are major product modules that workspaces can access.
 * Each hub may contain multiple capabilities.
 */
export const HUB_ENTITLEMENTS: EntitlementDefinition[] = [
  {
    key: "core_os",
    label: "Core OS",
    description: "Core operating system features (settings, profile, workspace management)",
    category: "hub",
    icon: "Layers",
  },
  {
    key: "meta_hub",
    label: "Meta Hub",
    description: "WhatsApp Business API integration (inbox, templates, webhooks)",
    category: "hub",
    requiresPayload: false,
    icon: "MessageCircle",
  },
  {
    key: "studio",
    label: "Studio",
    description: "Visual workflow builder and automation studio",
    category: "hub",
    icon: "Workflow",
  },
  {
    key: "helper",
    label: "Helper",
    description: "AI assistant with conversation management",
    category: "hub",
    icon: "Bot",
  },
  {
    key: "office",
    label: "Office",
    description: "Productivity suite (documents, spreadsheets, collaboration)",
    category: "hub",
    icon: "FileText",
  },
  {
    key: "marketplace",
    label: "Marketplace",
    description: "App marketplace and integrations",
    category: "hub",
    icon: "Store",
  },
  {
    key: "arena",
    label: "Arena",
    description: "Gamification and engagement platform",
    category: "hub",
    icon: "Trophy",
  },
  {
    key: "pay",
    label: "Pay",
    description: "Payment processing and billing",
    category: "hub",
    icon: "CreditCard",
  },
  {
    key: "trade",
    label: "Trade",
    description: "E-commerce and product catalog",
    category: "hub",
    icon: "ShoppingCart",
  },
  {
    key: "community",
    label: "Community",
    description: "Community management and forums",
    category: "hub",
    icon: "Users",
  },
];

/**
 * Capability Entitlements (6 features)
 * 
 * Capabilities are specific features that can be enabled within hubs.
 * Often tied to usage quotas or billing tiers.
 */
export const CAPABILITY_ENTITLEMENTS: EntitlementDefinition[] = [
  {
    key: "inbox",
    label: "Inbox",
    description: "Unified inbox for customer conversations",
    category: "capability",
    icon: "Inbox",
  },
  {
    key: "automation",
    label: "Automation",
    description: "Automated message flows and triggers",
    category: "capability",
    icon: "Zap",
  },
  {
    key: "studio_graph",
    label: "Studio Graph",
    description: "Visual node-based workflow editor",
    category: "capability",
    icon: "Network",
  },
  {
    key: "wa_blast",
    label: "WA Blast",
    description: "WhatsApp broadcast messaging",
    category: "capability",
    requiresPayload: true,
    payloadSchema: "{ monthly_limit: number }",
    icon: "Send",
  },
  {
    key: "mass_blast",
    label: "Mass Blast",
    description: "Multi-channel broadcast (WhatsApp + SMS + Email)",
    category: "capability",
    requiresPayload: true,
    payloadSchema: "{ monthly_limit: number, channels: string[] }",
    icon: "Radio",
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Advanced analytics and reporting",
    category: "capability",
    icon: "BarChart3",
  },
];

/**
 * All entitlements (hubs + capabilities)
 */
export const ALL_ENTITLEMENTS: EntitlementDefinition[] = [
  ...HUB_ENTITLEMENTS,
  ...CAPABILITY_ENTITLEMENTS,
];

/**
 * Entitlement map for quick lookup
 */
export const ENTITLEMENT_MAP = new Map<EntitlementKey, EntitlementDefinition>(
  ALL_ENTITLEMENTS.map((e) => [e.key, e])
);

/**
 * Get entitlement definition by key
 */
export function getEntitlementDef(key: EntitlementKey): EntitlementDefinition | undefined {
  return ENTITLEMENT_MAP.get(key);
}

/**
 * Get entitlement label by key
 */
export function getEntitlementLabel(key: EntitlementKey): string {
  return ENTITLEMENT_MAP.get(key)?.label ?? key;
}

/**
 * Check if entitlement key exists
 */
export function isValidEntitlementKey(key: string): key is EntitlementKey {
  return ENTITLEMENT_MAP.has(key);
}

/**
 * Group entitlements by category
 */
export function getEntitlementsByCategory() {
  return {
    hubs: HUB_ENTITLEMENTS,
    capabilities: CAPABILITY_ENTITLEMENTS,
  };
}

/**
 * Legacy exports for backward compatibility
 */
export const HUB_ENTITLEMENT_KEYS = HUB_ENTITLEMENTS.map((e) => ({
  key: e.key,
  label: e.label,
}));

export const CAPABILITY_ENTITLEMENT_KEYS = CAPABILITY_ENTITLEMENTS.map((e) => ({
  key: e.key,
  label: e.label,
}));
