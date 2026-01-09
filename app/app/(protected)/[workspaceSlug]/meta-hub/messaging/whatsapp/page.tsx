import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";

const tabs = ["Setup", "Templates", "Inbox", "Scheduler"];

export default function MetaHubWhatsappPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">WhatsApp Hub</h2>
          <p className="text-sm text-muted-foreground">
            Placeholder shell: Setup, Templates, Inbox, Scheduler.
          </p>
        </div>
        <MetaHubBadge status="live" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className="rounded-lg border border-border bg-gigaviz-surface px-3 py-2 text-sm font-semibold text-foreground hover:border-gigaviz-gold"
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
          Konten untuk tab ini akan diisi pada fase berikutnya. Tidak ada API yang dipanggil saat ini.
        </div>
      </div>
    </div>
  );
}
