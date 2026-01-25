import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";
import { findConnectionById } from "@/lib/meta/wa-connections";
import { sendWhatsappMessage } from "@/lib/meta/wa-graph";
import { findTokenForConnection } from "@/lib/meta/wa-connections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel max timeout

const BATCH_SIZE = 10; // Process 10 items per invocation
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

// GitHub Actions / Cron secret authentication
const CRON_SECRET = process.env.CRON_SECRET || "";

export async function POST(req: NextRequest) {
  // Verify authorization
  const authHeader = req.headers.get("authorization");
  
  // Security check
  if (!CRON_SECRET) {
    // Dev mode: allow without secret for local testing
    if (process.env.NODE_ENV !== "production") {
      logger.warn("[wa-send-worker] CRON_SECRET not set, allowing in dev mode");
    } else {
      logger.error("[wa-send-worker] CRON_SECRET not configured in production");
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }
  } else if (authHeader !== `Bearer ${CRON_SECRET}`) {
    logger.warn("[wa-send-worker] unauthorized cron attempt", {
      hasAuth: !!authHeader,
    });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = supabaseAdmin();

  // Find pending jobs that have queued items
  const { data: pendingJobs, error: jobsErr } = await db
    .from("wa_send_jobs")
    .select("id, workspace_id, connection_id, template_id, rate_limit_per_minute, started_at")
    .in("status", ["pending", "processing"])
    .order("created_at", { ascending: true })
    .limit(5);

  if (jobsErr) {
    logger.error("[wa-send-worker] failed to fetch pending jobs", {
      message: jobsErr.message,
    });
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  if (!pendingJobs || pendingJobs.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: "no_pending_jobs" });
  }

  let totalProcessed = 0;
  let totalSent = 0;
  let totalFailed = 0;

  for (const job of pendingJobs) {
    // Mark job as processing if pending
    const { data: currentJob } = await db
      .from("wa_send_jobs")
      .select("status")
      .eq("id", job.id)
      .single();

    if (currentJob?.status === "pending") {
      await db
        .from("wa_send_jobs")
        .update({ status: "processing", started_at: new Date().toISOString() })
        .eq("id", job.id);
    }

    // Fetch queued items for this job
    const { data: items, error: itemsErr } = await db
      .from("wa_send_job_items")
      .select("id, contact_id, to_phone, params")
      .eq("job_id", job.id)
      .eq("status", "queued")
      .limit(BATCH_SIZE);

    if (itemsErr || !items || items.length === 0) {
      // No more items, mark job as completed
      const { data: stats } = await db
        .from("wa_send_job_items")
        .select("status")
        .eq("job_id", job.id);

      const sentCount = stats?.filter((s) => s.status === "sent").length ?? 0;
      const failedCount = stats?.filter((s) => s.status === "failed").length ?? 0;
      const queuedCount = stats?.filter((s) => s.status === "queued").length ?? 0;

      await db
        .from("wa_send_jobs")
        .update({
          status: queuedCount === 0 ? "completed" : "processing",
          sent_count: sentCount,
          failed_count: failedCount,
          queued_count: queuedCount,
          completed_at: queuedCount === 0 ? new Date().toISOString() : null,
        })
        .eq("id", job.id);

      continue;
    }

    // Fetch connection and token
    const connection = await findConnectionById(db, job.connection_id);
    if (connection.error || !connection.data) {
      logger.error("[wa-send-worker] connection not found", {
        jobId: job.id,
        connectionId: job.connection_id,
      });
      // Mark all items as failed
      await db
        .from("wa_send_job_items")
        .update({
          status: "failed",
          error_message: "connection_not_found",
        })
        .eq("job_id", job.id)
        .eq("status", "queued");
      continue;
    }

    const { data: tokenRow } = await findTokenForConnection(
      db,
      job.workspace_id,
      connection.data.phone_number_id,
      connection.data.waba_id
    );

    if (!tokenRow?.token_encrypted) {
      logger.error("[wa-send-worker] token not found", {
        jobId: job.id,
        workspaceId: job.workspace_id,
      });
      // Mark all items as failed
      await db
        .from("wa_send_job_items")
        .update({
          status: "failed",
          error_message: "token_not_found",
        })
        .eq("job_id", job.id)
        .eq("status", "queued");
      continue;
    }

    // Fetch template info
    const { data: template } = await db
      .from("wa_templates")
      .select("name, language")
      .eq("id", job.template_id)
      .single();

    if (!template) {
      logger.error("[wa-send-worker] template not found", {
        jobId: job.id,
        templateId: job.template_id,
      });
      await db
        .from("wa_send_job_items")
        .update({
          status: "failed",
          error_message: "template_not_found",
        })
        .eq("job_id", job.id)
        .eq("status", "queued");
      continue;
    }

    // Rate limiting: check how many sent in last minute
    const rateLimit = job.rate_limit_per_minute || 60;
    const oneMinuteAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    const { count: recentSent } = await db
      .from("wa_send_logs")
      .select("id", { count: "exact", head: true })
      .eq("job_id", job.id)
      .eq("success", true)
      .gte("sent_at", oneMinuteAgo);

    const availableSlots = rateLimit - (recentSent ?? 0);
    if (availableSlots <= 0) {
      logger.info("[wa-send-worker] rate limit reached", {
        jobId: job.id,
        rateLimit,
        recentSent,
      });
      continue; // Skip to next job
    }

    const itemsToSend = items.slice(0, Math.min(items.length, availableSlots));

    // Process each item
    for (const item of itemsToSend) {
      totalProcessed++;

      // Mark as sending
      await db
        .from("wa_send_job_items")
        .update({ status: "sending" })
        .eq("id", item.id);

      const parameters = Array.isArray(item.params)
        ? item.params.map((text: string) => ({ type: "text", text }))
        : [];

      const payload = {
        messaging_product: "whatsapp",
        to: item.to_phone,
        type: "template",
        template: {
          name: template.name,
          language: { code: template.language },
          components: [
            {
              type: "body",
              parameters,
            },
          ],
        },
      };

      let success = false;
      let messageId: string | null = null;
      let errorMessage: string | null = null;
      let httpStatus: number | null = null;
      let responseJson: Record<string, unknown> | null = null;

      try {
        const sendResult = await sendWhatsappMessage({
          phoneNumberId: connection.data.phone_number_id ?? "",
          token: tokenRow.token_encrypted,
          payload,
        });

        httpStatus = sendResult.status;
        responseJson = sendResult.response;

        if (sendResult.ok) {
          success = true;
          messageId = sendResult.messageId ?? null;
          totalSent++;
        } else {
          errorMessage = sendResult.errorMessage ?? "send_failed";
          totalFailed++;
        }
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : "unknown_error";
        totalFailed++;
        logger.error("[wa-send-worker] send exception", {
          jobId: job.id,
          itemId: item.id,
          error: errorMessage,
        });
      }

      // Update item
      await db
        .from("wa_send_job_items")
        .update({
          status: success ? "sent" : "failed",
          wa_message_id: messageId,
          error_message: errorMessage,
          sent_at: success ? new Date().toISOString() : null,
        })
        .eq("id", item.id);

      // Insert log entry
      const phoneHash = createHash("sha256").update(item.to_phone).digest("hex");

      await db.from("wa_send_logs").insert({
        workspace_id: job.workspace_id,
        connection_id: job.connection_id,
        template_id: job.template_id,
        job_id: job.id,
        job_item_id: item.id,
        to_phone_hash: phoneHash,
        template_name: template.name,
        template_language: template.language,
        params: item.params,
        success,
        wa_message_id: messageId,
        http_status: httpStatus,
        error_message: errorMessage,
        response_json: responseJson,
        sent_at: new Date().toISOString(),
      });

      // Small delay to avoid bursts
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Update job stats
    const { data: updatedStats } = await db
      .from("wa_send_job_items")
      .select("status")
      .eq("job_id", job.id);

    const sentCount = updatedStats?.filter((s) => s.status === "sent").length ?? 0;
    const failedCount = updatedStats?.filter((s) => s.status === "failed").length ?? 0;
    const queuedCount = updatedStats?.filter((s) => s.status === "queued").length ?? 0;

    await db
      .from("wa_send_jobs")
      .update({
        sent_count: sentCount,
        failed_count: failedCount,
        queued_count: queuedCount,
        status: queuedCount === 0 ? "completed" : "processing",
        completed_at: queuedCount === 0 ? new Date().toISOString() : null,
      })
      .eq("id", job.id);
  }

  logger.info("[wa-send-worker] batch completed", {
    processed: totalProcessed,
    sent: totalSent,
    failed: totalFailed,
  });

  return NextResponse.json({
    ok: true,
    processed: totalProcessed,
    sent: totalSent,
    failed: totalFailed,
  });
}
