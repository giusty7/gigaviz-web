import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { sendOpsCustomWa } from "@/lib/ops/wa-internal";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const schema = z.object({
  to: z.string().min(3).max(30),
  message: z.string().min(1).max(4096),
  leadId: z.string().uuid(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validated = schema.parse(body);

  // Send WhatsApp message
  const result = await sendOpsCustomWa({
    to: validated.to,
    message: validated.message,
  });

  if (!result.ok) {
    logger.error("[OPS-LEADS] WA send failed", {
      leadId: validated.leadId,
      to: validated.to,
      error: result.error,
    });
    return NextResponse.json(
      { error: result.error || "Failed to send WhatsApp message" },
      { status: 500 }
    );
  }

  // Log the outreach in lead_attempts
  const db = supabaseAdmin();
  try {
    await db.from("lead_attempts").insert({
      lead_id: validated.leadId,
      status: "wa_sent",
      reason: "ops_manual_followup",
      name: admin.actorEmail,
      source: "ops-internal",
    });
  } catch (logErr) {
    logger.warn("[OPS-LEADS] Failed to log WA outreach", { error: logErr });
  }

  // Auto-update lead status to contacted if still new
  try {
    await db
      .from("leads")
      .update({ status: "contacted" })
      .eq("id", validated.leadId)
      .eq("status", "new");
  } catch (updateErr) {
    logger.warn("[OPS-LEADS] Auto-status update failed", { error: updateErr });
  }

  logger.info("[OPS-LEADS] WA message sent to lead", {
    leadId: validated.leadId,
    to: validated.to,
    actor: admin.actorEmail,
    channel: result.channel,
  });

  return NextResponse.json({ ok: true, channel: result.channel });
});
