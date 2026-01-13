import { DisabledModuleState } from "@/components/meta-hub/DisabledModuleState";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";

export default function MetaHubInsightsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Insights</h2>
          <p className="text-sm text-muted-foreground">
            Placeholder: performance dashboards and alerts will be available.
          </p>
        </div>
        <MetaHubBadge status="soon" />
      </div>
      <DisabledModuleState
        title="Insights"
        description="Performance summaries, alerts, and Meta channel monitoring are coming soon. Contact sales for more info."
        ctaLabel="Contact Sales"
        ctaHref="/contact"
      />
    </div>
  );
}

