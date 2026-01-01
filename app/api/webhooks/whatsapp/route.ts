import { handleWhatsAppVerify, handleWhatsAppWebhook } from "@/lib/wa/webhook";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return handleWhatsAppVerify(req);
}

export async function POST(req: Request) {
  return handleWhatsAppWebhook(req);
}
