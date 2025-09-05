import Section from "@/components/Section";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import type { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Beranda",
  description: "Platform visualisasi data modern.",
  alternates: { canonical: canonical("/") },
};

export default function Home() {
  return (
    <main>
      <Section className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Gigaviz
        </h1>
        <p className="mt-4 text-muted-foreground">
          Platform visualisasi data modern.
        </p>
        <div className="mt-6">
          <Button asChild>
            <a href="/contact">Hubungi kami</a>
          </Button>
        </div>
      </Section>
      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <h3 className="font-semibold mb-2">Fitur {i}</h3>
              <p className="text-sm text-muted-foreground">
                Deskripsi singkat fitur {i}.
              </p>
            </Card>
          ))}
        </div>
      </Section>
    </main>
  );
}
