import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation/contact";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = contactSchema.safeParse(body);

    // Kalau error validasi
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "Data tidak valid",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Honeypot: kalau field website terisi, anggap spam
    if (data.website && data.website.trim().length > 0) {
      return NextResponse.json(
        { ok: false, message: "Spam terdeteksi" },
        { status: 400 }
      );
    }

    // TODO: di sini nanti bisa kirim email / WA / simpan ke DB
    console.log("CONTACT FORM SUBMISSION:", {
      name: data.name,
      email: data.email,
      topic: data.topic,
      message: data.message,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Terima kasih, pesan Anda sudah kami terima.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CONTACT FORM ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          "Terjadi kesalahan di server. Silakan coba lagi beberapa saat lagi.",
      },
      { status: 500 }
    );
  }
}