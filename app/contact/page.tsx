import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Kontak",
  description:
    "Hubungi Gigaviz untuk diskusi kebutuhan WA Blast, dashboard, atau produk digital lainnya.",
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gigaviz-bg">
      <Navbar />
      <main className="flex-1 border-b border-slate-800/60">
        <div className="container py-12 md:py-16">
          <ContactForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
