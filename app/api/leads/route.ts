import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

function isValidPhone(phone: string) {
  return /^\d{9,15}$/.test(phone);
}

function getIP(req: Request) {
  // Vercel / proxy headers
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body?.name || "").trim();
    const phone = String(body?.phone || "").trim();
    const business = String(body?.business || "").trim();
    const need = String(body?.need || "").trim();
    const notes = String(body?.notes || "").trim();

    if (!name) return NextResponse.json({ ok: false, message: "Nama wajib diisi." }, { status: 400 });
    if (!isValidPhone(phone)) {
      return NextResponse.json({ ok: false, message: "Nomor WA tidak valid." }, { status: 400 });
    }
    if (!need) return NextResponse.json({ ok: false, message: "Kebutuhan wajib dipilih." }, { status: 400 });

    const lead: Lead = {
      name,
      phone,
      business: business || undefined,
      need,
      notes: notes || undefined,
      source: "wa-platform",
      user_agent: req.headers.get("user-agent"),
      ip: getIP(req),
    };

    const supabase = supabaseAdmin();

    const { error } = await supabase.from("leads").insert(lead);
    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
