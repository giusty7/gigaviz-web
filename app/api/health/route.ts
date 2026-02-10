import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // SECURITY: Require bearer token for detailed health data
  const authHeader = req.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET || process.env.WEBHOOK_SECRET;

  if (expectedToken) {
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { ok: true, status: "healthy" },
        { status: 200 }
      );
    }
  }

  const db = supabaseAdmin();
  const health = {
    ok: true,
    db: true,
    waTokenPresent: Boolean(process.env.WA_ACCESS_TOKEN || process.env.WA_CLOUD_API_TOKEN),
    waPhonePresent: Boolean(process.env.WA_PHONE_NUMBER_ID),
    outboxQueued: 0,
    outboxProcessing: 0,
    outboxFailed: 0,
    oldestQueuedAgeSec: 0,
  };

  const { error: dbErr } = await db.from("outbox_messages").select("id").limit(1);
  if (dbErr) {
    health.ok = false;
    health.db = false;
  }

  const { count: queuedCount, error: queuedErr } = await db
    .from("outbox_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "queued");
  if (!queuedErr && typeof queuedCount === "number") {
    health.outboxQueued = queuedCount;
  }

  const { count: processingCount, error: processingErr } = await db
    .from("outbox_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "processing");
  if (!processingErr && typeof processingCount === "number") {
    health.outboxProcessing = processingCount;
  }

  const { count: failedCount, error: failedErr } = await db
    .from("outbox_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed");
  if (!failedErr && typeof failedCount === "number") {
    health.outboxFailed = failedCount;
  }

  const { data: oldestQueued, error: oldestErr } = await db
    .from("outbox_messages")
    .select("created_at")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!oldestErr && oldestQueued?.created_at) {
    const ageMs = Date.now() - Date.parse(oldestQueued.created_at as string);
    health.oldestQueuedAgeSec = ageMs > 0 ? Math.floor(ageMs / 1000) : 0;
  }

  const status = health.ok ? 200 : 503;
  return NextResponse.json(health, { status });
}
