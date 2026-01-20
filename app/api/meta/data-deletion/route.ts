import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { verifySignedRequest } from "@/lib/meta/signed-request";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";

export async function GET() {
  const html = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Permintaan Penghapusan Data</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 720px; margin: 32px auto; padding: 0 20px; color: #0f172a; line-height: 1.6; }
      h1 { font-size: 28px; margin-bottom: 12px; }
      p { margin: 12px 0; }
      ul { margin: 8px 0 12px 20px; }
      li { margin: 6px 0; }
      .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #f8fafc; }
      .muted { color: #475569; }
    </style>
  </head>
  <body>
    <h1>Permintaan Penghapusan Data</h1>
    <div class="card">
      <p>Kami memproses permintaan penghapusan data sesuai kebijakan privasi kami.</p>
      <p>Kirim email ke <strong>support@gigaviz.id</strong> dengan menyertakan:</p>
      <ul>
        <li>Alamat email akun Anda</li>
        <li>ID workspace (jika ada)</li>
        <li>Deskripsi data yang ingin dihapus</li>
      </ul>
      <p class="muted">Kami akan meninjau dan memproses permintaan Anda sesuai ketentuan yang berlaku.</p>
    </div>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function readSignedRequest(req: NextRequest) {
  const raw = await req.text();
  if (!raw) return null;
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const parsed = JSON.parse(raw) as { signed_request?: string };
    return parsed.signed_request ?? null;
  }
  const params = new URLSearchParams(raw);
  return params.get("signed_request");
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limiter = rateLimit(`meta-data-deletion:${ip}`, { windowMs: 60_000, max: 30 });
  if (!limiter.ok) {
    return NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 });
  }

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json({ error: "meta_config_missing" }, { status: 500 });
  }

  const signedRequest = await readSignedRequest(req);
  if (!signedRequest) {
    return NextResponse.json({ error: "signed_request_missing" }, { status: 400 });
  }

  const verified = verifySignedRequest(signedRequest, appSecret);
  if (!verified.ok) {
    return NextResponse.json(
      { error: "signed_request_invalid", reason: verified.error },
      { status: 400 }
    );
  }

  const confirmationCode = randomUUID();
  const baseUrl = req.nextUrl.origin;
  const statusUrl = new URL("/policies/data-deletion", baseUrl);
  statusUrl.searchParams.set("code", confirmationCode);

  logger.info("[meta-data-deletion] received", {
    requestId: confirmationCode,
    at: new Date().toISOString(),
  });

  return NextResponse.json({
    confirmation_code: confirmationCode,
    url: statusUrl.toString(),
  });
}
