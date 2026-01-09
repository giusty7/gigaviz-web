import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";
import { getMetaHubFlags } from "@/lib/meta-hub/config";

export default function MetaHubOverviewPage() {
  const flags = getMetaHubFlags();
  const connectors = [
    { name: "WhatsApp", status: flags.waEnabled ? "live" : "beta", desc: "Template, inbox, scheduler." },
    { name: "Instagram", status: flags.igEnabled ? "beta" : "soon", desc: "DM API, webhook events." },
    { name: "Messenger", status: flags.msEnabled ? "beta" : "soon", desc: "Send/receive messages." },
    { name: "Ads", status: flags.adsEnabled ? "beta" : "soon", desc: "Campaign management & audiences." },
    { name: "Insights", status: flags.insightsEnabled ? "beta" : "soon", desc: "Performance and alerts." },
  ] as const;

  const roadmap = [
    { title: "Template WA", status: "Live", desc: "Pengelolaan template & approval flow." },
    { title: "Webhook Events", status: "Beta", desc: "Event log & filter per workspace." },
    { title: "Instagram DM", status: "Soon", desc: "Koneksi DM + webhook story mention." },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold text-foreground">Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ringkasan status integrasi Meta. WhatsApp live, konektor lain menyusul.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {connectors.map((c) => (
            <div key={c.name} className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-foreground">{c.name}</p>
                <MetaHubBadge status={c.status as "live" | "beta" | "soon"} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground">Roadmap singkat</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Fase berikutnya berfokus pada stabilitas, webhooks, dan kanal tambahan.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {roadmap.map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">{item.title}</p>
                <MetaHubBadge
                  status={
                    item.status.toLowerCase() as "live" | "beta" | "soon"
                  }
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
