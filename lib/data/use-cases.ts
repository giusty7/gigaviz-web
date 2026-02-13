/**
 * Use case data for marketing landing pages.
 *
 * Each entry maps to /use-cases/[slug] and describes how
 * Gigaviz solves a specific industry or team vertical.
 */

export interface UseCase {
  slug: string;
  icon: string; // emoji
  title: string;
  headline: string;
  description: string;
  painPoints: string[];
  solutions: string[];
  modules: string[];
  metrics: { label: string; value: string }[];
}

export const useCases: UseCase[] = [
  {
    slug: "ecommerce",
    icon: "🛒",
    title: "E-Commerce & Online Shops",
    headline: "Turn WhatsApp conversations into orders",
    description:
      "Indonesian e-commerce brands use WhatsApp as their primary sales channel. Gigaviz automates order confirmations, shipping updates, and post-sale support through Meta Hub — while Helper AI handles FAQ replies 24/7.",
    painPoints: [
      "Manual copy-paste replies to hundreds of daily WhatsApp messages",
      "No way to track which customers need follow-up",
      "Template messages get rejected or delayed without proper management",
      "Zero visibility into team response times",
    ],
    solutions: [
      "Unified inbox consolidates WhatsApp, Instagram DM, and Messenger in one view",
      "Outbox worker sends template messages (order confirm, shipping, promo) at scale",
      "Helper AI drafts instant replies using your product catalog as knowledge base",
      "Thread assignment and SLA tracking ensure no customer falls through the cracks",
    ],
    modules: ["Meta Hub", "Helper", "Platform"],
    metrics: [
      { label: "Avg. response time", value: "< 5 min" },
      { label: "Messages per day", value: "1,000+" },
      { label: "Team setup time", value: "30 min" },
    ],
  },
  {
    slug: "agency",
    icon: "🏢",
    title: "Digital Marketing Agencies",
    headline: "Manage all your clients from one platform",
    description:
      "Agencies juggling multiple client WhatsApp accounts need workspace isolation, role-based access, and centralized billing. Gigaviz's multi-tenant architecture was built for this exact use case.",
    painPoints: [
      "Switching between multiple WhatsApp Web tabs for different clients",
      "No audit trail when team members message on behalf of clients",
      "Billing complexity across multiple client accounts",
      "Clients want reports but data lives in scattered tools",
    ],
    solutions: [
      "Each client gets a separate workspace with its own WhatsApp connection",
      "Role-based access (owner, admin, member) per workspace with full audit logs",
      "Centralized billing dashboard — one invoice, multiple workspaces",
      "Helper CRM insights generate client-ready engagement reports",
    ],
    modules: ["Platform", "Meta Hub", "Helper"],
    metrics: [
      { label: "Workspaces per agency", value: "Unlimited" },
      { label: "Role granularity", value: "3 levels" },
      { label: "Audit retention", value: "12 months" },
    ],
  },
  {
    slug: "healthcare",
    icon: "🏥",
    title: "Healthcare & Clinics",
    headline: "Patient communication that stays compliant",
    description:
      "Clinics and healthcare providers need reliable appointment reminders, lab result notifications, and patient follow-ups — all through WhatsApp with proper data isolation per branch.",
    painPoints: [
      "Patients miss appointments because reminders arrive too late",
      "Staff manually sends follow-up messages one by one",
      "Multi-branch clinics share one WhatsApp with no isolation",
      "No structured patient communication history",
    ],
    solutions: [
      "Template-based appointment reminders sent automatically via outbox worker",
      "Each branch operates as its own workspace with dedicated WhatsApp number",
      "Thread-based conversation history per patient for continuity of care",
      "Entitlement system controls which branches access which features",
    ],
    modules: ["Meta Hub", "Platform"],
    metrics: [
      { label: "Reminder delivery rate", value: "99.2%" },
      { label: "Branches per org", value: "Unlimited" },
      { label: "Setup per branch", value: "15 min" },
    ],
  },
  {
    slug: "education",
    icon: "🎓",
    title: "Education & Course Providers",
    headline: "Engage students where they already are",
    description:
      "Online course providers and schools use WhatsApp to share class schedules, collect assignments, and announce events. Gigaviz makes this scalable without losing the personal touch.",
    painPoints: [
      "Broadcast messages get flagged as spam without proper templates",
      "No way to segment students by class or enrollment status",
      "Admin staff overwhelmed by repetitive questions",
      "Parent communication requires separate channels",
    ],
    solutions: [
      "Approved WhatsApp templates for announcements, reminders, and enrollment confirmations",
      "Contact tagging and segmentation for targeted messaging",
      "Helper AI answers FAQs (schedule, fees, location) from your knowledge base",
      "Separate workspaces for different schools or departments",
    ],
    modules: ["Meta Hub", "Helper", "Platform"],
    metrics: [
      { label: "Template approval rate", value: "95%+" },
      { label: "FAQ automation", value: "70% deflection" },
      { label: "Students per workspace", value: "10,000+" },
    ],
  },
  {
    slug: "fnb",
    icon: "🍽️",
    title: "Food & Beverage",
    headline: "From order to delivery, all on WhatsApp",
    description:
      "F&B businesses in Indonesia live on WhatsApp. Gigaviz helps restaurants, cafés, and catering services manage orders, promotions, and customer loyalty — without a dedicated app.",
    painPoints: [
      "Orders come in via WhatsApp but get lost in chat history",
      "Promo blasts to customers are manual and time-consuming",
      "No way to identify repeat customers or track loyalty",
      "Multiple outlets need separate WhatsApp management",
    ],
    solutions: [
      "Thread-based order tracking with automatic status templates",
      "Outbox worker sends promotional templates to segmented customer lists",
      "Contact CRM tracks order frequency and customer lifetime value",
      "Multi-workspace setup for each outlet with shared billing",
    ],
    modules: ["Meta Hub", "Helper", "Platform"],
    metrics: [
      { label: "Order confirmation speed", value: "Instant" },
      { label: "Promo reach", value: "500+ contacts/batch" },
      { label: "Outlets per account", value: "Unlimited" },
    ],
  },
];
