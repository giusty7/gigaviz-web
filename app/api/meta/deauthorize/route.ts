import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { verifySignedRequest } from "@/lib/meta/signed-request";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";

async function readSignedRequest(req: NextRequest) {
  const raw = await req.text();
  if (!raw) return null;
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const parsed = JSON.parse(raw) as { signed_request?: string };
    return parsed.signed_request ?? null;
  }
  const params = new URLSearchParams(raw);
  return params.get("signed_request");
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limiter = rateLimit(`meta-deauthorize:${ip}`, { windowMs: 60_000, max: 30 });
  if (!limiter.ok) {
    return NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 });
  }

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json({ error: "meta_config_missing" }, { status: 500 });
  }

  const signedRequest = await readSignedRequest(req);
  if (!signedRequest) {
    return NextResponse.json({ error: "signed_request_missing" }, { status: 400 });
  }

  const verified = verifySignedRequest(signedRequest, appSecret);
  if (!verified.ok) {
    return NextResponse.json(
      { error: "signed_request_invalid", reason: verified.error },
      { status: 400 }
    );
  }

  logger.info("[meta-deauthorize] received", {
    requestId: randomUUID(),
    at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
