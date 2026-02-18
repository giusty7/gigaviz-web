import type { Metadata } from "next";
import { defaultMetadata } from "@/lib/seo";
import { SCHEMA_CONTEXT, organizationSchema, websiteSchema } from "@/lib/seo/schema";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { GAPageView } from "@/components/analytics/ga-pageview";
import { Toaster } from "@/components/ui/toaster";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations("common");

  const globalSchema = {
    "@context": SCHEMA_CONTEXT,
    "@graph": [organizationSchema(), websiteSchema()],
  };

  return (
    <html lang={locale}>
      <body
        className={`min-h-screen bg-gigaviz-bg text-gigaviz-cream font-sans ${gvSans.variable} ${gvDisplay.variable}`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-gigaviz-gold focus:px-4 focus:py-2 focus:text-gigaviz-navy focus:font-semibold focus:shadow-lg focus:outline-none"
        >
          {t("skipToContent")}
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalSchema) }}
        />
        <GoogleAnalytics />
        <GAPageView />
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}


