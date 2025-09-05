import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import Section from "@/components/Section";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Kontak",
  description: "Hubungi tim Gigaviz.",
  alternates: { canonical: canonical("/contact") },
};

export default function ContactPage() {
  return (
    <Section>
      <h1 className="text-3xl font-bold mb-6">Kontak</h1>
      <ContactForm />
    </Section>
  );
}
