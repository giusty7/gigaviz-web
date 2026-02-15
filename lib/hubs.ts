// NOTE: All hub copy must remain English.
export type HubStatus = "OPEN" | "COMING_SOON";

export type HubDef = {
  slug: string;
  title: string;
  description: string;
  status: HubStatus;
  flow: Array<{ title: string; desc: string }>;
  bullets: string[];
};

export const HUBS: HubDef[] = [
  {
    slug: "platform",
    title: "Gigaviz Platform",
    description: "Core OS: account, workspace, billing, payments, roles, audit logs.",
    status: "OPEN",
    flow: [
      { title: "Create workspace", desc: "Set up org, teams, and roles." },
      { title: "Configure billing", desc: "Pick a plan, add payment method (Stripe/Midtrans)." },
      { title: "Invite members", desc: "Add admins, operators, and viewers." },
      { title: "Manage payments", desc: "Invoices, payment links, and subscription billing." },
      { title: "Audit & policies", desc: "Review activity logs and enforce rules." },
    ],
    bullets: [
      "Role-based access with audit trails",
      "Billing, invoices, payments, and limits in one place",
      "Token wallet and usage tracking",
      "Workspace switcher and entitlements",
      "Security defaults with guardrails",
    ],
  },
  {
    slug: "meta-hub",
    title: "Gigaviz Meta Hub",
    description: "WhatsApp, Instagram, & Messenger hub: templates, inbox, automation.",
    status: "OPEN",
    flow: [
      { title: "Connect WABA", desc: "Link phone numbers and verify setup." },
      { title: "Sync templates", desc: "Import approved templates for sending." },
      { title: "Handle webhooks", desc: "Process delivery, read, and opt-in events." },
      { title: "Inbox & campaigns", desc: "Reply quickly and schedule sends across channels." },
      { title: "AI auto-reply", desc: "Let Helper AI handle FAQs and routine responses." },
      { title: "Monitor health", desc: "Track errors, limits, and webhook status." },
    ],
    bullets: [
      "End-to-end WhatsApp, Instagram, and Messenger messaging",
      "Template sync and test tools",
      "Unified inbox triage with AI auto-reply",
      "Contact CRM with tags and segmentation",
      "Health panel with verification checks",
    ],
  },
  {
    slug: "helper",
    title: "Gigaviz Helper",
    description: "AI assistant for chat, copy, CRM insights, and knowledge base.",
    status: "OPEN",
    flow: [
      { title: "Start a thread", desc: "Create a helper conversation for your task." },
      { title: "Pick a mode", desc: "Chat, Copy, or Summary with provider auto-select." },
      { title: "Send prompts", desc: "Compose instructions and receive AI replies." },
      { title: "Knowledge base", desc: "Upload docs for RAG-powered AI responses." },
      { title: "CRM insights", desc: "Generate lead scores and engagement reports." },
      { title: "Control automation", desc: "Toggle workflows and budget caps per workspace." },
    ],
    bullets: [
      "Multi-provider LLM routing",
      "RAG knowledge base with vector search",
      "CRM insights and lead scoring",
      "Powers auto-reply in Meta Hub inbox",
      "Workspace-scoped history and settings",
      "Token usage controls and budgets",
    ],
  },
  {
    slug: "studio",
    title: "Gigaviz Studio",
    description: "AI-powered creative suite: Office docs, Graph visuals, Tracks music.",
    status: "OPEN",
    flow: [
      { title: "Pick a tool", desc: "Office for docs, Graph for visuals, Tracks for music." },
      { title: "Describe what you need", desc: "Use AI prompts to generate content." },
      { title: "Refine and edit", desc: "Tweak the output to match your brand." },
      { title: "Export or publish", desc: "Download files or share within workspace." },
      { title: "Sell on Marketplace", desc: "List your creations for others to buy." },
    ],
    bullets: [
      "AI-generated Excel, Word, PDF documents (Office)",
      "AI image and video creation (Graph)",
      "AI music and audio production (Tracks)",
      "All powered by Helper AI engine",
      "Sell creations on Marketplace",
    ],
  },
  {
    slug: "apps",
    title: "Gigaviz Apps",
    description: "Third-party integrations: Shopee, Google Sheets, and more.",
    status: "OPEN",
    flow: [
      { title: "Browse catalog", desc: "See available first-party and partner apps." },
      { title: "Request access", desc: "Submit requests with justification." },
      { title: "Connect tools", desc: "Link external services to your workspace." },
      { title: "Sync data", desc: "Auto-sync contacts, orders, and data." },
    ],
    bullets: [
      "Centralized app catalog",
      "Request and approval workflow",
      "Data sync with external tools",
      "Integration roadmap visibility",
    ],
  },
  {
    slug: "marketplace",
    title: "Gigaviz Marketplace",
    description: "Buy and sell digital products: templates, prompts, audio, visuals.",
    status: "OPEN",
    flow: [
      { title: "Browse products", desc: "Find templates, visuals, audio, and prompts." },
      { title: "Preview items", desc: "See examples before purchasing." },
      { title: "Buy and install", desc: "Purchase and add to your workspace instantly." },
      { title: "Sell your creations", desc: "List digital products and earn revenue." },
      { title: "Manage sales", desc: "Track earnings, reviews, and analytics." },
    ],
    bullets: [
      "Digital product marketplace (buy and sell)",
      "Office templates, Graph visuals, Tracks audio, prompts",
      "Creator profiles and seller dashboard",
      "Instant delivery to workspace",
      "Reviews, ratings, and promotions",
    ],
  },
];
