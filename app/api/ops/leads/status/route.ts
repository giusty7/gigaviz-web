import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const schema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]),
});

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validated = schema.parse(body);

  const db = supabaseAdmin();
  const { error } = await db
    .from("leads")
    .update({ status: validated.status })
    .eq("id", validated.leadId);

  if (error) {
    logger.error("[OPS-LEADS] Status update failed", { error, leadId: validated.leadId });
    return NextResponse.json({ error: "Failed to update lead status" }, { status: 500 });
  }

  logger.info("[OPS-LEADS] Status updated", {
    leadId: validated.leadId,
    status: validated.status,
    actor: admin.actorEmail,
  });

  return NextResponse.json({ ok: true });
});
