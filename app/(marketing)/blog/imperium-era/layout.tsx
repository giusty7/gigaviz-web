import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Introducing Gigaviz Imperium v2.0 | Official Meta Technology Provider",
  description:
    "Gigaviz achieves Official Technology Provider status on WhatsApp Business Platform. Discover the new Imperium identity and the 7-product ecosystem.",
  keywords: [
    "Gigaviz",
    "Imperium",
    "Meta Technology Provider",
    "WhatsApp Business Platform",
    "Enterprise SaaS",
    "7-product ecosystem",
  ],
  authors: [{ name: "Gigaviz Team" }],
  openGraph: {
    title: "Introducing Gigaviz Imperium v2.0",
    description:
      "Official Meta Technology Provider status achieved. Explore the new Navy, Gold, and Magenta identity.",
    url: "/blog/imperium-era",
    type: "article",
    publishedTime: "2026-01-16T00:00:00.000Z",
    authors: ["Gigaviz Team"],
    tags: ["Product Launch", "Meta", "WhatsApp", "Enterprise"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Introducing Gigaviz Imperium v2.0",
    description:
      "Official Meta Technology Provider status achieved. Explore the 7-product ecosystem.",
  },
  alternates: {
    canonical: "/blog/imperium-era",
  },
};

export default function ImperiumEraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
