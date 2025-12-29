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

function onlyDigits(s: string) {
  return (s || "").replace(/\D+/g, "");
}

/**
 * Normalisasi nomor:
 * - terima +62/62/08xxx/spasi/strip
 * - simpan jadi digits saja, contoh: 62812xxxx
 */
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

// Postgres unique violation code
function isUniqueViolation(err: any) {
  const code = err?.code || err?.cause?.code;
  return code === "23505";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, message: "Payload tidak valid." },
        { status: 400 }
      );
    }

    // Honeypot anti-bot
    const honeypot = String(body?.website || "").trim();
    if (honeypot.length > 0) {
      return NextResponse.json({ ok: true, deduped: true }, { status: 200 });
    }

    const name = clamp(String(body?.name || ""), 80);
    const phone = normalizePhone(String(body?.phone || ""));
    const business = clamp(String(body?.business || ""), 120);
    const need = clamp(String(body?.need || ""), 80);
    const notes = clamp(String(body?.notes || ""), 800);

    if (!name) {
      return NextResponse.json(
        { ok: false, message: "Nama wajib diisi." },
        { status: 400 }
      );
    }
    if (!isValidPhoneDigits(phone)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Nomor WA tidak valid. Gunakan format 62xxxx atau 08xxxx.",
        },
        { status: 400 }
      );
    }
    if (!need) {
      return NextResponse.json(
        { ok: false, message: "Kebutuhan wajib dipilih." },
        { status: 400 }
      );
    }

    const lead: Lead = {
      name,
      phone,
      business: business || undefined,
      need,
      notes: notes || undefined,
      source: "wa-platform",
      user_agent: clamp(req.headers.get("user-agent") || "", 200) || null,
      ip: getIP(req),
    };

    const supabase = supabaseAdmin();

    /**
     * Rate limit ringan per IP (anti spam)
     * - Max 6 request / 60 detik per IP
     */
    const ipKey = lead.ip || "unknown";
    if (ipKey !== "unknown") {
      const rlSince = isoSecondsAgo(60);
      const { data: recentByIp, error: rlErr } = await supabase
        .from("leads")
        .select("id")
        .eq("ip", ipKey)
        .gte("created_at", rlSince)
        .limit(7);

      if (rlErr) {
        console.error("[LEADS] RateLimit check error:", rlErr);
      } else if ((recentByIp?.length || 0) >= 6) {
        return NextResponse.json(
          { ok: false, message: "Terlalu cepat. Coba lagi sebentar lagi." },
          { status: 429 }
        );
      }
    }

    /**
     * Insert lead
     * - DB sudah UNIQUE (phone, need, source)
     * - kalau duplicate → balas sukses deduped:true (bukan error)
     */
    const { error: insErr } = await supabase.from("leads").insert(lead);

    if (insErr) {
      if (isUniqueViolation(insErr)) {
        return NextResponse.json({ ok: true, deduped: true }, { status: 200 });
      }
      console.error("[LEADS] Insert error:", insErr);
      return NextResponse.json(
        { ok: false, message: "Gagal menyimpan lead." },
        { status: 500 }
      );
    }

    /**
     * Notif WA admin (best effort) - cuma kalau lead baru (insert sukses)
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
    } else if (adminPhoneRaw) {
      console.warn("[LEADS] WA_ADMIN_PHONE invalid format.");
    }

    return NextResponse.json({ ok: true, deduped: false }, { status: 200 });
  } catch (e: any) {
    console.error("[LEADS] Unexpected error:", e);
    return NextResponse.json(
      { ok: false, message: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
