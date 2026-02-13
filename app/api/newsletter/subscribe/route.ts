import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const schema = z.object({
  email: z.string().email().max(320),
  source: z.string().max(50).default("homepage"),
  locale: z.string().max(5).default("en"),
});

async function handler(req: NextRequest) {
  const body = await req.json();
  const validated = schema.parse(body);

  const db = supabaseAdmin();

  // Upsert: if email already exists, just return success (idempotent)
  const { error } = await db
    .from("newsletter_subscribers")
    .upsert(
      {
        email: validated.email.toLowerCase().trim(),
        source: validated.source,
        locale: validated.locale,
        status: "active",
        subscribed_at: new Date().toISOString(),
      },
      { onConflict: "email", ignoreDuplicates: false }
    );

  if (error) {
    // Unique constraint violation means already subscribed — treat as success
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, message: "Already subscribed" });
    }
    logger.error("Newsletter subscribe failed", { error });
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }

  logger.info("Newsletter subscriber added", {
    email: validated.email,
    source: validated.source,
  });

  return NextResponse.json({ ok: true, message: "Subscribed successfully" });
}

export const POST = withErrorHandler(handler);
