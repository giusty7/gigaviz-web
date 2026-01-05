export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";
import { processWhatsAppPayload } from "@/lib/wa/webhook";
import type { WaWebhookPayload } from "@/lib/wa/webhook";

const VERIFY_TOKEN =
  process.env.WA_WEBHOOK_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || "";
const APP_SECRET = process.env.WA_APP_SECRET ?? process.env.META_APP_SECRET ?? "";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

type Database = {
  public: {
    Tables: {
      message_events: {
        Row: {
          id: string;
          message_id: string | null;
          event_type: string;
          payload: Json;
          ts: string;
          processing_status: string | null;
          processing_error: string | null;
          processed_at: string | null;
          processing_error_at: string | null;
        };
        Insert: Partial<{
          message_id: string | null;
          event_type: string;
          payload: Json;
          ts: string;
          processing_status: string | null;
          processing_error: string | null;
          processed_at: string | null;
          processing_error_at: string | null;
        }>;
        Update: Partial<{
          message_id: string | null;
          event_type: string;
          payload: Json;
          ts: string;
          processing_status: string | null;
          processing_error: string | null;
          processed_at: string | null;
          processing_error_at: string | null;
        }>;
        Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type SupabaseAdminClient = ReturnType<typeof createClient<Database>>;

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log(
      "WA_WEBHOOK_ENV_MISSING",
      JSON.stringify({
        hasUrl: Boolean(SUPABASE_URL),
        hasServiceKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
      })
    );
    return null;
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isValidSignature(rawBody: string, signatureHeader: string, secret: string) {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const signature = signatureHeader.replace("sha256=", "");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function asJson(value: unknown): Json {
  return value as Json;
}

function toErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : "unknown_error";
}

function trimError(value: string, max = 500) {
  if (value.length <= max) return value;
  return value.slice(0, max);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && !VERIFY_TOKEN) {
    console.log("WA_WEBHOOK_ENV_MISSING", JSON.stringify({ missing: "WA_WEBHOOK_VERIFY_TOKEN" }));
  }

  if (mode === "subscribe" && token && token === VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") || "";

  if (APP_SECRET) {
    const ok = isValidSignature(rawBody, signature, APP_SECRET);
    if (!ok) {
      console.log("WA_WEBHOOK_SIGNATURE_INVALID");
      return new Response("Forbidden", { status: 403 });
    }
  } else if (signature) {
    console.log("WA_WEBHOOK_SIGNATURE_SKIPPED");
  }

  let body: WaWebhookPayload | null = null;
  try {
    body = rawBody ? (JSON.parse(rawBody) as WaWebhookPayload) : null;
  } catch {
    body = null;
  }

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true });

  const eventPayload = body ?? { raw: rawBody };
  const insertedEvent = await db
    .from("message_events")
    .insert({
      event_type: "wa_webhook",
      payload: asJson(eventPayload),
      processing_status: "received",
    })
    .select("id")
    .maybeSingle();
  const rawErr = insertedEvent.error;
  const eventId = insertedEvent.data?.id ?? null;
  if (rawErr) {
    console.log("WA_WEBHOOK_EVENT_INSERT_ERROR", rawErr.message);
  }

  if (!body) {
    if (eventId) {
      await db
        .from("message_events")
        .update({
          processing_status: "failed",
          processing_error: "invalid_json",
          processing_error_at: new Date().toISOString(),
        })
        .eq("id", eventId);
    }
    return NextResponse.json({ ok: true });
  }

  const workspaceId = process.env.DEFAULT_WORKSPACE_ID || null;
  if (!workspaceId) {
    console.log("WA_WEBHOOK_ENV_MISSING", JSON.stringify({ missing: "DEFAULT_WORKSPACE_ID" }));
  }

  try {
    const result = await processWhatsAppPayload({
      db: db as SupabaseAdminClient,
      workspaceId,
      payload: body,
    });

    if (eventId) {
      if (result.errors.length > 0) {
        await db
          .from("message_events")
          .update({
            processing_status: "failed",
            processing_error: trimError(result.errors.join("; ")),
            processing_error_at: new Date().toISOString(),
          })
          .eq("id", eventId);
      } else {
        await db
          .from("message_events")
          .update({
            processing_status: "processed",
            processed_at: new Date().toISOString(),
          })
          .eq("id", eventId);
      }
    }
  } catch (err: unknown) {
    const message = trimError(toErrorMessage(err));
    console.log("WA_WEBHOOK_PROCESS_ERROR", message);
    if (eventId) {
      await db
        .from("message_events")
        .update({
          processing_status: "failed",
          processing_error: message,
          processing_error_at: new Date().toISOString(),
        })
        .eq("id", eventId);
    }
  }

  return NextResponse.json({ ok: true });
}
