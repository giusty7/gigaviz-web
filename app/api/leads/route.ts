import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/wa/cloud";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Lead = {
  name: string;
  phone: string; // digits only (contoh: 62812xxxx)
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
      // best effort, jangan ganggu response user
      console.error("[LEADS] attempt log failed:", e);
    }
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      await logAttempt({ status: "invalid", reason: "invalid_payload", ip: getIP(req), user_agent: req.headers.get("user-agent") });
      return NextResponse.json({ ok: false, message: "Payload tidak valid." }, { status: 400 });
    }

    // Honeypot anti-bot
    const honeypot = String(body?.website || "").trim();
    if (honeypot.length > 0) {
      await logAttempt({ status: "honeypot", reason: "honeypot_filled", ip: getIP(req), user_agent: req.headers.get("user-agent") });
      return NextResponse.json({ ok: true, deduped: true }, { status: 200 });
    }

    const name = clamp(String(body?.name || ""), 80);
    const phone = normalizePhone(String(body?.phone || ""));
    const business = clamp(String(body?.business || ""), 120);
    const need = clamp(String(body?.need || ""), 60);
    const notes = clamp(String(body?.notes || ""), 800);

    const ip = getIP(req);
    const ua = clamp(req.headers.get("user-agent") || "", 200) || null;

    if (!name) {
      await logAttempt({ status: "invalid", reason: "missing_name", name, phone, business, need, notes, ip, user_agent: ua });
      return NextResponse.json({ ok: false, message: "Nama wajib diisi." }, { status: 400 });
    }
    if (!isValidPhoneDigits(phone)) {
      await logAttempt({ status: "invalid", reason: "invalid_phone", name, phone, business, need, notes, ip, user_agent: ua });
      return NextResponse.json(
        { ok: false, message: "Nomor WA tidak valid. Gunakan format 62xxxx atau 08xxxx." },
        { status: 400 }
      );
    }
    if (!need) {
      await logAttempt({ status: "invalid", reason: "missing_need", name, phone, business, need, notes, ip, user_agent: ua });
      return NextResponse.json({ ok: false, message: "Kebutuhan wajib dipilih." }, { status: 400 });
    }

    const lead: Lead = {
      name,
      phone,
      business: business || undefined,
      need,
      notes: notes || undefined,
      source: "wa-platform",
      user_agent: ua,
      ip,
    };

    /**
     * Rate limit ringan per IP:
     * max 6 request / 60 detik
     */
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
        return NextResponse.json({ ok: false, message: "Terlalu cepat. Coba lagi sebentar lagi." }, { status: 429 });
      }
    }

    /**
     * Dedupe 10 menit (soft) + ada UNIQUE index di DB (hard)
     * - Kalau mau dedupe bener-bener cuma 10 menit, UNIQUE index perlu di-drop.
     */
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

    /**
     * Insert lead
     */
    const { data: insData, error: insErr } = await supabase.from("leads").insert(lead).select("id").maybeSingle();

    if (insErr) {
      // kalau kena unique constraint (23505), anggap deduped
      const code = (insErr as any)?.code;
      if (code === "23505") {
        await logAttempt({ status: "deduped", reason: "unique_constraint", ...lead });
        return NextResponse.json({ ok: true, deduped: true }, { status: 200 });
      }

      await logAttempt({ status: "error", reason: insErr.message, ...lead });
      return NextResponse.json({ ok: false, message: "Gagal menyimpan lead." }, { status: 500 });
    }

    const leadId = insData?.id || null;
    await logAttempt({ status: "inserted", reason: "ok", ...lead, lead_id: leadId });

    /**
     * Notif WA admin (best effort)
     */
    const adminPhoneRaw = process.env.WA_ADMIN_PHONE || "";
    const adminPhone = normalizePhone(adminPhoneRaw);

    if (adminPhone && isValidPhoneDigits(adminPhone)) {
      const lines = [
        "📩 Lead Baru - WA Platform",
        `Nama: ${lead.name}`,
        `WA: ${lead.phone}`,
        `Bisnis: ${lead.business ?? "-"}`,
        `Kebutuhan: ${lead.need}`,
        `Catatan: ${lead.notes ?? "-"}`,
      ];

      try {
        await sendWhatsAppText({ to: adminPhone, body: lines.join("\n") });
      } catch (waErr) {
        console.error("[LEADS] WA notify failed:", waErr);
      }
    }

    return NextResponse.json({ ok: true, deduped: false }, { status: 200 });
  } catch (e: any) {
    console.error("[LEADS] Unexpected error:", e);
    return NextResponse.json({ ok: false, message: e?.message || "Server error" }, { status: 500 });
  }
}
