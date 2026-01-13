import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/wa/cloud";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const leadSchema = z.object({
  name: z.string().min(1).max(80),
  phone: z.string().min(3).max(30),
  business: z.string().max(120).optional(),
  need: z.string().min(1).max(60),
  notes: z.string().max(800).optional(),
  source: z.enum(["wa-platform", "get-started"]).optional(),
  website: z.string().optional(),
});

type Lead = {
  name: string;
  phone: string;
  business?: string;
  need: string;
  notes?: string;
  source: string;
  user_agent?: string | null;
  ip?: string | null;
};

type Attempt = {
  status: string;
  reason?: string;
  name?: string;
  phone?: string;
  business?: string;
  need?: string;
  notes?: string;
  source?: string;
  user_agent?: string | null;
  ip?: string | null;
  lead_id?: string | null;
};

const memoryRateLimit = new Map<
  string,
  { count: number; resetAt: number }
>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;

function onlyDigits(s: string) {
  return (s || "").replace(/\D+/g, "");
}

function normalizePhone(raw: string) {
  let p = onlyDigits(raw);
  if (p.startsWith("0")) p = "62" + p.slice(1);
  return p;
}

function isValidPhoneDigits(phoneDigits: string) {
  return /^\d{9,15}$/.test(phoneDigits);
}

function clamp(s: string, max: number) {
  const t = (s || "").trim();
  return t.length > max ? t.slice(0, max) : t;
}

