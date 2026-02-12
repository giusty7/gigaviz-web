import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getResendFromAuth } from "@/lib/email";
import { resendVerificationSchema } from "@/lib/validation/auth";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

function getBaseUrl(req: NextRequest) {
  return process.env.APP_BASE_URL ?? req.nextUrl.origin;
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const parsed = resendVerificationSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const db = supabaseAdmin();
  const redirectTo = `${getBaseUrl(req)}/verify-email?email=${encodeURIComponent(
    email
  )}`;

  const { data, error } = await db.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      redirectTo,
    },
  });

  if (error || !data?.properties?.action_link) {
    return NextResponse.json(
      { error: error?.message ?? "verification_failed" },
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
    subject: "Verify your Gigaviz account",
    text: `Verify your email to continue:\n${actionLink}\n\nIf you did not request this, you can ignore this email.`,
  });

  if (sendError) {
    return NextResponse.json(
      { error: "email_send_failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
});
