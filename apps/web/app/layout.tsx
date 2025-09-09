import "@/styles/globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { brand } from "@/lib/seo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
     default: `${brand} — Data & AI`,
    template: `%s — ${brand}`,
  },
  description: "Solusi visualisasi data & AI yang cepat dan andal.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: `${brand} — Data & AI`,
    description: "Solusi visualisasi data & AI yang cepat dan andal.",
    siteName: brand,
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand} — Data & AI`,
    description: "Solusi visualisasi data & AI yang cepat dan andal.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
