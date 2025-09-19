import { NextResponse } from "next/server";
import { env } from "@gv/config";
import { httpFetch } from "@gv/http";

export async function GET() {
  const r = await httpFetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{role:"user", content:"hi"}] })
  });
  const json = await r.json();
  return NextResponse.json({ ok: true, via: env.DRY_RUN_HTTP === "1" ? "dry-run" : "live", json });
}