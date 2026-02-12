import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { creditTokens } from "@/lib/tokens";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const DEV_WORKSPACE_ID = "4b8c7c19-5eff-4b36-b7fb-1de426170641";
const FALLBACK_EMAIL = "vg.gigaviz@gmail.com";

function parseAllowlist(): string[] {
  const rawList = process.env.DEV_ADMIN_EMAILS || "";
  const list = rawList
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const single = process.env.DEV_ADMIN_EMAIL;
  if (single) list.push(single.trim().toLowerCase());
  if (!list.includes(FALLBACK_EMAIL)) list.push(FALLBACK_EMAIL);

  return Array.from(new Set(list));
}

function parseAmount(value: unknown) {
  const num = Number(value);
  if (!Number.isInteger(num)) return null;
  if (num < 1 || num > 1_000_000) return null;
  return num;
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const isProd =
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (isProd || process.env.ENABLE_BILLING_TEST_MODE !== "true") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const allowlist = parseAllowlist();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userErr || !user) {
    return withCookies(NextResponse.json({ error: "unauthorized" }, { status: 401 }));
  }

  const email = (user.email || "").toLowerCase();
  if (!allowlist.includes(email)) {
    return withCookies(NextResponse.json({ error: "forbidden" }, { status: 403 }));
  }

  const limit = rateLimit(`dev-credit:${DEV_WORKSPACE_ID}:${user.id}:${ip}`, {
    windowMs: 60_000,
    max: 5,
  });
  if (!limit.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limit.resetAt }, { status: 429 })
    );
  }

  const body = await req.json().catch(() => null);
  const amount = parseAmount(body?.amount);
  if (amount === null) {
    return withCookies(NextResponse.json({ error: "invalid_amount" }, { status: 400 }));
  }

  const adminDb = supabaseAdmin();
  const { data: membership } = await adminDb
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", DEV_WORKSPACE_ID)
    .eq("user_id", user.id)
    .maybeSingle();

  const role = membership?.role;
  if (!(role === "owner" || role === "admin")) {
    return withCookies(NextResponse.json({ error: "forbidden" }, { status: 403 }));
  }

  try {
    const balance = await creditTokens(DEV_WORKSPACE_ID, amount, "admin_credit", undefined, user.id);

    // Optional: insert audit log via existing system. Placeholder only.
    // await adminDb.from("audit_log").insert({...})

    return withCookies(
      NextResponse.json({ workspaceId: DEV_WORKSPACE_ID, newBalance: balance, delta: amount })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "token_error";
    return withCookies(NextResponse.json({ error: message }, { status: 500 }));
  }
});

function notFound() {
  return new NextResponse("Not Found", { status: 404 });
}

export const GET = withErrorHandler(async () => {
  const isProd =
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (isProd || process.env.ENABLE_BILLING_TEST_MODE !== "true") {
    return notFound();
  }
  return notFound();
});

export const PUT = withErrorHandler(async () => {
  const isProd =
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (isProd || process.env.ENABLE_BILLING_TEST_MODE !== "true") {
    return notFound();
  }
  return notFound();
});

export const DELETE = withErrorHandler(async () => {
  const isProd =
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (isProd || process.env.ENABLE_BILLING_TEST_MODE !== "true") {
    return notFound();
  }
  return notFound();
});

export const HEAD = withErrorHandler(async () => {
  const isProd =
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (isProd || process.env.ENABLE_BILLING_TEST_MODE !== "true") {
    return notFound();
  }
  return notFound();
});
