// app/api/webhooks/whatsapp/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // pastikan ini ada di Vercel env, JANGAN di client
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  // 1) log ke vercel
  console.log("WA_WEBHOOK_IN", JSON.stringify(body));

  // 2) simpan payload mentah dulu (biar jelas dapet event apa)
  await supabase.from("message_events").insert({
    event_type: "wa_webhook",
    payload: body,
  });

  return NextResponse.json({ ok: true });
}
