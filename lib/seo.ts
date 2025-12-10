import type { Metadata } from "next";

export const defaultMetadata: Metadata = {
  title: {
    default: "Gigaviz — Ekosistem Digital Glorious Victorious",
    template: "%s | Gigaviz",
  },
  description:
    "Gigaviz adalah ekosistem produk digital: WA Blast, dashboard kinerja, musik, dan tools kreatif untuk tim yang ingin naik level.",
  metadataBase: new URL("https://gigaviz.com"),
  openGraph: {
    title: "Gigaviz — Ekosistem Digital Glorious Victorious",
    description:
      "Ekosistem produk digital: WA Blast, dashboard kinerja, musik, dan tools kreatif.",
    url: "https://gigaviz.com",
    siteName: "Gigaviz",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};
