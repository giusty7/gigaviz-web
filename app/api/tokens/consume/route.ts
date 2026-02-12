import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { tokenRates } from "@/lib/tokenRates";
import {
  consumeTokens,
  tokenActionFeatureMap,
} from "@/lib/tokens";
import { rateLimit } from "@/lib/rate-limit";
import { recordUsage } from "@/lib/usage/server";
import type { TokenActionKey } from "@/lib/tokenRates";
import { guardWorkspace } from "@/lib/auth/guard";
import { assertEntitlement, assertTokenBudget } from "@/lib/billing/guards";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const consumeSchema = z.object({
  action: z.string().min(1, "action required"),
  ref_type: z.string().optional(),
  ref_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { withCookies, user, workspaceId } = guard;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`token-consume:${user.id}:${ip}`, {
    windowMs: 60_000,
    max: 30,
  });

  if (!limit.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limit.resetAt }, { status: 429 })
    );
  }

  const rawBody = guard.body || (await req.json().catch(() => null));
  const parsed = consumeSchema.safeParse(rawBody);
  const allowedActions = Object.keys(tokenRates) as TokenActionKey[];

  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        {
          error: "invalid_request",
          reason: "validation_error",
          details: parsed.error.flatten().fieldErrors,
          allowedActions,
        },
        { status: 400 }
      )
    );
  }

  const { action, ref_type: refType, ref_id: refId, metadata } = parsed.data;

  if (!(action in tokenRates)) {
    return withCookies(
      NextResponse.json(
        {
          error: "invalid_request",
          reason: "unknown_action",
          allowedActions,
        },
        { status: 400 }
      )
    );
  }

  const featureKey = tokenActionFeatureMap[action as keyof typeof tokenActionFeatureMap];

  const entitlement = await assertEntitlement(workspaceId, featureKey);
  if (!entitlement.allowed) {
    return withCookies(
      NextResponse.json(
        { error: "feature_locked", reason: "workspace_access_denied" },
        { status: 403 }
      )
    );
  }

  const cost = tokenRates[action as keyof typeof tokenRates].tokens;
  const budget = await assertTokenBudget(workspaceId, cost);
  if (!budget.allowed) {
    return withCookies(
      NextResponse.json(
        {
          error: budget.reason === "cap_exceeded" ? "usage_limit_reached" : "insufficient_tokens",
          cap: budget.cap,
          used: budget.used,
          attempted: cost,
          balance: budget.balance,
        },
        { status: 402 }
      )
    );
  }

  try {
    const balance = await consumeTokens(workspaceId, cost, {
      feature_key: featureKey,
      ref_type: refType,
      ref_id: refId,
      created_by: user.id,
    });

    await recordUsage({
      workspaceId,
      eventType: "tokens",
      amount: cost,
      metadata: {
        ...metadata,
        route: "/api/tokens/consume",
        action,
        feature: featureKey,
        ref_type: refType,
        ref_id: refId,
        user_id: user.id,
      },
    });

    return withCookies(NextResponse.json({ balance }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "token_error";
    const status = message.includes("insufficient_tokens") ? 402 : 400;
    return withCookies(NextResponse.json({ error: message }, { status }));
  }
});
