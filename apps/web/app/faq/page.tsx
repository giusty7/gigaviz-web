import Section from "@/components/Section";
import type { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Pertanyaan yang sering diajukan.",
  alternates: { canonical: canonical("/faq") },
};

const faqs = [
  { q: "Apa itu Gigaviz?", a: "Platform visualisasi data." },
  { q: "Bagaimana cara memulai?", a: "Hubungi kami untuk demo." },
];

export default function FAQPage() {
  return (
    <Section>
      <h1 className="text-3xl font-bold mb-8">FAQ</h1>
      <div className="space-y-4">
        {faqs.map((f, i) => (
          <details key={i} className="border border-border rounded-md p-4">
            <summary className="cursor-pointer font-medium">{f.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
