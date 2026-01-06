import type { Metadata } from "next";
import { defaultMetadata } from "@/lib/seo";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
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
  return (
    <html lang="id">
      <body
        className={`min-h-screen bg-gigaviz-bg text-slate-50 font-sans ${gvSans.variable} ${gvDisplay.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
