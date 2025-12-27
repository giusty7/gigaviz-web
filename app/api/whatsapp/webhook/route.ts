export const runtime = "nodejs"; // aman untuk log / crypto kalau dibutuhin

const VERIFY_TOKEN = process.env.WA_WEBHOOK_VERIFY_TOKEN || "";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Platform webhook verify params
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && challenge) {
    if (token === VERIFY_TOKEN) {
      // WAJIB balikin challenge mentah (plain text)
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  return new Response("OK", { status: 200 });
}

export async function POST(req: Request) {
  // WAJIB balas cepat 200
  const body = await req.json().catch(() => null);

  // sementara: log dulu biar yakin webhook masuk
  console.log("WEBHOOK_IN:", JSON.stringify(body));

  return new Response("OK", { status: 200 });
}