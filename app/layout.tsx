import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Gigaviz — Coming Soon",
  description: "Situs resmi Gigaviz segera hadir.",
  metadataBase: new URL("https://gigaviz.com"),
  alternates: { canonical: "https://gigaviz.com" },
  openGraph: {
    title: "Gigaviz — Coming Soon",
    description: "Situs resmi Gigaviz segera hadir.",
    url: "https://gigaviz.com",
    siteName: "Gigaviz",
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
