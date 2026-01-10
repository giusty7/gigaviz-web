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
  available: "Tersedia",
  beta: "Beta",
  coming: "Segera",
};

export const modulesCatalog: ModuleCatalogItem[] = [
  {
    key: "platform",
    slug: "platform",
    name: "Gigaviz Platform",
    short: "Core OS: akun, workspace, billing, peran, audit.",
    description:
      "Pusat kendali untuk autentikasi, struktur workspace, peran, billing, dan audit trail.",
    status: "available",
    icon: "platform",
    categories: ["Core", "Security", "Billing"],
    features: [
      "Single sign-on dan pengaturan akun",
      "Workspace multi tim dan role-based access",
      "Billing, invoice, dan subscription",
      "Audit trail aktivitas penting",
    ],
    whoFor: ["Owner dan admin", "Ops yang butuh kontrol akses"],
    related: ["meta_hub", "helper", "pay"],
    hrefMarketing: "/products/platform",
    hrefApp: "/app/[workspaceSlug]/platform",
    topLevel: true,
  },
  {
    key: "meta_hub",
    slug: "meta-hub",
    name: "Gigaviz Meta Hub",
    short: "WhatsApp Cloud API hub: template, inbox, scheduler.",
    description:
      "Mengelola template, webhook, inbox multi agen, dan scheduler kampanye dengan compliance.",
    status: "beta",
    icon: "meta",
    categories: ["Messaging", "Automation"],
    features: [
      "Template dan approval flow",
      "Webhook event & delivery status",
      "Inbox multi agen",
      "Scheduler kampanye",
    ],
    whoFor: ["Tim CS/marketing", "Ops notifikasi"],
    related: ["platform", "helper"],
    requiresEntitlement: "meta_hub",
    hrefMarketing: "/products/meta-hub",
    hrefApp: "/app/[workspaceSlug]/meta-hub",
    topLevel: true,
  },
  {
    key: "helper",
    slug: "helper",
    name: "Gigaviz Helper",
    short: "Asisten AI untuk chat, copy, dan ringkasan.",
    description:
      "Asisten AI dengan guardrails untuk copy, riset ringan, dan ringkasan cepat.",
    status: "beta",
    icon: "helper",
    categories: ["AI", "Productivity"],
    features: [
      "Generator copy & prompt",
      "Rangkuman dokumen/meeting",
      "Mode chat ide cepat",
      "Kontrol penggunaan berbasis token",
    ],
    whoFor: ["Tim konten", "Supervisor", "Founder"],
    related: ["office", "graph"],
    requiresEntitlement: "helper",
    hrefMarketing: "/products/helper",
    hrefApp: "/app/[workspaceSlug]/modules/helper",
    topLevel: true,
  },
  {
    key: "studio",
    slug: "studio",
    name: "Gigaviz Studio",
    short: "Parent suite: Office, Graph, Tracks.",
    description:
      "Studio kreatif & produktivitas untuk dokumen, visual, dan workflow. Berisi Office, Graph, dan Tracks.",
    status: "beta",
    icon: "studio",
    categories: ["Creative", "Productivity"],
    features: ["Suite Office/Graph/Tracks", "Template & generatif", "Workflow"],
    whoFor: ["Tim kreatif", "Ops", "Marketing"],
    related: ["helper", "platform"],
    hrefMarketing: "/products/studio",
    hrefApp: "/app/[workspaceSlug]/modules/studio",
    topLevel: true,
  },
  {
    key: "office",
    slug: "office",
    name: "Gigaviz Office",
    short: "Template kerja, formula assistant, automasi workflow.",
    description:
      "Template dokumen, formula assistant, dan automasi sederhana untuk proses operasional.",
    status: "beta",
    icon: "office",
    categories: ["Productivity", "Operations"],
    features: [
      "Template dokumen & dashboard",
      "Formula assistant",
      "Workflow rutin & exports",
    ],
    whoFor: ["Tim ops", "Admin/finance", "PM"],
    related: ["helper", "platform"],
    requiresEntitlement: "office",
    hrefMarketing: "/products/office",
    hrefApp: "/app/[workspaceSlug]/modules/office",
    parentKey: "studio",
  },
  {
    key: "graph",
    slug: "graph",
    name: "Gigaviz Graph",
    short: "Visual & analytics generation.",
    description:
      "Generate grafik, visual, dan insight data dengan prompt dan template.",
    status: "beta",
    icon: "studio",
    categories: ["Analytics", "Creative"],
    features: ["Generate chart & visual", "Template dashboard", "Exports"],
    whoFor: ["Analis", "Marketing", "Ops"],
    related: ["helper", "tracks"],
    requiresEntitlement: "graph",
    hrefMarketing: "/products/platform",
    hrefApp: "/app/[workspaceSlug]/modules/graph",
    parentKey: "studio",
  },
  {
    key: "tracks",
    slug: "tracks",
    name: "Gigaviz Tracks",
    short: "Workflow orchestration & journeys.",
    description: "Orkestrasi workflow multi-step, triggers, dan kontrol token.",
    status: "beta",
    icon: "apps",
    categories: ["Automation"],
    features: ["Journey builder", "Multi-step orchestration", "Tokenized runs"],
    whoFor: ["Ops", "Growth", "Engineer ringan"],
    related: ["helper", "graph"],
    requiresEntitlement: "tracks",
    hrefMarketing: "/products/platform",
    hrefApp: "/app/[workspaceSlug]/modules/tracks",
    parentKey: "studio",
  },
  {
    key: "apps",
    slug: "apps",
    name: "Gigaviz Apps",
    short: "Katalog app, request, ticketing, mini roadmap.",
    description:
      "Portal app internal, request terstruktur, dan mini roadmap per klien.",
    status: "beta",
    icon: "apps",
    categories: ["Operations", "Platform"],
    features: ["Katalog & request", "Ticketing", "Status & prioritas otomatis"],
    whoFor: ["Ops", "CS", "Klien enterprise"],
    related: ["platform", "community"],
    hrefMarketing: "/products/apps",
    hrefApp: "/app/[workspaceSlug]/modules/apps",
    topLevel: true,
  },
  {
    key: "marketplace",
    slug: "marketplace",
    name: "Gigaviz Marketplace",
    short: "Jual beli template, prompt pack, asset, mini-app.",
    description:
      "Marketplace untuk template Office, prompt pack Studio/Helper, dan asset kreatif.",
    status: "beta",
    icon: "marketplace",
    categories: ["Commerce", "Marketplace"],
    features: ["Listing digital", "Lisensi personal/komersial", "Bundle promosi"],
    whoFor: ["Creator", "Studio kreatif"],
    related: ["platform", "studio"],
    hrefMarketing: "/products/marketplace",
    topLevel: true,
  },
  {
    key: "arena",
    slug: "arena",
    name: "Gigaviz Arena",
    short: "Mini-game & engagement untuk brand.",
    description:
      "Main game kurasi, buat mini-game template, dan request game custom.",
    status: "beta",
    icon: "arena",
    categories: ["Engagement", "Games"],
    features: ["Koleksi game", "Builder template", "Gamification ringan"],
    whoFor: ["Brand marketing", "Community manager"],
    related: ["apps", "studio"],
    hrefMarketing: "/products/arena",
    topLevel: true,
  },
  {
    key: "pay",
    slug: "pay",
    name: "Gigaviz Pay",
    short: "Wallet & billing: invoice, payment link, subscription.",
    description:
      "Dompet internal untuk invoice, payment link, dan subscription billing.",
    status: "coming",
    icon: "pay",
    categories: ["Finance", "Billing"],
    features: ["Invoice", "Payment link", "Subscription billing"],
    whoFor: ["Finance", "Bisnis recurring"],
    related: ["platform", "office"],
    hrefMarketing: "/products/pay",
    topLevel: true,
  },
  {
    key: "community",
    slug: "community",
    name: "Gigaviz Community",
    short: "Forum, feedback, showcase, leaderboard, event.",
    description:
      "Ruang komunitas untuk berbagi insight, feedback, showcase, dan event.",
    status: "coming",
    icon: "community",
    categories: ["Community", "Engagement"],
    features: ["Forum", "Showcase", "Leaderboard", "Event"],
    whoFor: ["Pengguna aktif", "Kreator", "Partner"],
    related: ["studio", "arena", "apps"],
    hrefMarketing: "/products/community",
    topLevel: true,
  },
  {
    key: "trade",
    slug: "trade",
    name: "Gigaviz Trade",
    short: "Market insights dan workflow trading.",
    description:
      "Workflow trading, market insights, dan automasi yang sedang disiapkan.",
    status: "coming",
    icon: "apps",
    categories: ["Analytics", "Trading"],
    related: ["graph", "tracks"],
    hrefMarketing: "/products/trade",
    hrefApp: "/app/[workspaceSlug]/modules/trade",
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
