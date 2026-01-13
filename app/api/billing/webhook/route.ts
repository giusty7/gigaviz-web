import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logging";
import { settlePaymentIntentPaid } from "@/lib/billing/topup";

export const runtime = "nodejs";

const schema = z.object({
  provider: z.string().optional().default("manual"),
  provider_event_id: z.string().optional(),
  payment_intent_id: z.string().uuid().optional(),
  provider_ref: z.string().optional(),
  status: z.enum(["paid", "failed", "expired"]).optional().default("paid"),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const limiter = rateLimit(`billing-webhook`, { windowMs: 60_000, max: 60 });
  if (!limiter.ok) {
    return NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { provider, provider_event_id, payment_intent_id, provider_ref, status, meta } =
    parsed.data;

  const db = supabaseAdmin();

  if (provider_event_id) {
    const { error: eventError } = await db.from("payment_events").insert({
      provider,
      provider_event_id,
      payload: body ?? {},
      received_at: new Date().toISOString(),
    });
    if (eventError && !eventError.message.includes("duplicate key")) {
      logger.warn("[billing-webhook] event insert failed", { message: eventError.message });
    }
  }

  let intentQuery = db
    .from("payment_intents")
    .select("id, workspace_id, amount_idr, status, meta")
    .eq("provider", provider);

  if (payment_intent_id) {
    intentQuery = intentQuery.eq("id", payment_intent_id);
  } else if (provider_ref) {
    intentQuery = intentQuery.eq("provider_ref", provider_ref);
  } else {
    return NextResponse.json(
      { error: "bad_request", reason: "payment_intent_required" },
      { status: 400 }
    );
  }

  const { data: intent, error: intentError } = await intentQuery.maybeSingle();
  if (intentError || !intent) {
    return NextResponse.json(
      { error: "not_found", reason: "payment_intent_not_found" },
      { status: 404 }
    );
  }

  if (intent.status === "paid") {
    return NextResponse.json({ ok: true, status: "already_paid" });
  }

  if (status !== "paid") {
    await db
      .from("payment_intents")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", intent.id);
    return NextResponse.json({ ok: true, status });
  }

  try {
    const settled = await settlePaymentIntentPaid(intent.id, {
      provider,
      meta: { ...((meta ?? {}) as Record<string, unknown>) },
    });
    if (!settled.ok) {
      return NextResponse.json(
        { ok: false, error: settled.code, message: settled.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, status: settled.status, tokens: settled.tokens });
  } catch (err) {
    logger.error("[billing-webhook] token credit failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json({ ok: false, error: "ledger_failed" }, { status: 500 });
  }
}
