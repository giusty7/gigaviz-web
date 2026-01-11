import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsLayout } from "@/components/layout/settings-layout";

type Props = {
  params: Promise<{ workspaceSlug: string }> | { workspaceSlug: string };
};

const palette = [
  { name: "Navy", css: "--gv-navy", className: "bg-gigaviz-navy" },
  { name: "Gold", css: "--gv-gold", className: "bg-gigaviz-gold text-gigaviz-navy" },
  { name: "Magenta", css: "--gv-magenta", className: "bg-gigaviz-magenta" },
  { name: "Cream", css: "--gv-cream", className: "bg-gigaviz-cream text-gigaviz-navy" },
];

const semantic = [
  { label: "Background", css: "--background", tw: "bg-background text-foreground" },
  { label: "Card", css: "--card", tw: "bg-card border border-border" },
  { label: "Surface (muted)", css: "--muted", tw: "bg-muted text-muted-foreground" },
  { label: "Accent", css: "--accent", tw: "bg-accent text-accent-foreground" },
  { label: "Border", css: "--border", tw: "border border-border" },
  { label: "Ring", css: "--ring", tw: "ring-2 ring-ring" },
];

export default async function DesignTokensPage({ params }: Props) {
  const { workspaceSlug } = (await params) as { workspaceSlug: string };
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  return (
    <SettingsLayout
      title="Design Tokens"
      description="Palet warna, radius, dan tipografi Gigaviz. Gunakan kelas Tailwind yang sudah terhubung ke CSS variables."
    >
      <Card>
        <CardHeader>
          <CardTitle>Brand Palette</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {palette.map((item) => (
            <div
              key={item.css}
              className={`rounded-xl border border-border p-3 text-sm font-semibold ${item.className}`}
            >
              <div>{item.name}</div>
              <div className="text-xs opacity-80">{item.css}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Semantic Tokens</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {semantic.map((item) => (
            <div
              key={item.css}
              className={`rounded-xl border border-border bg-card p-4 text-sm text-foreground`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.css}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold ${item.tw}`}
                >
                  {item.tw}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spacing, Radius, Typography</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Spacing: var(--gv-space-1..6) di-map ke kelas tailwind <code>space-gv-*</code>.
          </p>
          <p>
            Radius: var(--gv-radius-sm..2xl) di-map ke kelas tailwind <code>rounded-sm..rounded-2xl</code>.
          </p>
          <p>
            Font size: var(--gv-text-xs..4xl) sudah terhubung ke skala font Tailwind (xs..4xl).
          </p>
          <p>Contoh tombol utama: <code>bg-gigaviz-gold text-gigaviz-navy rounded-lg</code></p>
        </CardContent>
      </Card>
    </SettingsLayout>
  );
}

