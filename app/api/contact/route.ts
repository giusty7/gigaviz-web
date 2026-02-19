import { logger } from "@/lib/logging";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getResendFromContact } from "@/lib/email";
import { contactSchema } from "@/lib/validation/contact";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notifyOpsNewLead } from "@/lib/ops/wa-internal";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map<string, number[]>();

// email tujuan utama (inbox kamu)
const TO_EMAIL =
  process.env.CONTACT_RECIPIENT_EMAIL ?? "your-email@example.com";

// alamat pengirim (gunakan RESEND_FROM_CONTACT)

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const history = rateLimitStore.get(ip) ?? [];
  const recent = history.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateLimitStore.set(ip, recent);
  return false;
}

export const POST = withErrorHandler(async (req: Request) => {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Too many attempts. Please wait a few minutes before sending again.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validasi server-side
    const parsedResult = contactSchema.safeParse(body);
    if (!parsedResult.success) {
      const firstError = parsedResult.error.issues[0]?.message ?? "Data is invalid.";
      return NextResponse.json(
        { ok: false, message: firstError },
        { status: 400 }
      );
    }
    const parsed = parsedResult.data;

    // Honeypot: if "website" is filled, assume bot but still return success
    if (parsed.website && parsed.website.trim().length > 0) {
      logger.warn("[CONTACT] Spam detected (honeypot).", parsed);
      return NextResponse.json(
          { ok: true, message: "Thank you, we received your message." },
        { status: 200 }
      );
    }

    // If API key is not set â†’ never new Resend() during build
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      logger.warn(
          "[CONTACT] RESEND_API_KEY not set. Message logged only.",
        parsed
      );
      return NextResponse.json(
        {
          ok: true,
          message:
            "Message received (development mode). Once email is configured, it will be delivered to the inbox.",
        },
        { status: 200 }
      );
    }

    const resend = new Resend(apiKey);

    const companyValue = parsed.company && parsed.company.trim().length > 0 ? parsed.company : "-";
    const budgetValue =
      parsed.budgetRange && parsed.budgetRange.trim().length > 0
        ? parsed.budgetRange
        : "-";

    const text = `New message from Gigaviz.com contact form:

  Name   : ${parsed.name}
  Email  : ${parsed.email}
  Company: ${companyValue}
  Topic  : ${parsed.topic}
  Budget : ${budgetValue}

  Message:
  ${parsed.message}
  `;

    const { error } = await resend.emails.send({
      from: getResendFromContact(),
      to: [TO_EMAIL],
      replyTo: parsed.email,
      subject: `[Gigaviz.com] New contact: ${parsed.topic}`,
      text,
    });

    if (error) {
      logger.error("[CONTACT] Error sending email:", error);
      return NextResponse.json(
        { ok: false, message: "Failed to send email. Please try again later." },
        { status: 500 }
      );
    }

    // Persist contact form submission as a lead for ops tracking
    try {
      const db = supabaseAdmin();
      const { data: leadRow, error: leadError } = await db
        .from("leads")
        .insert({
          name: parsed.name,
          phone: parsed.email, // contact form uses email as identifier
          business: companyValue !== "-" ? companyValue : null,
          need: parsed.topic,
          notes: parsed.message,
          source: "contact-form",
          status: "new",
        })
        .select("id")
        .single();

      if (leadError) {
        logger.warn("[CONTACT] Lead persistence failed (non-blocking):", leadError);
      } else {
        logger.info("[CONTACT] Lead saved from contact form", { leadId: leadRow?.id });
        // Fire WA notification to ops (non-blocking)
        notifyOpsNewLead({
          name: parsed.name,
          identifier: parsed.email,
          source: "contact-form",
          need: parsed.topic,
        }).catch((e) => logger.warn("[CONTACT] WA ops notify failed", { error: e }));
      }
    } catch (leadErr) {
      logger.warn("[CONTACT] Lead persistence error (non-blocking):", leadErr);
    }

    logger.info("[CONTACT] Form submitted:", parsed);

    return NextResponse.json(
      { ok: true, message: "Thank you, we received your message." },
      { status: 200 }
    );
  } catch (err) {
    logger.error("[CONTACT] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, message: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
});
