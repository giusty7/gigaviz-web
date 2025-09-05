import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  title: {
    default: "Gigaviz — Coming Soon",
    template: "%s — Gigaviz",
  },
  description: "Situs resmi Gigaviz segera hadir.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Gigaviz — Coming Soon",
    description: "Situs resmi Gigaviz segera hadir.",
    url: "/",
    siteName: "Gigaviz",
    images: ["/opengraph-image"],
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
