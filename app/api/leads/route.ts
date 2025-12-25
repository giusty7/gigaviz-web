import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Lead = {
  name: string;
  phone: string;
  business?: string;
  need: string;
  notes?: string;
  createdAt: string;
  source: string;
};

function isValidPhone(phone: string) {
  return /^\d{9,15}$/.test(phone);
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
      createdAt: new Date().toISOString(),
      source: "wa-platform",
    };

    // Simpan ke file lokal (dev-friendly).
    // NOTE: Untuk production, kita akan pindah ke DB (Supabase) supaya permanent.
    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "leads.json");

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    let existing: Lead[] = [];
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      existing = raw ? (JSON.parse(raw) as Lead[]) : [];
    }

    existing.unshift(lead);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), "utf8");

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
