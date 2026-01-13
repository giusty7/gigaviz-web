import { DisabledModuleState } from "@/components/meta-hub/DisabledModuleState";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";

export default function MetaHubMessengerPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Messenger</h2>
          <p className="text-sm text-muted-foreground">
            Placeholder: Messenger send/receive will be available after testing.
          </p>
        </div>
        <MetaHubBadge status="soon" />
      </div>
      <DisabledModuleState
        title="Messenger"
        description="Send/receive messages, webhook events, and templates will be available. Contact us for early access."
        ctaLabel="Contact Sales"
        ctaHref="/contact"
      />
    </div>
  );
}

