import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getResendFromAuth } from "@/lib/email";
import { forgotPasswordSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";

function getBaseUrl(req: NextRequest) {
  return process.env.APP_BASE_URL ?? req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { email } = parsed.data;
  const db = supabaseAdmin();
  const redirectTo = `${getBaseUrl(req)}/reset-password`;

  const { data, error } = await db.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo,
    },
  });

  if (error || !data?.properties?.action_link) {
    return NextResponse.json(
      { error: error?.message ?? "reset_failed" },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn("[AUTH] RESEND_API_KEY missing, skip email send.");
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(apiKey);
  const actionLink = data.properties.action_link;

  const { error: sendError } = await resend.emails.send({
    from: getResendFromAuth(),
    to: [email],
    subject: "Reset your Gigaviz password",
    text: `Reset your password with the link below:\n${actionLink}\n\nIf you did not request this, you can ignore this email.`,
  });

  if (sendError) {
    return NextResponse.json(
      { error: "email_send_failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
