import type { Metadata } from "next";

export const defaultMetadata: Metadata = {
  title: {
    default: "Gigaviz | Glorious Victorious",
    template: "%s | Gigaviz",
  },
  description:
    "Gigaviz is a digital product ecosystem to create, automate, monetize, and manage in one system.",
  metadataBase: new URL("https://gigaviz.com"),
  openGraph: {
    title: "Gigaviz | Glorious Victorious",
    description:
      "A digital product ecosystem built for teams to move fast with control.",
    url: "https://gigaviz.com",
    siteName: "Gigaviz",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};
