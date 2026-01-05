import { NextResponse } from "next/server";
import { Resend } from "resend";
import { contactSchema } from "@/lib/validation/contact";

export const runtime = "nodejs";

// email tujuan utama (inbox kamu)
const TO_EMAIL =
  process.env.CONTACT_RECIPIENT_EMAIL ?? "your-email@example.com";

// alamat pengirim (boleh pakai onboarding@resend.dev dulu)
const FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL ??
  "Gigaviz Contact <onboarding@resend.dev>";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validasi server-side
    const parsed = contactSchema.parse(body);

    // Honeypot: kalau field "website" terisi, anggap bot, tapi balas sukses
    if (parsed.website && parsed.website.trim().length > 0) {
      console.warn("[CONTACT] Spam detected (honeypot).", parsed);
      return NextResponse.json(
        { message: "Terima kasih, pesan Anda sudah kami terima." },
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
          message:
            "Pesan masuk (mode development). Setelah email dikonfigurasi, pesan akan dikirim ke inbox.",
        },
        { status: 200 }
      );
    }

    const resend = new Resend(apiKey);

    const text = `Ada pesan baru dari form kontak Gigaviz.com:

Nama   : ${parsed.name}
Email  : ${parsed.email}
Topik  : ${parsed.topic}

Pesan:
${parsed.message}
`;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      replyTo: parsed.email,
      subject: `[Gigaviz.com] Kontak baru: ${parsed.topic}`,
      text,
    });

    if (error) {
      console.error("[CONTACT] Error kirim email:", error);
      return NextResponse.json(
        { message: "Gagal mengirim email. Coba beberapa saat lagi." },
        { status: 500 }
      );
    }

    console.log("[CONTACT] Form terkirim:", parsed);

    return NextResponse.json(
      { message: "Terima kasih, pesan Anda sudah kami terima." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[CONTACT] Unexpected error:", err);
    return NextResponse.json(
      { message: "Terjadi kesalahan. Coba lagi nanti." },
      { status: 500 }
    );
  }
}
