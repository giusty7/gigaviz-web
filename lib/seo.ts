import type { Metadata } from "next";

export const defaultMetadata: Metadata = {
  title: {
    default: "Gigaviz | Glorious Victorious",
    template: "%s | Gigaviz",
  },
  description:
    "Gigaviz is a digital product ecosystem to create, automate, monetize, and manage in one system.",
  metadataBase: new URL("https://gigaviz.com"),
  alternates: {
    canonical: "https://gigaviz.com",
    languages: {
      en: "https://gigaviz.com",
      id: "https://gigaviz.com/id",
    },
  },
  openGraph: {
    title: "Gigaviz | Glorious Victorious",
    description:
      "A digital product ecosystem built for teams to move fast with control.",
    url: "https://gigaviz.com",
    siteName: "Gigaviz",
    type: "website",
    locale: "en_US",
    alternateLocale: ["id_ID"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gigaviz | Glorious Victorious",
    description:
      "A digital product ecosystem built for teams to move fast with control.",
    creator: "@gigaviz",
    site: "@gigaviz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};
