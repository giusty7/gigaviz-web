import type { FeatureKey } from "@/lib/entitlements";

export type ModuleIcon =
  | "platform"
  | "meta"
  | "helper"
  | "links"
  | "office"
  | "studio"
  | "marketplace"
  | "apps";

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
    short: "Core OS: account, workspace, billing, payments, roles, audit logs.",
    description:
      "Control center for authentication, workspace structure, roles, billing, payments (Stripe & Midtrans), and audit trails.",
    status: "available",
    icon: "platform",
    categories: ["Core", "Security", "Billing", "Payments"],
    features: [
      "Single sign-on and account settings",
      "Multi-team workspaces and role-based access",
      "Billing, invoices, payment links, and subscriptions",
      "Token wallet and usage tracking",
      "Audit trail for critical activity",
    ],
    whoFor: ["Owners and admins", "Ops teams that need access control", "Finance teams"],
    related: ["meta_hub", "helper", "studio"],
    hrefMarketing: "/products/platform",
    hrefApp: "/[workspaceSlug]/platform",
    topLevel: true,
  },
  {
    key: "meta_hub",
    slug: "meta-hub",
    name: "Gigaviz Meta Hub",
    short: "WhatsApp, Instagram, & Messenger: templates, inbox, delivery, automation.",
    description:
      "Direct onboarding via the WhatsApp Business Platform flow. Manage numbers, templates, inbox, delivery status, and automation across WhatsApp, Instagram, and Messenger from one place.",
    status: "available",
    icon: "meta",
    categories: ["Messaging", "Automation", "CRM"],
    features: [
      "Template and approval flow",
      "Webhook events and delivery status",
      "Multi-agent unified inbox (WhatsApp, IG, Messenger)",
      "Campaign scheduler and mass broadcast",
      "AI-powered auto-reply (powered by Helper)",
      "Contact CRM with tags and segmentation",
    ],
    whoFor: ["Customer support and marketing teams", "Notification ops", "Sales teams"],
    related: ["platform", "helper", "studio"],
    requiresEntitlement: "meta_hub",
    hrefMarketing: "/products/meta-hub",
    hrefApp: "/[workspaceSlug]/meta-hub",
    topLevel: true,
  },
  {
    key: "helper",
    slug: "helper",
    name: "Gigaviz Helper",
    short: "AI assistant for chat, copywriting, CRM insights, and knowledge base.",
    description:
      "AI assistant with guardrails for copywriting, quick research, summaries, CRM lead scoring, and RAG knowledge base. Powers auto-reply in Meta Hub and AI generation in Studio.",
    status: "beta",
    icon: "helper",
    categories: ["AI", "Productivity", "CRM"],
    features: [
      "AI chat with multi-provider LLM routing",
      "Copywriting and prompt tools",
      "RAG knowledge base with vector search",
      "CRM insights and lead scoring",
      "Auto-reply engine for Meta Hub inbox",
      "Token usage controls and budgets",
    ],
    whoFor: ["Content teams", "Customer support", "Sales teams", "Founders"],
    related: ["meta_hub", "office", "graph", "tracks"],
    requiresEntitlement: "helper",
    hrefMarketing: "/products/helper",
    hrefApp: "/[workspaceSlug]/helper",
    topLevel: true,
  },
  {
    key: "links",
    slug: "links",
    name: "Gigaviz Links",
    short: "Smart bio pages, QR codes, and click-to-WhatsApp links with analytics.",
    description:
      "Create bio link pages, QR codes, and smart links that route visitors straight to your WhatsApp inbox. Track every click, see which links convert to conversations, and measure ROI — all connected to your CRM.",
    status: "beta",
    icon: "links",
    categories: ["Marketing", "Analytics", "Lead Generation"],
    features: [
      "Bio link pages with custom branding",
      "Click-to-WhatsApp smart links",
      "QR code generator for offline-to-online",
      "Link analytics: clicks, conversions, sources",
      "Mini product catalog on bio pages",
      "Smart routing to different agents/departments",
    ],
    whoFor: ["Marketing teams", "Sales teams", "Retail & F&B businesses", "Event organizers"],
    related: ["meta_hub", "helper", "marketplace"],
    requiresEntitlement: "links",
    hrefMarketing: "/products/links",
    hrefApp: "/[workspaceSlug]/links",
    topLevel: true,
  },
  {
    key: "studio",
    slug: "studio",
    name: "Gigaviz Studio",
    short: "AI-powered creative suite: Office docs, Graph visuals, Tracks music.",
    description:
      "Creative and productivity studio powered by AI. Auto-generate business documents (Office), images and videos (Graph), and music and audio (Tracks) — all connected to your business data.",
    status: "available",
    icon: "studio",
    categories: ["Creative", "Productivity", "AI"],
    features: [
      "AI document generation — Excel, Word, PDF (Office)",
      "AI image and video creation (Graph)",
      "AI music and audio production (Tracks)",
      "Template-driven creation with AI assistance",
      "Export and share within workspace",
    ],
    whoFor: ["Creative teams", "Marketing", "Content creators", "Business ops"],
    related: ["helper", "marketplace", "platform"],
    hrefMarketing: "/products/studio",
    hrefApp: "/[workspaceSlug]/modules/studio",
    topLevel: true,
  },
  {
    key: "office",
    slug: "office",
    name: "Gigaviz Office",
    short: "AI-powered document automation: Excel, Word, PDF, invoices, reports.",
    description:
      "Auto-generate business documents with AI. Create Excel spreadsheets, Word documents, PDF reports, invoices, and dashboards from your data — powered by Helper AI.",
    status: "available",
    icon: "office",
    categories: ["Productivity", "AI", "Operations"],
    features: [
      "AI-generated Excel spreadsheets and formulas",
      "Auto-create Word documents and PDF reports",
      "Invoice and receipt generator",
      "Dashboard and KPI report builder",
      "Template library for common business documents",
      "Data import/export automation",
    ],
    whoFor: ["Ops teams", "Admin and finance", "PMs", "Sales"],
    related: ["helper", "platform", "marketplace"],
    requiresEntitlement: "office",
    hrefMarketing: "/products/office",
    hrefApp: "/[workspaceSlug]/modules/studio/office",
    parentKey: "studio",
  },
  {
    key: "graph",
    slug: "graph",
    name: "Gigaviz Graph",
    short: "AI image generation and video storyboard planning for business and marketing.",
    description:
      "Generate images with DALL-E and plan video storyboards with AI. Create marketing materials, social media visuals, and brand assets. Video storyboard planner creates scene breakdowns, scripts, and production notes.",
    status: "available",
    icon: "studio",
    categories: ["Creative", "AI", "Marketing"],
    features: [
      "AI image generation with DALL-E 3",
      "AI video storyboard & script planner (Beta)",
      "Marketing material and social media graphics",
      "Product visual and mockup generation",
      "Brand asset library and templates",
      "Export in multiple formats",
    ],
    whoFor: ["Marketing teams", "Content creators", "Social media managers", "Designers"],
    related: ["helper", "tracks", "marketplace"],
    requiresEntitlement: "graph",
    hrefMarketing: "/products/graph",
    hrefApp: "/[workspaceSlug]/modules/studio/graph",
    parentKey: "studio",
  },
  {
    key: "tracks",
    slug: "tracks",
    name: "Gigaviz Tracks",
    short: "AI music composition planning and workflow automation for content and branding.",
    description:
      "Plan original music compositions with AI — get structure, instrument suggestions, mood analysis, and production notes. Build automated workflows with triggers and scheduling. Real audio generation coming soon.",
    status: "available",
    icon: "studio",
    categories: ["Creative", "AI", "Audio"],
    features: [
      "AI music composition planner (Beta)",
      "Structure, instruments & mood analysis",
      "Workflow automation and triggers",
      "Run history and scheduling",
      "Waveform visualization",
      "Real audio generation coming soon",
    ],
    whoFor: ["Content creators", "Marketing teams", "Podcasters", "Brand managers"],
    related: ["helper", "graph", "marketplace"],
    requiresEntitlement: "tracks",
    hrefMarketing: "/products/tracks",
    hrefApp: "/[workspaceSlug]/modules/studio/tracks",
    parentKey: "studio",
  },
  {
    key: "apps",
    slug: "apps",
    name: "Gigaviz Apps",
    short: "Third-party integrations: connect Shopee, Google Sheets, and more.",
    description:
      "App catalog and integration hub. Connect third-party tools like Shopee, Tokopedia, Google Sheets, and more to your Gigaviz workspace.",
    status: "beta",
    icon: "apps",
    categories: ["Integrations", "Platform"],
    features: [
      "App catalog with first-party and partner apps",
      "Request and approval workflow for new integrations",
      "Integration status tracking and roadmap",
      "Data sync between external tools and workspace",
    ],
    whoFor: ["Ops teams", "Customer success", "Enterprise clients"],
    related: ["platform", "meta_hub", "marketplace"],
    hrefMarketing: "/products/apps",
    hrefApp: "/[workspaceSlug]/apps",
    topLevel: true,
  },
  {
    key: "marketplace",
    slug: "marketplace",
    name: "Gigaviz Marketplace",
    short: "Buy and sell digital products: templates, prompts, audio, visuals.",
    description:
      "Marketplace for buying and selling digital products. List and sell Office templates, Graph visuals, Tracks audio, Helper prompt packs, and other digital assets.",
    status: "beta",
    icon: "marketplace",
    categories: ["Commerce", "Marketplace", "Digital Products"],
    features: [
      "Buy and sell digital products (templates, visuals, audio, prompts)",
      "Creator profiles and seller dashboard",
      "Personal and commercial licensing",
      "Bundles, promotions, and reviews",
      "Instant delivery to workspace",
    ],
    whoFor: ["Creators", "Creative studios", "Freelancers", "Businesses"],
    related: ["studio", "helper", "platform"],
    hrefMarketing: "/products/marketplace",
    hrefApp: "/[workspaceSlug]/marketplace",
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
