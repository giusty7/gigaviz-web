import { DisabledModuleState } from "@/components/meta-hub/DisabledModuleState";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";

export default function MetaHubInsightsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Insights</h2>
          <p className="text-sm text-muted-foreground">
            Placeholder: performance dashboards dan alert akan tersedia.
          </p>
        </div>
        <MetaHubBadge status="soon" />
      </div>
      <DisabledModuleState
        title="Insights"
        description="Ringkasan performa, alert, dan monitoring kanal Meta akan hadir. Hubungi sales untuk info lebih lanjut."
        ctaLabel="Hubungi Sales"
        ctaHref="/contact"
      />
    </div>
  );
}
