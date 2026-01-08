import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getResendFromContact } from "@/lib/email";
import { contactSchema } from "@/lib/validation/contact";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map<string, number[]>();

// email tujuan utama (inbox kamu)
const TO_EMAIL =
  process.env.CONTACT_RECIPIENT_EMAIL ?? "your-email@example.com";

// alamat pengirim (gunakan RESEND_FROM_CONTACT)

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const history = rateLimitStore.get(ip) ?? [];
  const recent = history.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateLimitStore.set(ip, recent);
  return false;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Terlalu banyak percobaan. Silakan tunggu beberapa menit sebelum mengirim lagi.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validasi server-side
    const parsedResult = contactSchema.safeParse(body);
    if (!parsedResult.success) {
      const firstError = parsedResult.error.issues[0]?.message ?? "Data tidak valid.";
      return NextResponse.json(
        { ok: false, message: firstError },
        { status: 400 }
      );
    }
    const parsed = parsedResult.data;

    // Honeypot: kalau field "website" terisi, anggap bot, tapi balas sukses
    if (parsed.website && parsed.website.trim().length > 0) {
      console.warn("[CONTACT] Spam detected (honeypot).", parsed);
      return NextResponse.json(
        { ok: true, message: "Terima kasih, pesan Anda sudah kami terima." },
        { status: 200 }
      );
    }

    // Kalau API key belum di-set → jangan pernah new Resend() saat build
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(
        "[CONTACT] RESEND_API_KEY belum di-set. Pesan hanya dicatat di log.",
        parsed
      );
      return NextResponse.json(
        {
          ok: true,
          message:
            "Pesan masuk (mode development). Setelah email dikonfigurasi, pesan akan dikirim ke inbox.",
        },
        { status: 200 }
      );
    }

    const resend = new Resend(apiKey);

    const companyValue = parsed.company && parsed.company.trim().length > 0 ? parsed.company : "-";
    const budgetValue =
      parsed.budgetRange && parsed.budgetRange.trim().length > 0
        ? parsed.budgetRange
        : "-";

    const text = `Ada pesan baru dari form kontak Gigaviz.com:

Nama   : ${parsed.name}
Email  : ${parsed.email}
Perusahaan: ${companyValue}
Topik  : ${parsed.topic}
Budget : ${budgetValue}

Pesan:
${parsed.message}
`;

    const { error } = await resend.emails.send({
      from: getResendFromContact(),
      to: [TO_EMAIL],
      replyTo: parsed.email,
      subject: `[Gigaviz.com] Kontak baru: ${parsed.topic}`,
      text,
    });

    if (error) {
      console.error("[CONTACT] Error kirim email:", error);
      return NextResponse.json(
        { ok: false, message: "Gagal mengirim email. Coba beberapa saat lagi." },
        { status: 500 }
      );
    }

    console.log("[CONTACT] Form terkirim:", parsed);

    return NextResponse.json(
      { ok: true, message: "Terima kasih, pesan Anda sudah kami terima." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[CONTACT] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, message: "Terjadi kesalahan. Coba lagi nanti." },
      { status: 500 }
    );
  }
}
