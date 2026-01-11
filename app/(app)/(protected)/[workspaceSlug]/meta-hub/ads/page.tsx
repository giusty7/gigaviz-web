import { DisabledModuleState } from "@/components/meta-hub/DisabledModuleState";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";

export default function MetaHubAdsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Ads</h2>
          <p className="text-sm text-muted-foreground">
            Placeholder: campaign management dan audience sync akan hadir.
          </p>
        </div>
        <MetaHubBadge status="soon" />
      </div>
      <DisabledModuleState
        title="Ads"
        description="Kelola kampanye, audience, dan reporting Meta di satu tempat. Daftar untuk akses lebih awal."
        ctaLabel="Join Waitlist"
        ctaHref="/contact"
      />
    </div>
  );
}

