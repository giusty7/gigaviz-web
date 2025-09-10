import Section from "@/components/Section";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import type { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Harga",
  description: "Pilihan paket harga.",
  alternates: { canonical: canonical("/pricing") },
};

const tiers = [
  { name: "Basic", price: "Gratis" },
  { name: "Pro", price: "$10" },
  { name: "Enterprise", price: "Hubungi kami" },
];

export default function PricingPage() {
  return (
    <Section>
      <h1 className="text-3xl font-bold mb-8">Harga</h1>
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <Card key={tier.name} className="text-center flex flex-col">
            <h3 className="font-semibold mb-2">{tier.name}</h3>
            <p className="text-2xl mb-4">{tier.price}</p>
            <Button className="mt-auto">Pilih</Button>
          </Card>
        ))}
      </div>
    </Section>
  );
}
