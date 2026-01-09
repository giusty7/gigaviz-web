import { DisabledModuleState } from "@/components/meta-hub/DisabledModuleState";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";

export default function MetaHubInstagramPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Instagram Messaging</h2>
          <p className="text-sm text-muted-foreground">
            Placeholder: kanal akan tersedia setelah dukungan DM API diaktifkan.
          </p>
        </div>
        <MetaHubBadge status="soon" />
      </div>
      <DisabledModuleState
        title="Instagram Messaging"
        description="DM API, story mention, dan webhook akan hadir. Daftar tunggu untuk prioritas."
        ctaLabel="Join Waitlist"
        ctaHref="/contact"
      />
    </div>
  );
}
