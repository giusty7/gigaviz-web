import Section from "@/components/Section";
import type { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Tentang",
  description: "Informasi tentang Gigaviz.",
  alternates: { canonical: canonical("/about") },
};

export default function AboutPage() {
  return (
    <Section>
      <h1 className="text-3xl font-bold mb-6">Tentang Kami</h1>
      <p className="text-muted-foreground">
        Gigaviz membantu bisnis memahami data melalui visualisasi yang jelas.
      </p>
    </Section>
  );
}
