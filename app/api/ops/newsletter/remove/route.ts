import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const schema = z.object({
  id: z.string().uuid(),
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validated = schema.parse(body);

  const db = supabaseAdmin();
  const { error } = await db
    .from("newsletter_subscribers")
    .delete()
    .eq("id", validated.id);

  if (error) {
    logger.error("[OPS-NEWSLETTER] Delete failed", { error, subscriberId: validated.id });
    return NextResponse.json({ error: "Failed to remove subscriber" }, { status: 500 });
  }

  logger.info("[OPS-NEWSLETTER] Subscriber removed", {
    subscriberId: validated.id,
    actor: admin.actorEmail,
  });

  return NextResponse.json({ ok: true });
});
