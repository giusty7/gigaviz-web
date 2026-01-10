import {
  handleMetaWhatsAppVerify,
  handleMetaWhatsAppWebhook,
} from "@/lib/meta/webhooks/whatsapp-handler";

export const runtime = "nodejs";

export const GET = handleMetaWhatsAppVerify;
export const POST = handleMetaWhatsAppWebhook;
