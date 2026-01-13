export type Policy = {
  slug: string;
  title: string;
  description: string;
  file: string;
};

export const policies: Policy[] = [
  {
    slug: "terms-of-service",
    title: "Terms of Service",
    description:
      "Rules for using the Gigaviz platform and the scope of services.",
    file: "terms-of-service.md",
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    description:
      "How we manage personal data and keep information secure.",
    file: "privacy-policy.md",
  },
  {
    slug: "data-deletion",
    title: "Data Deletion Instructions",
    description:
      "Official instructions for requesting data deletion from Gigaviz.",
    file: "data-deletion.md",
  },
  {
    slug: "acceptable-use-policy",
    title: "Acceptable Use Policy",
    description:
      "Rules for safe, legal, and responsible use of our services.",
    file: "acceptable-use-policy.md",
  },
  {
    slug: "messaging-policy",
    title: "Messaging Policy",
    description:
      "Anti-spam, opt-in, and opt-out rules for WhatsApp messaging.",
    file: "messaging-policy.md",
  },
  {
    slug: "refund-cancellation",
    title: "Refund and Cancellation Policy",
    description:
      "Refund and cancellation terms for subscription services.",
    file: "refund-cancellation.md",
  },
];

export const policySlugs = policies.map((policy) => policy.slug);

export function getPolicyBySlug(slug: string) {
  return policies.find((policy) => policy.slug === slug);
}
