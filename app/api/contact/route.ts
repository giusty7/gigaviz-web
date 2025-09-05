import { NextRequest, NextResponse } from "next/server";
import { contactSchema, sanitize } from "@/lib/validate";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const json = await req.json();
  const result = contactSchema.safeParse(json);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { website, name, email, message } = result.data;
  if (website) {
    return NextResponse.json({ ok: true });
  }

  const data = {
    name: sanitize(name),
    email: sanitize(email),
    message: sanitize(message),
  };
  JSON.stringify(data);
  // TODO: send email to process.env.CONTACT_TARGET_EMAIL using data

  return NextResponse.json({ ok: true });
}
