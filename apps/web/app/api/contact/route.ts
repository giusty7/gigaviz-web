import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validate";
import { sendContactEmail } from "@/lib/email";
import { env } from "@gv/config";
// import { saveContact } from "@gv/db";

// ===== Rate limit ringan (dev/preview) =====
const hits = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 10 * 60 * 1000; // 10 menit
const LIMIT = 5;

// ===== Tipe hasil email + normalizer (hindari any) =====
type EmailResult =
  | { ok: boolean; via?: "log" | "resend" }
  | { sent: boolean; via?: "log" | "resend" };

function normalizeEmailResult(r: EmailResult): { ok: boolean; via?: "log" | "resend" } {
  return "ok" in r ? { ok: r.ok, via: r.via } : { ok: !!r.sent, via: r.via };
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = contactSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
    }

    const { name, email, message, website, ts } = parsed.data;

    // Honeypot
    if (website && website.trim() !== "") {
      return NextResponse.json({ ok: false, error: "Blocked (honeypot)" }, { status: 400 });
    }

    // Minimal delay (anti-bot)
    if (ts && Date.now() - ts < 1500) {
      return NextResponse.json({ ok: false, error: "Too fast" }, { status: 400 });
    }

    // IP & UA
    const ipHeader = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
    const ip = ipHeader.split(",")[0].trim() || undefined;

    // Rate limit per IP
    const key = ip ?? "unknown";
    const now = Date.now();
    const cur = hits.get(key);
    if (!cur || now - cur.ts > WINDOW_MS) {
      hits.set(key, { count: 1, ts: now });
    } else {
      if (cur.count >= LIMIT) {
        return NextResponse.json({ ok: false, error: "Rate limited" }, { status: 429 });
      }
      cur.count++;
      cur.ts = now;
      hits.set(key, cur);
    }

    // Kirim email (mendukung {ok} atau {sent})
    const raw = (await sendContactEmail({ name, email, message })) as EmailResult;
    const { ok, via } = normalizeEmailResult(raw);

    // Simpan ke DB (opsional) — hanya jika DATABASE_URL ada & ok
    try {
      if (env.DATABASE_URL && ok) {
        const ua = req.headers.get("user-agent") || undefined;
        await saveContact({ name, email, message, ip, ua, via });
      }
    } catch (e) {
      console.error("[db] saveContact failed:", e);
    }

    return NextResponse.json({ ok, via: via ?? (env.DRY_RUN_HTTP === "1" ? "log" : "resend") });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
function saveContact(arg0: { name: string; email: string; message: string; ip: string | undefined; ua: string | undefined; via: "log" | "resend" | undefined; }) {
  throw new Error("Function not implemented.");
}

