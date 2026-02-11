import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace, requireWorkspaceRole } from "@/lib/auth/guard";
import { settlePaymentIntentPaid } from "@/lib/billing/topup";

export const runtime = "nodejs";

const schema = z.object({
  paymentIntentId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, role, user, withCookies } = guard;

  if (!requireWorkspaceRole(role, ["owner", "admin"])) {
    return withCookies(
      NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
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

  const { paymentIntentId } = parsed.data;

  const settled = await settlePaymentIntentPaid(paymentIntentId, {
    workspaceId,
    provider: "manual",
    meta: { triggered_by: user.id },
  });

  if (!settled.ok) {
    return withCookies(
      NextResponse.json(
        { ok: false, code: settled.code, message: settled.message },
        { status: 400 }
      )
    );
  }

  return withCookies(
    NextResponse.json({
      ok: true,
      status: settled.status,
      tokens: settled.tokens,
      paymentIntentId: settled.paymentIntentId,
    })
  );
}
