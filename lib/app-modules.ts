import type { FeatureKey } from "@/lib/entitlements";

export type ModuleAvailability = "available" | "coming_soon";

export type AppModule = {
  key: string;
  slug: string;
  name: string;
  description: string;
  availability: ModuleAvailability;
  feature?: FeatureKey;
  lockedTitle?: string;
  lockedDescription?: string;
  summary?: string;
  note?: string;
};

export const appModules: AppModule[] = [
  {
    key: "meta-hub",
    slug: "meta-hub",
    name: "Meta Hub",
    description: "Meta automation, templates, and compliance tools.",
    availability: "available",
    feature: "meta_hub",
    lockedTitle: "Meta Hub is locked",
    lockedDescription: "Upgrade to unlock Meta Hub messaging and automation.",
    summary:
      "Stub module. Manage templates, send messages, and connect Meta tools.",
    note: "Meta Hub actions consume tokens (see rate card).",
  },
  {
    key: "helper",
    slug: "helper",
    name: "Helper",
    description: "AI-assisted responses with policy-safe guardrails.",
    availability: "available",
    feature: "helper",
    lockedTitle: "Helper is locked",
    lockedDescription:
      "Upgrade your plan to access Helper chat and tokenized responses.",
    summary:
      "Stub module. Add your assistant workflows and tokenized actions here.",
    note: "Helper actions will consume tokens on execution.",
  },
  {
    key: "tracks",
    slug: "tracks",
    name: "Tracks",
    description: "Workflow orchestration and journey tracking.",
    availability: "available",
    feature: "tracks",
    lockedTitle: "Tracks is locked",
    lockedDescription:
      "Upgrade to unlock Tracks orchestration and automation.",
    summary:
      "Stub module. Build multi-step journeys and orchestration flows.",
    note: "Tracks runs consume tokens when executed.",
  },
  {
    key: "office",
    slug: "office",
    name: "Office",
    description: "Automate docs, exports, and internal ops.",
    availability: "available",
    feature: "office",
    lockedTitle: "Office is locked",
    lockedDescription: "Upgrade to access Office automations and exports.",
    summary: "Stub module. Configure office automation workflows and exports.",
    note: "Office exports consume tokens on execution.",
  },
  {
    key: "graph",
    slug: "graph",
    name: "Graph",
    description: "Generate visuals and data-driven insights.",
    availability: "available",
    feature: "graph",
    lockedTitle: "Graph is locked",
    lockedDescription: "Upgrade to generate graph visuals and insights.",
    summary:
      "Stub module. Generate charts, imagery, and analytics exports.",
    note: "Graph generation actions consume tokens on execution.",
  },
  {
    key: "apps",
    slug: "apps",
    name: "Apps",
    description: "Launch internal mini apps and partner tools.",
    availability: "coming_soon",
    summary: "App catalog sedang disiapkan untuk workspace ini.",
  },
  {
    key: "trade",
    slug: "trade",
    name: "Trade",
    description: "Market insights and trading automation workflows.",
    availability: "coming_soon",
    summary: "Workflow Trade masih dalam tahap perencanaan.",
  },
];

export function getAppModule(slug: string) {
  return appModules.find((module) => module.slug === slug);
}
