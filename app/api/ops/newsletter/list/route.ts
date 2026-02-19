import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const GET = withErrorHandler(async () => {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = supabaseAdmin();
  const { data: subscribers, error } = await db
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    logger.error("[OPS-NEWSLETTER] Failed to fetch subscribers", { error });
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }

  return NextResponse.json({ subscribers: subscribers ?? [] });
});
