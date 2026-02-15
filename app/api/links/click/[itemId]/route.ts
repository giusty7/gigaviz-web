import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ itemId: string }> };

/**
 * GET /api/links/click/[itemId]
 * Public endpoint — no auth required.
 * Tracks the click and redirects to the link's target URL.
 */
export const GET = withErrorHandler(async (req: NextRequest, ctx?: RouteCtx) => {
  const { itemId } = await ctx!.params;

  // Rate limit: 60 clicks per minute per IP to prevent click inflation
  const forwarded = req.headers.get("x-forwarded-for");
  const clientIp = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`link_click:${clientIp}`, { windowMs: 60_000, max: 60 });
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const db = supabaseAdmin();

  // Fetch item and its page
  const { data: item } = await db
    .from("link_items")
    .select("id, url, link_type, metadata, page_id, workspace_id, visible")
    .eq("id", itemId)
    .single();

  if (!item) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Determine redirect URL
  let targetUrl: string;
  if (item.link_type === "whatsapp" && item.metadata) {
    const meta = item.metadata as { phone?: string; message?: string };
    const phone = (meta.phone ?? "").replace(/[^0-9]/g, "");
    const msg = meta.message ? `?text=${encodeURIComponent(meta.message)}` : "";
    targetUrl = `https://wa.me/${phone}${msg}`;
  } else {
    targetUrl = item.url ?? "/";
  }

  // Parse device type from User-Agent
  const ua = req.headers.get("user-agent") ?? "";
  let deviceType = "desktop";
  if (/mobile|android|iphone|ipad/i.test(ua)) {
    deviceType = /ipad|tablet/i.test(ua) ? "tablet" : "mobile";
  }

  // Get referrer
  const referrer = req.headers.get("referer") ?? null;

  // Hash IP for unique visitor detection (reuse clientIp from rate limit above)
  let ipHash: string | null = null;
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(clientIp + "_gv_links_salt_2026");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    ipHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // Ignore hash errors
  }

  // Session ID from cookie or generate
  const sessionId = req.cookies.get("gv_link_sid")?.value ?? crypto.randomUUID();

  // Insert click record (fire and forget)
  db.from("link_clicks")
    .insert({
      item_id: item.id,
      page_id: item.page_id,
      workspace_id: item.workspace_id,
      referrer,
      user_agent: ua.slice(0, 500),
      device_type: deviceType,
      ip_hash: ipHash,
      session_id: sessionId,
    })
    .then(({ error }) => {
      if (error) logger.error("link click insert failed", { error: error.message, itemId });
    });

  // Redirect with session cookie
  const res = NextResponse.redirect(targetUrl, 302);
  res.cookies.set("gv_link_sid", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return res;
});
