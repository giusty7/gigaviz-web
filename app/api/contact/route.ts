import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactEmail } from "@/lib/email";

export const runtime = "nodejs"; // supaya in-memory rate limiter bertahan di dev/node runtimes

// Schema server-side (samakan dengan klien)
const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  message: z.string().trim().min(10).max(2000),
  hp: z.string().optional().default(""),
});

// Rate limit in-memory
const WINDOW_MS = 60_000; // 60 detik
const MAX_REQ = 3;        // 3 request per window per IP
const bucket = new Map<string, { count: number; resetAt: number }>();

function allow(ip: string) {
  const now = Date.now();
  const node = bucket.get(ip);
  if (!node || now > node.resetAt) {
    bucket.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (node.count < MAX_REQ) {
    node.count += 1;
    return true;
  }
  return false;
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local").trim();
  if (!allow(ip)) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { hp, name, email, message } = parsed.data;

  // Jika honeypot terisi, abaikan kirim email (anggap sukses tanpa kirim)
  if (hp) {
    return NextResponse.json({ ok: true, sent: false });
  }

  const result = await sendContactEmail({ name, email, message });
  return NextResponse.json(result);
}

