import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Stay up to date with the latest features, improvements, and fixes in Gigaviz.",
  alternates: {
    canonical: "/changelog",
  },
  openGraph: {
    title: "Changelog — Gigaviz",
    description:
      "Stay up to date with the latest features, improvements, and fixes in Gigaviz.",
    url: "/changelog",
  },
  twitter: {
    card: "summary",
    title: "Changelog — Gigaviz",
    description:
      "Stay up to date with the latest features, improvements, and fixes in Gigaviz.",
  },
};

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
