import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
  other: {
    "X-Robots-Tag": "noindex, nofollow",
  },
};

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  // Kill switch: OPS_ENABLED must be "1" (defaults to "1" in dev)
  assertOpsEnabled();

  // Auth guard: only platform admins may access /ops/*
  const ctx = await requirePlatformAdmin();
  if (!ctx.ok) {
    redirect(ctx.reason === "not_authenticated" ? "/login" : "/");
  }

  return children;
}
