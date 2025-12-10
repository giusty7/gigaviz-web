import type { Metadata } from "next";
import { defaultMetadata } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-gigaviz-bg text-slate-50 font-sans">
        {children}
      </body>
    </html>
  );
}
