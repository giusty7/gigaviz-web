export type RoadmapItem = {
  title: string;
  description: string;
};

export type RoadmapStage = "now" | "next" | "later";

export const roadmap: Record<RoadmapStage, RoadmapItem[]> = {
  now: [
    {
      title: "Core OS for accounts and workspaces",
      description: "Single sign-on, base Billing, Roles, and Audit Logs for teams.",
    },
    {
      title: "Meta Hub basics",
      description: "Webhooks, inbox, templates, and opt-in workflows for WhatsApp.",
    },
    {
      title: "Studio library",
      description: "Asset library, prompt management, and early creative outputs.",
    },
    {
      title: "Office templates",
      description: "Document templates, dashboards, and light automation.",
    },
    {
      title: "Pay UI",
      description: "Invoices and subscription billing with an initial UI.",
    },
  ],
  next: [
    {
      title: "Cross-module analytics",
      description: "Unified insights for business and creative performance.",
    },
    {
      title: "Campaign scheduler v2",
      description: "More precise scheduling with audit-ready history.",
    },
    {
      title: "Marketplace hooks",
      description: "Lightweight integrations with marketplace and CRM.",
    },
    {
      title: "Advanced roles and audit",
      description: "Granular access control and detailed activity history.",
    },
  ],
  later: [
    {
      title: "Utility payments and recurring billing",
      description: "Extensions for utility payments and scheduled billing flows.",
    },
    {
      title: "BSP upgrades",
      description: "Upgrades for the official WhatsApp BSP path.",
    },
    {
      title: "Community events",
      description: "Meetups, showcases, and official community programs.",
    },
    {
      title: "Advanced automations",
      description: "Cross-module automations with more complex rules.",
    },
  ],
};
