import { redirect } from "next/navigation";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";

export const dynamic = "force-dynamic";

export default async function PlatformAdminRedirect() {
  assertOpsEnabled();
  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");
  redirect("/ops/god-console");
}
