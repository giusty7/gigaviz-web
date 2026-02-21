export type RoadmapItem = {
  title: string;
  description: string;
};

export type RoadmapStage = "now" | "next" | "later";

export const roadmap: Record<RoadmapStage, RoadmapItem[]> = {
  now: [
    {
      title: "Platform + Billing + Payments",
      description: "Workspace OS with Xendit and Midtrans payment integration.",
    },
    {
      title: "Meta Hub — WhatsApp, IG, Messenger",
      description: "Multi-channel inbox, templates, webhooks, automation, and AI auto-reply.",
    },
    {
      title: "Helper — AI Engine",
      description: "AI assistant, knowledge base, CRM insights, and lead scoring.",
    },
    {
      title: "Studio Office — AI Documents",
      description: "AI-generated Excel, Word, PDF, invoices, and dashboards.",
    },
  ],
  next: [
    {
      title: "Studio Graph — AI Visuals",
      description: "AI image and video generation for marketing and business.",
    },
    {
      title: "Studio Tracks — AI Music",
      description: "AI music, jingles, and audio content for ads and branding.",
    },
    {
      title: "Marketplace — Digital Products",
      description: "Buy and sell Office templates, Graph visuals, Tracks audio, and prompts.",
    },
    {
      title: "Apps — Third-Party Integrations",
      description: "Connect Shopee, Tokopedia, Google Sheets, and more.",
    },
  ],
  later: [
    {
      title: "Cross-module analytics",
      description: "Unified insights across messaging, AI, and creative performance.",
    },
    {
      title: "Advanced automations",
      description: "Cross-module workflows connecting Meta Hub, Helper, and Studio.",
    },
    {
      title: "Enterprise features",
      description: "SSO, SAML, custom domains, and dedicated support.",
    },
    {
      title: "Additional languages",
      description: "Spanish, Portuguese, Arabic, and more locales.",
    },
  ],
};
