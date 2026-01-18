import type { Metadata } from "next";
import { defaultMetadata } from "@/lib/seo";
import { SCHEMA_CONTEXT, organizationSchema, websiteSchema } from "@/lib/seo/schema";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { GAPageView } from "@/components/analytics/ga-pageview";
import { Toaster } from "@/components/ui/toaster";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const gvSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-gv",
});

const gvDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-gv-display",
});

export const metadata: Metadata = {
  ...defaultMetadata,
  icons: {
    icon: [
      { url: "/brand/gigaviz-mark-dark.png", media: "(prefers-color-scheme: light)" },
      { url: "/brand/gigaviz-mark-gold.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/brand/gigaviz-mark-gold.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const globalSchema = {
    "@context": SCHEMA_CONTEXT,
    "@graph": [organizationSchema(), websiteSchema()],
  };

  return (
    <html lang="id">
      <body
        className={`min-h-screen bg-gigaviz-bg text-gigaviz-cream font-sans ${gvSans.variable} ${gvDisplay.variable}`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalSchema) }}
        />
        <GoogleAnalytics />
        <GAPageView />
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}


