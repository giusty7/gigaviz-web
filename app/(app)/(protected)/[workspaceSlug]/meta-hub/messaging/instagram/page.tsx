import { DisabledModuleState } from "@/components/meta-hub/DisabledModuleState";
import { MetaHubBadge } from "@/components/meta-hub/MetaHubBadge";

export default function MetaHubInstagramPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Instagram Messaging</h2>
          <p className="text-sm text-muted-foreground">
            Placeholder: this channel will be available after DM API support is enabled.
          </p>
        </div>
        <MetaHubBadge status="soon" />
      </div>
      <DisabledModuleState
        title="Instagram Messaging"
        description="DM API, story mentions, and webhooks are coming soon. Join the waitlist for priority access."
        ctaLabel="Join Waitlist"
        ctaHref="/contact"
      />
    </div>
  );
}

