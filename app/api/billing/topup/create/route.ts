import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace, requireWorkspaceRole } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  packageId: z.string().optional(),
  customAmountIdr: z.number().int().min(10_000).max(10_000_000).optional(),
});

const packages: Record<string, { amountIdr: number; tokens: number; label: string }> = {
  pkg_50k: { amountIdr: 50_000, tokens: 50_000, label: "50.000" },
  pkg_100k: { amountIdr: 100_000, tokens: 105_000, label: "100.000 + bonus" },
  pkg_500k: { amountIdr: 500_000, tokens: 550_000, label: "500.000 + bonus" },
};

export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, role, user, withCookies } = guard;

  if (!requireWorkspaceRole(role, ["owner", "admin"])) {
    return withCookies(
      NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
    );
  }

  const limiter = rateLimit(`billing-topup:${user.id}`, {
    windowMs: 60_000,
    max: 10,
  });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  const body = guard.body ?? await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const { packageId, customAmountIdr } = parsed.data;

  let amountIdr = 0;
  let tokens = 0;
  let label = "Custom";

  if (packageId && packages[packageId]) {
    amountIdr = packages[packageId].amountIdr;
    tokens = packages[packageId].tokens;
    label = packages[packageId].label;
  } else if (customAmountIdr) {
    amountIdr = customAmountIdr;
    tokens = customAmountIdr;
  } else {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "package_invalid", message: "Paket top up tidak valid" },
        { status: 400 }
      )
    );
  }

  const now = new Date().toISOString();
  // payment_intents needs service-role for inserts
  const adminDb = supabaseAdmin();
  const { data: intent, error } = await adminDb
    .from("payment_intents")
    .insert({
      workspace_id: workspaceId,
      kind: "topup",
      amount_idr: amountIdr,
      status: "pending",
      provider: "manual",
      provider_ref: null,
      checkout_url: null,
      meta: { tokens, package_id: packageId ?? null, label },
      created_at: now,
      updated_at: now,
    })
    .select("id, status, amount_idr, provider, checkout_url, meta")
    .single();

  if (error || !intent) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: "intent_create_failed", message: error?.message ?? "Gagal membuat intent" },
        { status: 500 }
      )
    );
  }

  return withCookies(
    NextResponse.json({
      ok: true,
      paymentIntentId: intent.id,
      status: intent.status,
      amountIdr: intent.amount_idr,
      tokens,
      checkoutUrl: intent.checkout_url,
      provider: intent.provider,
    })
  );
}
