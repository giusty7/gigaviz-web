import Section from "@/components/section";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-7rem)] grid place-items-center">
      <Section className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Gigaviz</h1>
        <p className="mt-4 text-white/70">
          Situs resmi lagi disiapke. Kagek hadir lengkap. ✨
        </p>
        <div className="mt-6">
          <Button asChild variant="outline" className="rounded-xl">
            <a href="mailto:hello@gigaviz.com">Hubungi kami</a>
          </Button>
        </div>
      </Section>
    </main>
  );
}
