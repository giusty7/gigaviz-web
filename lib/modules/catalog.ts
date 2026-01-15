import type { FeatureKey } from "@/lib/entitlements";

export type ModuleIcon =
  | "platform"
  | "meta"
  | "helper"
  | "office"
  | "studio"
  | "marketplace"
  | "arena"
  | "apps"
  | "pay"
  | "community";

export type ModuleStatus = "available" | "beta" | "coming";

export type ModuleCatalogItem = {
  key: string;
  slug: string;
  name: string;
  short: string;
  description: string;
  status: ModuleStatus;
  icon: ModuleIcon;
  categories?: string[];
  features?: string[];
  whoFor?: string[];
  related?: string[];
  hrefMarketing?: string;
  hrefApp?: string;
  requiresEntitlement?: FeatureKey;
  tag?: string;
  topLevel?: boolean;
  parentKey?: string;
};

export const moduleStatusLabel: Record<ModuleStatus, string> = {
  available: "AVAILABLE",
  beta: "BETA",
  coming: "COMING SOON",
};

export const modulesCatalog: ModuleCatalogItem[] = [
  {
    key: "platform",
    slug: "platform",
    name: "Gigaviz Platform",
    short: "Core OS: account, workspace, billing, roles, audit logs.",
    description:
      "Control center for authentication, workspace structure, roles, billing, and audit trails.",
    status: "available",
    icon: "platform",
    categories: ["Core", "Security", "Billing"],
    features: [
      "Single sign-on and account settings",
      "Multi-team workspaces and role-based access",
      "Billing, invoices, and subscriptions",
      "Audit trail for critical activity",
    ],
    whoFor: ["Owners and admins", "Ops teams that need access control"],
    related: ["meta_hub", "helper", "pay"],
    hrefMarketing: "/products/platform",
    hrefApp: "/[workspaceSlug]/platform",
    topLevel: true,
  },
  {
    key: "meta_hub",
    slug: "meta-hub",
    name: "Gigaviz Meta Hub",
    short: "Live: WhatsApp Business Platform onboarding, templates, inbox, delivery.",
    description:
      "Direct onboarding via the WhatsApp Business Platform flow. Manage numbers, templates, inbox, delivery status, and automation from one place.",
    status: "available",
    icon: "meta",
    categories: ["Messaging", "Automation"],
    features: [
      "Template and approval flow",
      "Webhook events and delivery status",
      "Multi-agent inbox",
      "Campaign scheduler",
    ],
    whoFor: ["Customer support and marketing teams", "Notification ops"],
    related: ["platform", "helper"],
    requiresEntitlement: "meta_hub",
    hrefMarketing: "/products/meta-hub",
    hrefApp: "/[workspaceSlug]/meta-hub",
    topLevel: true,
  },
  {
    key: "helper",
    slug: "helper",
    name: "Gigaviz Helper",
    short: "AI assistant for chat, copy, and summaries.",
    description:
      "AI assistant with guardrails for copywriting, quick research, and summaries.",
    status: "beta",
    icon: "helper",
    categories: ["AI", "Productivity"],
    features: [
      "Copy generator and prompt tools",
      "Document and meeting summaries",
      "Quick ideation chat",
      "Token usage controls",
    ],
    whoFor: ["Content teams", "Supervisors", "Founders"],
    related: ["office", "graph"],
    requiresEntitlement: "helper",
    hrefMarketing: "/products/helper",
    hrefApp: "/[workspaceSlug]/helper",
    topLevel: true,
  },
  {
    key: "studio",
    slug: "studio",
    name: "Gigaviz Studio",
    short: "Parent suite: Office, Graph, Tracks.",
    description:
      "Creative and productivity studio for documents, visuals, and workflows. Includes Office, Graph, and Tracks.",
    status: "beta",
    icon: "studio",
    categories: ["Creative", "Productivity"],
    features: ["Office/Graph/Tracks suite", "Templates and generative tools", "Workflow support"],
    whoFor: ["Creative teams", "Ops", "Marketing"],
    related: ["helper", "platform"],
    hrefMarketing: "/products/studio",
    hrefApp: "/[workspaceSlug]/modules/studio",
    topLevel: true,
  },
  {
    key: "office",
    slug: "office",
    name: "Gigaviz Office",
    short: "Work templates, formula assistant, workflow automation.",
    description:
      "Document templates, formula assistant, and light automation for operations.",
    status: "beta",
    icon: "office",
    categories: ["Productivity", "Operations"],
    features: [
      "Document and dashboard templates",
      "Formula assistant",
      "Routine workflows and exports",
    ],
    whoFor: ["Ops teams", "Admin and finance", "PMs"],
    related: ["helper", "platform"],
    requiresEntitlement: "office",
    hrefMarketing: "/products/office",
    hrefApp: "/[workspaceSlug]/modules/office",
    parentKey: "studio",
  },
  {
    key: "graph",
    slug: "graph",
    name: "Gigaviz Graph",
    short: "Visual and analytics generation.",
    description:
      "Generate charts, visuals, and data insights with prompts and templates.",
    status: "beta",
    icon: "studio",
    categories: ["Analytics", "Creative"],
    features: ["Chart and visual generation", "Dashboard templates", "Exports"],
    whoFor: ["Analysts", "Marketing", "Ops"],
    related: ["helper", "tracks"],
    requiresEntitlement: "graph",
    hrefMarketing: "/products/platform",
    hrefApp: "/[workspaceSlug]/modules/graph",
    parentKey: "studio",
  },
  {
    key: "tracks",
    slug: "tracks",
    name: "Gigaviz Tracks",
    short: "Workflow orchestration and journeys.",
    description:
      "Multi-step orchestration, triggers, and token controls.",
    status: "beta",
    icon: "apps",
    categories: ["Automation"],
    features: ["Journey builder", "Multi-step orchestration", "Tokenized runs"],
    whoFor: ["Ops", "Growth", "Lightweight engineering"],
    related: ["helper", "graph"],
    requiresEntitlement: "tracks",
    hrefMarketing: "/products/platform",
    hrefApp: "/[workspaceSlug]/modules/tracks",
    parentKey: "studio",
  },
  {
    key: "apps",
    slug: "apps",
    name: "Gigaviz Apps",
    short: "App catalog, requests, ticketing, mini roadmap.",
    description:
      "Internal app portal, structured requests, and per-client roadmaps.",
    status: "beta",
    icon: "apps",
    categories: ["Operations", "Platform"],
    features: ["Catalog and requests", "Ticketing", "Status and priority automation"],
    whoFor: ["Ops", "Customer success", "Enterprise clients"],
    related: ["platform", "community"],
    hrefMarketing: "/products/apps",
    hrefApp: "/[workspaceSlug]/modules/apps",
    topLevel: true,
  },
  {
    key: "marketplace",
    slug: "marketplace",
    name: "Gigaviz Marketplace",
    short: "Marketplace for templates, prompt packs, assets, mini-apps.",
    description:
      "Marketplace for Office templates, Studio/Helper prompt packs, and creative assets.",
    status: "beta",
    icon: "marketplace",
    categories: ["Commerce", "Marketplace"],
    features: ["Digital listings", "Personal and commercial licenses", "Bundles and promotions"],
    whoFor: ["Creators", "Creative studios"],
    related: ["platform", "studio"],
    hrefMarketing: "/products/marketplace",
    topLevel: true,
  },
  {
    key: "arena",
    slug: "arena",
    name: "Gigaviz Arena",
    short: "Mini-games and engagement for brands.",
    description:
      "Curated games, mini-game templates, and custom game requests.",
    status: "beta",
    icon: "arena",
    categories: ["Engagement", "Games"],
    features: ["Game library", "Template builder", "Lightweight gamification"],
    whoFor: ["Brand marketing", "Community managers"],
    related: ["apps", "studio"],
    hrefMarketing: "/products/arena",
    topLevel: true,
  },
  {
    key: "pay",
    slug: "pay",
    name: "Gigaviz Pay",
    short: "Wallet and billing: invoices, payment links, subscriptions.",
    description:
      "Internal wallet for invoices, payment links, and subscription billing.",
    status: "coming",
    icon: "pay",
    categories: ["Finance", "Billing"],
    features: ["Invoices", "Payment links", "Subscription billing"],
    whoFor: ["Finance teams", "Recurring businesses"],
    related: ["platform", "office"],
    hrefMarketing: "/products/pay",
    topLevel: true,
  },
  {
    key: "community",
    slug: "community",
    name: "Gigaviz Community",
    short: "Forum, feedback, showcase, leaderboard, events.",
    description:
      "Community space for insights, feedback, showcases, and events.",
    status: "coming",
    icon: "community",
    categories: ["Community", "Engagement"],
    features: ["Forum", "Showcase", "Leaderboard", "Events"],
    whoFor: ["Active users", "Creators", "Partners"],
    related: ["studio", "arena", "apps"],
    hrefMarketing: "/products/community",
    topLevel: true,
  },
  {
    key: "trade",
    slug: "trade",
    name: "Gigaviz Trade",
    short: "Market insights and trading workflows.",
    description:
      "Trading workflows, market insights, and automation in progress.",
    status: "coming",
    icon: "apps",
    categories: ["Analytics", "Trading"],
    related: ["graph", "tracks"],
    hrefMarketing: "/products/trade",
    hrefApp: "/[workspaceSlug]/modules/trade",
    topLevel: true,
  },
];

export const topLevelModules = modulesCatalog.filter((m) => m.topLevel);
export const studioChildren = modulesCatalog.filter((m) => m.parentKey === "studio");

export function getModuleBySlug(slug: string) {
  return modulesCatalog.find((m) => m.slug === slug);
}

export function getModuleByKey(key: string) {
  return modulesCatalog.find((m) => m.key === key);
}

export function getTopLevelBySlug(slug: string) {
  return topLevelModules.find((m) => m.slug === slug);
}

export function getStudioChildBySlug(slug: string) {
  return studioChildren.find((m) => m.slug === slug);
}
