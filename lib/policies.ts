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
      "Ketentuan penggunaan platform Gigaviz dan ruang lingkup layanan.",
    file: "terms-of-service.md",
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    description:
      "Cara kami mengelola data pribadi dan menjaga keamanan informasi.",
    file: "privacy-policy.md",
  },
  {
    slug: "acceptable-use-policy",
    title: "Acceptable Use Policy",
    description:
      "Aturan penggunaan layanan agar tetap aman, legal, dan bertanggung jawab.",
    file: "acceptable-use-policy.md",
  },
  {
    slug: "messaging-policy",
    title: "Messaging Policy",
    description:
      "Kebijakan anti-spam, opt-in, dan opt-out untuk pesan WhatsApp.",
    file: "messaging-policy.md",
  },
  {
    slug: "refund-cancellation",
    title: "Refund and Cancellation Policy",
    description:
      "Ketentuan pembatalan dan pengembalian dana untuk layanan berlangganan.",
    file: "refund-cancellation.md",
  },
];

export const policySlugs = policies.map((policy) => policy.slug);

export function getPolicyBySlug(slug: string) {
  return policies.find((policy) => policy.slug === slug);
}
