import { env } from "@gv/config";

const allow = new Set(env.HTTP_OUTBOUND_ALLOWLIST.split(",").map(s=>s.trim()).filter(Boolean));

export async function httpFetch(input: RequestInfo, init: RequestInit = {}) {
  const url = typeof input === "string" ? new URL(input) : new URL(input.toString());
  if (!allow.has(url.host)) {
    throw new Error(`Outbound host not allowed: ${url.host}`);
  }
  if (env.DRY_RUN_HTTP === "1") {
    console.log("DRY-RUN HTTP>", url.toString(), init.method ?? "GET");
    return new Response(JSON.stringify({ ok: true, dryRun: true }), { status: 200 });
  }
  return fetch(input, init);
}