function getIP(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

function isoSecondsAgo(sec: number) {
  return new Date(Date.now() - sec * 1000).toISOString();
}

function isoMinutesAgo(min: number) {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

function getErrorCode(err: unknown) {
  if (!err || typeof err !== "object") return null;
  const record = err as { code?: unknown };
  return typeof record.code === "string" ? record.code : null;
}

function isMemoryRateLimited(ip: string | null) {
  if (!ip) return false;
  const now = Date.now();
  const entry = memoryRateLimit.get(ip);

  if (!entry || entry.resetAt < now) {
    memoryRateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  memoryRateLimit.set(ip, entry);
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(req: Request) {
  const supabase = supabaseAdmin();

  async function logAttempt(a: Attempt) {
    try {
      await supabase.from("lead_attempts").insert({
        status: a.status,
        reason: a.reason,
        name: a.name,
        phone: a.phone,
        business: a.business,
        need: a.need,
        notes: a.notes,
        source: a.source || "wa-platform",
        user_agent: a.user_agent ?? null,
        ip: a.ip ?? null,
        lead_id: a.lead_id ?? null,
      });
    } catch (e) {
      console.error("[LEADS] attempt log failed:", e);
    }
  }

  try {
    const body = (await req.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    if (!body) {
      await logAttempt({
        status: "invalid",
        reason: "invalid_payload",
        ip: getIP(req),
        user_agent: req.headers.get("user-agent"),
      });
      return NextResponse.json({ ok: false, message: "Invalid payload." }, { status: 400 });
    }

    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      await logAttempt({
        status: "invalid",
        reason: "invalid_schema",
        ip: getIP(req),
        user_agent: req.headers.get("user-agent"),
      });
      return NextResponse.json({ ok: false, message: "Invalid data." }, { status: 400 });
    }

    const payload = parsed.data;

    const honeypot = String(payload.website || "").trim();
    if (honeypot.length > 0) {
      await logAttempt({
        status: "honeypot",
        reason: "honeypot_filled",
        ip: getIP(req),
        user_agent: req.headers.get("user-agent"),
      });
      return NextResponse.json({ ok: true, deduped: true }, { status: 200 });
    }

    const name = clamp(payload.name, 80);
    const phone = normalizePhone(payload.phone);
    const business = clamp(payload.business || "", 120);
    const need = clamp(payload.need, 60);
    const notes = clamp(payload.notes || "", 800);
    const source = payload.source === "get-started" ? "get-started" : "wa-platform";

    const ip = getIP(req);
    const ua = clamp(req.headers.get("user-agent") || "", 200) || null;

    if (!name) {
      await logAttempt({
        status: "invalid",
        reason: "missing_name",
        name,
        phone,
        business,
        need,
        notes,
        ip,
        user_agent: ua,
        source,
      });
      return NextResponse.json({ ok: false, message: "Name is required." }, { status: 400 });
    }
    if (!isValidPhoneDigits(phone)) {
      await logAttempt({
        status: "invalid",
        reason: "invalid_phone",
        name,
        phone,
        business,
        need,
        notes,
        ip,
        user_agent: ua,
        source,
      });
      return NextResponse.json(
        { ok: false, message: "Invalid WhatsApp number. Use 62xxxx or 08xxxx." },
        { status: 400 }
      );
    }
    if (!need) {
      await logAttempt({
        status: "invalid",
        reason: "missing_need",
        name,
        phone,
        business,
        need,
        notes,
        ip,
        user_agent: ua,
        source,
      });
      return NextResponse.json({ ok: false, message: "Need is required." }, { status: 400 });
    }

    const lead: Lead = {
      name,
      phone,
      business: business || undefined,
      need,
      notes: notes || undefined,
      source,
      user_agent: ua,
      ip,
    };

    if (isMemoryRateLimited(ip)) {
      await logAttempt({ status: "rate_limited", reason: "memory_limit", ...lead });
      return NextResponse.json({ ok: false, message: "Too many attempts. Try again." }, { status: 429 });
    }

    const ipKey = lead.ip || "unknown";
    if (ipKey !== "unknown") {
      const rlSince = isoSecondsAgo(60);
      const { data: recentByIp, error: rlErr } = await supabase
        .from("lead_attempts")
        .select("id")
        .eq("ip", ipKey)
        .gte("created_at", rlSince)
        .limit(7);

      if (!rlErr && (recentByIp?.length || 0) >= 6) {
        await logAttempt({ status: "rate_limited", reason: "ip_60s_limit", ...lead });
        return NextResponse.json(
          { ok: false, message: "Too many attempts. Please try again shortly." },
          { status: 429 }
        );
      }
    }

    const dedupeSince = isoMinutesAgo(10);
    const { data: existing, error: existErr } = await supabase
      .from("leads")
      .select("id,created_at")
      .eq("phone", lead.phone)
      .eq("need", lead.need)
      .eq("source", lead.source)
      .gte("created_at", dedupeSince)
      .limit(1);

    if (!existErr && (existing?.length || 0) > 0) {
      await logAttempt({ status: "deduped", reason: "soft_10min", ...lead });
      return NextResponse.json({ ok: true, deduped: true }, { status: 200 });
    }

    const { data: insData, error: insErr } = await supabase
      .from("leads")
      .insert(lead)
      .select("id")
      .maybeSingle();

    if (insErr) {
      const code = getErrorCode(insErr);
      if (code === "23505") {
        await logAttempt({ status: "deduped", reason: "unique_constraint", ...lead });
        return NextResponse.json({ ok: true, deduped: true }, { status: 200 });
      }

      await logAttempt({ status: "error", reason: insErr.message, ...lead });
      return NextResponse.json({ ok: false, message: "Failed to save lead." }, { status: 500 });
    }

    const leadId = insData?.id || null;
    await logAttempt({ status: "inserted", reason: "ok", ...lead, lead_id: leadId });

    const adminPhoneRaw = process.env.WA_ADMIN_PHONE || "";
    const adminPhone = normalizePhone(adminPhoneRaw);

    if (adminPhone && isValidPhoneDigits(adminPhone)) {
      const label =
        lead.source === "get-started" ? "New Lead - Get Started" : "New Lead - WA Platform";
      const lines = [
        label,
        `Name: ${lead.name}`,
        `WA: ${lead.phone}`,
        `Business: ${lead.business ?? "-"}`,
        `Need: ${lead.need}`,
        `Notes: ${lead.notes ?? "-"}`,
      ];

      try {
        await sendWhatsAppText({ to: adminPhone, body: lines.join("\n") });
      } catch (waErr) {
        console.error("[LEADS] WA notify failed:", waErr);
      }
    }

    return NextResponse.json({ ok: true, deduped: false }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[LEADS] Unexpected error:", err);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
