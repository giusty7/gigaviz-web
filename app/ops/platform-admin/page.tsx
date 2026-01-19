import { notFound, redirect } from "next/navigation";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { getCurrentUser, isPlatformAdminById } from "@/lib/platform-admin/server";

export const dynamic = "force-dynamic";

export default async function PlatformAdminRedirect() {
  const { userId } = await getCurrentUser();
  if (!userId) notFound();
  assertOpsEnabled();
  const platformAdmin = await isPlatformAdminById(userId);
  if (!platformAdmin) notFound();
  redirect("/ops/god-console");
}
