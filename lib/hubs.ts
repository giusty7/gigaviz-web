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
    description: "Core OS: account, workspace, billing, roles, audit logs.",
    status: "OPEN",
    flow: [
      { title: "Create workspace", desc: "Set up org, teams, and roles." },
      { title: "Configure billing", desc: "Pick a plan, add payment method." },
      { title: "Invite members", desc: "Add admins, operators, and viewers." },
      { title: "Audit & policies", desc: "Review activity logs and enforce rules." },
    ],
    bullets: [
      "Role-based access with audit trails",
      "Billing, invoices, and limits in one place",
      "Workspace switcher and entitlements",
      "Security defaults with guardrails",
    ],
  },
  {
    slug: "meta-hub",
    title: "Gigaviz Meta Hub",
    description: "WhatsApp Cloud API hub: templates, webhooks, inbox, scheduler.",
    status: "OPEN",
    flow: [
      { title: "Connect WABA", desc: "Link phone numbers and verify setup." },
      { title: "Sync templates", desc: "Import approved templates for sending." },
      { title: "Handle webhooks", desc: "Process delivery, read, and opt-in events." },
      { title: "Inbox & campaigns", desc: "Reply quickly and schedule sends." },
      { title: "Monitor health", desc: "Track errors, limits, and webhook status." },
    ],
    bullets: [
      "End-to-end WhatsApp message flow",
      "Template sync and test tools",
      "Inbox triage with categories",
      "Health panel with verification checks",
    ],
  },
  {
    slug: "helper",
    title: "Gigaviz Helper",
    description: "AI assistant for chat, copy, and summaries.",
    status: "OPEN",
    flow: [
      { title: "Start a thread", desc: "Create a helper conversation for your task." },
      { title: "Pick a mode", desc: "Chat, Copy, or Summary with provider auto-select." },
      { title: "Send prompts", desc: "Compose instructions and receive AI replies." },
      { title: "Control automation", desc: "Toggle workflows and budget caps per workspace." },
    ],
    bullets: [
      "Multi-provider LLM routing",
      "Workspace-scoped history and settings",
      "Automation toggle with budgets",
      "Tool intents with audit trail",
    ],
  },
  {
    slug: "studio",
    title: "Gigaviz Studio",
    description: "Parent suite: Office, Graph, Tracks.",
    status: "OPEN",
    flow: [
      { title: "Pick a canvas", desc: "Start with documents, charts, or trackers." },
      { title: "Use templates", desc: "Drop in prebuilt layouts for speed." },
      { title: "Generate visuals", desc: "Prompt for charts or tables on the fly." },
      { title: "Collaborate", desc: "Share within the workspace with roles." },
      { title: "Publish", desc: "Export or share links securely." },
    ],
    bullets: [
      "Unified workspace for docs and visuals",
      "Template-driven creation",
      "Prompt-assisted charts and summaries",
      "Access control with audit-friendly actions",
    ],
  },
  {
    slug: "apps",
    title: "Gigaviz Apps",
    description: "App catalog, requests, ticketing, mini roadmap.",
    status: "OPEN",
    flow: [
      { title: "Browse catalog", desc: "See available first-party and partner apps." },
      { title: "Request access", desc: "Submit requests with justification." },
      { title: "Track tickets", desc: "Follow approvals and setup tasks." },
      { title: "Review roadmap", desc: "Check what's planned and in progress." },
    ],
    bullets: [
      "Centralized app catalog",
      "Request and approval workflow",
      "Ticket visibility for teams",
      "Lightweight roadmap for what’s next",
    ],
  },
  {
    slug: "marketplace",
    title: "Gigaviz Marketplace",
    description: "Marketplace for templates, prompt packs, assets, mini-apps.",
    status: "OPEN",
    flow: [
      { title: "Browse packs", desc: "Find templates, prompts, and assets." },
      { title: "Preview items", desc: "See examples before adding." },
      { title: "Install to workspace", desc: "Add packs with one click." },
      { title: "Manage updates", desc: "Keep items current and revoke as needed." },
    ],
    bullets: [
      "Template and prompt bundles",
      "Workspace-scoped installs",
      "Update and revoke controls",
      "Curated assets for teams",
    ],
  },
  {
    slug: "arena",
    title: "Gigaviz Arena",
    description: "Mini-games and engagement for brands.",
    status: "COMING_SOON",
    flow: [
      { title: "Pick a campaign", desc: "Choose a game or challenge format." },
      { title: "Brand it", desc: "Apply themes, rewards, and rules." },
      { title: "Launch", desc: "Share links or embed for participants." },
      { title: "Track results", desc: "Measure engagement and conversions." },
    ],
    bullets: [
      "Gamified campaigns for audiences",
      "Brand-safe customization",
      "Engagement metrics in one view",
      "Reward mechanics with simple setup",
    ],
  },
  {
    slug: "pay",
    title: "Gigaviz Pay",
    description: "Wallet and billing: invoices, payment links, subscriptions.",
    status: "COMING_SOON",
    flow: [
      { title: "Set up wallet", desc: "Configure payout details and currencies." },
      { title: "Create payment links", desc: "Generate links for one-time charges." },
      { title: "Send invoices", desc: "Issue invoices with reminders." },
      { title: "Track subscriptions", desc: "Monitor recurring plans and status." },
      { title: "Reconcile", desc: "Export records and track settlements." },
    ],
    bullets: [
      "Unified wallet and billing",
      "Payment links and invoices",
      "Subscription tracking",
      "Exports and reconciliation aids",
      "Workspace-level payment controls",
    ],
  },
  {
    slug: "community",
    title: "Gigaviz Community",
    description: "Forum, feedback, showcase, leaderboard, events.",
    status: "COMING_SOON",
    flow: [
      { title: "Join discussions", desc: "Post topics and reply with context." },
      { title: "Share feedback", desc: "Submit ideas and upvote requests." },
      { title: "Showcase work", desc: "Publish wins and templates." },
      { title: "Track events", desc: "Stay updated on meetups and AMAs." },
      { title: "Earn reputation", desc: "Earn badges and see leaderboards." },
    ],
    bullets: [
      "Workspace-aware forums",
      "Feedback loop with votes",
      "Showcase and leaderboard",
      "Event calendar awareness",
      "Badges and reputation signals",
    ],
  },
  {
    slug: "trade",
    title: "Gigaviz Trade",
    description: "Market insights and trading workflows.",
    status: "COMING_SOON",
    flow: [
      { title: "Select markets", desc: "Choose tickers, sectors, or pairs." },
      { title: "Set signals", desc: "Define alerts, thresholds, or rules." },
      { title: "Review insights", desc: "See summaries and risk notes." },
      { title: "Execute safely", desc: "Simulate or forward to execution." },
      { title: "Track performance", desc: "Monitor PnL with guardrails." },
    ],
    bullets: [
      "Signal-driven insights",
      "Alerting and summaries",
      "Workflow-ready handoffs",
      "Risk-aware defaults",
      "Simulated runs with logs",
    ],
  },
];