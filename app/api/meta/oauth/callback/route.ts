import { NextRequest, NextResponse } from "next/server";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { storeMetaEventLog } from "@/lib/meta/events";

export const runtime = "nodejs";

const STATE_COOKIE = "meta_oauth_state";

type StatePayload = {
  state?: string;
  nonce?: string;
  next?: string;
  workspaceId?: string;
  workspaceSlug?: string;
};

function base64UrlToBuffer(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

function base64UrlDecode(value: string) {
  return base64UrlToBuffer(value).toString("utf8");
}

function parseSignedToken(token: string, secret: string) {
  const parts = token.split(".", 2);
  if (parts.length !== 2) {
    return { ok: false as const, error: "state_malformed" };
  }
  const [payloadB64, sigB64] = parts;
  const expected = createHmac("sha256", secret).update(payloadB64).digest();
  const provided = base64UrlToBuffer(sigB64);
  if (provided.length !== expected.length) {
    return { ok: false as const, error: "state_invalid_signature" };
  }
  if (!timingSafeEqual(provided, expected)) {
    return { ok: false as const, error: "state_invalid_signature" };
  }
  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as StatePayload;
    return { ok: true as const, payload };
  } catch {
    return { ok: false as const, error: "state_invalid_payload" };
  }
}

function getSafeNext(input?: string | null) {
  if (!input) return "/dashboard";
  return input.startsWith("/") ? input : "/dashboard";
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limiter = rateLimit(`meta-oauth-callback:${ip}`, { windowMs: 60_000, max: 20 });
  if (!limiter.ok) {
    return NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 });
  }

  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  if (!code) {
    return NextResponse.json({ error: "missing_code" }, { status: 400 });
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return NextResponse.json({ error: "meta_config_missing" }, { status: 500 });
  }

  if (!state) {
    return NextResponse.json({ error: "missing_state" }, { status: 400 });
  }

  const cookieToken = req.cookies.get(STATE_COOKIE)?.value ?? null;
  let payload: StatePayload | null = null;

  if (cookieToken) {
    const cookieCheck = parseSignedToken(cookieToken, appSecret);
    if (!cookieCheck.ok || !cookieCheck.payload) {
      return NextResponse.json(
        { error: "state_invalid", reason: cookieCheck.error },
        { status: 400 }
      );
    }
    if (!cookieCheck.payload.state) {
      return NextResponse.json({ error: "state_missing" }, { status: 400 });
    }
    if (cookieCheck.payload.state !== state) {
      return NextResponse.json({ error: "state_mismatch" }, { status: 400 });
    }
    payload = cookieCheck.payload;
  } else {
    const stateCheck = parseSignedToken(state, appSecret);
    if (!stateCheck.ok || !stateCheck.payload) {
      return NextResponse.json(
        { error: "state_invalid", reason: stateCheck.error },
        { status: 400 }
      );
    }
    payload = stateCheck.payload;
    if (payload?.state && payload.state !== state) {
      return NextResponse.json({ error: "state_mismatch" }, { status: 400 });
    }
  }

  const redirectUri = `${requestUrl.origin}/api/meta/oauth/callback`;
  const tokenUrl = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("code", code);

  const tokenRes = await fetch(tokenUrl.toString(), { method: "GET" });
  const tokenJson = (await tokenRes.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
    error?: { message?: string };
  };

  if (!tokenRes.ok || !tokenJson.access_token) {
    return NextResponse.json(
      {
        error: "token_exchange_failed",
        message: tokenJson?.error?.message ?? "Meta token exchange failed",
      },
      { status: 400 }
    );
  }

  let stored = false;
  const workspaceId = payload?.workspaceId;
  const workspaceSlug = payload?.workspaceSlug;

  const utm: Record<string, string> = {};
  const utmKeys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "ref",
    "referrer",
    "campaign_id",
    "ad_id",
    "adset_id",
    "clickid",
    "gclid",
    "fbclid",
  ];
  utmKeys.forEach((key) => {
    const fromQuery = requestUrl.searchParams.get(key);
    const fromNext = payload?.next ? new URL(payload.next, requestUrl.origin).searchParams.get(key) : null;
    const value = fromQuery || fromNext;
    if (value) utm[key] = value;
  });
  const stateHash = state ? createHash("sha256").update(state).digest("hex") : null;

  try {
    const db = supabaseAdmin();
    let resolvedWorkspaceId = workspaceId ?? null;
    if (!resolvedWorkspaceId && workspaceSlug) {
      const { data: ws } = await db
        .from("workspaces")
        .select("id")
        .eq("slug", workspaceSlug)
        .maybeSingle();
      resolvedWorkspaceId = ws?.id ?? null;
    }

    if (resolvedWorkspaceId) {
      const expiresAt = tokenJson.expires_in
        ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
        : null;

      const { data: existing } = await db
        .from("meta_tokens")
        .select("id")
        .eq("workspace_id", resolvedWorkspaceId)
        .eq("provider", "meta_oauth")
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (existing?.id) {
        await db
          .from("meta_tokens")
          .update({
            token_encrypted: tokenJson.access_token,
            expires_at: expiresAt,
            scopes_json: tokenJson.scope ? { scope: tokenJson.scope } : {},
          })
          .eq("id", existing.id);
      } else {
        await db.from("meta_tokens").insert({
          workspace_id: resolvedWorkspaceId,
          provider: "meta_oauth",
          token_encrypted: tokenJson.access_token,
          expires_at: expiresAt,
          scopes_json: tokenJson.scope ? { scope: tokenJson.scope } : {},
        });
      }
      stored = true;

      const hasUtm = Object.keys(utm).length > 0;
      if (hasUtm || stateHash || payload?.next) {
        await storeMetaEventLog({
          workspaceId: resolvedWorkspaceId,
          eventType: "meta_oauth_callback",
          source: "api",
          referralHash: null,
          payload: {
            utm,
            state_hash: stateHash,
            next: payload?.next ?? null,
            workspaceSlug,
            workspaceId: resolvedWorkspaceId,
          },
          utm: hasUtm ? utm : null,
        });
      }
    }
  } catch (err) {
    logger.warn("[meta-oauth] token store failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }

  const nextSafe = getSafeNext(payload?.next);
  const redirectUrl = new URL(nextSafe, requestUrl.origin);
  redirectUrl.searchParams.set("meta", "connected");
  redirectUrl.searchParams.set("stored", stored ? "1" : "0");

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(STATE_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
