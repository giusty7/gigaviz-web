import Section from "@/components/Section";
import { Card } from "@/components/Card";
import type { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Layanan",
  description: "Layanan yang kami tawarkan.",
  alternates: { canonical: canonical("/services") },
};

export default function ServicesPage() {
  return (
    <Section>
      <h1 className="text-3xl font-bold mb-8">Layanan Kami</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i}>
            <h3 className="font-semibold mb-2">Layanan {i + 1}</h3>
            <p className="text-sm text-muted-foreground">Deskripsi singkat.</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
