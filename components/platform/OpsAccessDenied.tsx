import { ClaimPlatformAdminButton } from "@/components/platform/ClaimPlatformAdminButton";

export function OpsAccessDenied({ allowClaim }: { allowClaim: boolean }) {
  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-sm text-amber-50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-semibold text-foreground">Admin access required</p>
          <p className="text-sm text-amber-100/80">
            You must be a platform admin to access this page.
          </p>
        </div>
        {allowClaim ? <ClaimPlatformAdminButton variant="secondary" /> : null}
      </div>
    </div>
  );
}
