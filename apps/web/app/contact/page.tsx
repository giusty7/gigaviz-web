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
      <h1 className="mb-6 text-3xl font-bold">Kontak</h1>
      <ContactForm />
    </Section>
  );
}
