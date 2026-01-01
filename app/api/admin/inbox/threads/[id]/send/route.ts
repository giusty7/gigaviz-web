import { NextRequest, NextResponse } from "next/server";
import { requireAdminWorkspace } from "@/lib/supabase/route";
import { sendWhatsAppText } from "@/lib/wa/cloud";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const sendTimestamps: number[] = [];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function mapMessage(row: any) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    direction: row.direction,
    text: row.text,
    ts: row.ts,
    status: row.status ?? undefined,
    waMessageId: row.wa_message_id ?? undefined,
    errorReason: row.error_reason ?? undefined,
    mediaUrl: row.media_url ?? undefined,
    mediaMime: row.media_mime ?? undefined,
    mediaSha256: row.media_sha256 ?? undefined,
  };
}

function takeRateSlot(cap: number) {
  if (!cap || cap <= 0) return true;
  const now = Date.now();
  const cutoff = now - 60_000;
  while (sendTimestamps.length > 0 && sendTimestamps[0] < cutoff) {
    sendTimestamps.shift();
  }
  if (sendTimestamps.length >= cap) return false;
  sendTimestamps.push(now);
  return true;
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId } = auth;
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const text = String(body?.text ?? "").trim();
  if (!text) {
    return withCookies(NextResponse.json({ error: "text_required" }, { status: 400 }));
  }

  const sinceIso = new Date(Date.now() - 30_000).toISOString();
  const { data: recent } = await db
    .from("messages")
    .select(
      "id, conversation_id, direction, text, ts, status, wa_message_id, error_reason, media_url, media_mime, media_sha256"
    )
    .eq("workspace_id", workspaceId)
    .eq("conversation_id", id)
    .eq("direction", "out")
    .eq("text", text)
    .gte("ts", sinceIso)
    .order("ts", { ascending: false })
    .limit(1);

  const existing = recent?.[0];
  if (existing && existing.status !== "failed") {
    return withCookies(
      NextResponse.json({ ok: true, idempotent: true, message: mapMessage(existing) })
    );
  }

  const { data: inserted, error: insErr } = await db
    .from("messages")
    .insert({
      workspace_id: workspaceId,
      conversation_id: id,
      direction: "out",
      text,
      status: "queued",
    })
    .select(
      "id, conversation_id, direction, text, ts, status, wa_message_id, error_reason, media_url, media_mime, media_sha256"
    )
    .single();

  if (insErr || !inserted) {
    return withCookies(NextResponse.json({ error: insErr?.message || "insert_failed" }, { status: 500 }));
  }

  await db
    .from("conversations")
    .update({ last_message_at: inserted.ts })
    .eq("workspace_id", workspaceId)
    .eq("id", id);

  const enableSend = process.env.ENABLE_WA_SEND === "true";
  if (!enableSend) {
    const { error: dryRunErr } = await db.from("message_events").insert({
      message_id: inserted.id,
      event_type: "send.dry_run",
      payload: { text, conversation_id: id },
    });
    if (dryRunErr) {
      console.log("message_events insert failed (dry_run)", dryRunErr.message);
    }

    return withCookies(
      NextResponse.json({ ok: true, mode: "dry-run", message: mapMessage(inserted) })
    );
  }

  const rateCap = Number(process.env.RATE_CAP_PER_MIN ?? 0) || 0;
  if (!takeRateSlot(rateCap)) {
    await db
      .from("messages")
      .update({ status: "failed", error_reason: "rate_limited" })
      .eq("workspace_id", workspaceId)
      .eq("id", inserted.id);

    const { error: rateErr } = await db.from("message_events").insert({
      message_id: inserted.id,
      event_type: "send.failed",
      payload: { error: "rate_limited" },
    });
    if (rateErr) {
      console.log("message_events insert failed (rate_limited)", rateErr.message);
    }

    return withCookies(
      NextResponse.json({ error: "rate_limited" }, { status: 429 })
    );
  }

  const delayMin = Math.max(0, Number(process.env.RATE_DELAY_MIN_MS ?? 800) || 0);
  const delayMax = Math.max(delayMin, Number(process.env.RATE_DELAY_MAX_MS ?? 2200) || delayMin);
  const delay = delayMin + Math.floor(Math.random() * (delayMax - delayMin + 1));
  if (delay > 0) await sleep(delay);

  const { data: conv, error: convErr } = await db
    .from("conversations")
    .select("id, contact_id")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .single();

  if (convErr || !conv) {
    await db
      .from("messages")
      .update({ status: "failed", error_reason: "conversation_not_found" })
      .eq("workspace_id", workspaceId)
      .eq("id", inserted.id);
    return withCookies(NextResponse.json({ error: "conversation_not_found" }, { status: 404 }));
  }

  const { data: contact, error: cErr } = await db
    .from("contacts")
    .select("phone")
    .eq("workspace_id", workspaceId)
    .eq("id", conv.contact_id)
    .single();

  if (cErr || !contact?.phone) {
    await db
      .from("messages")
      .update({ status: "failed", error_reason: "contact_phone_missing" })
      .eq("workspace_id", workspaceId)
      .eq("id", inserted.id);
    return withCookies(NextResponse.json({ error: "contact_phone_missing" }, { status: 400 }));
  }

  try {
    const sendRes = await sendWhatsAppText({
      to: normalizePhone(contact.phone),
      body: text,
    });
    const waMessageId = (sendRes.data as any)?.messages?.[0]?.id;

    const { data: updated } = await db
      .from("messages")
      .update({
        status: "sent",
        wa_message_id: waMessageId ?? null,
        error_reason: null,
      })
      .eq("workspace_id", workspaceId)
      .eq("id", inserted.id)
      .select(
        "id, conversation_id, direction, text, ts, status, wa_message_id, error_reason, media_url, media_mime, media_sha256"
      )
      .single();

    const { error: sendErr } = await db.from("message_events").insert({
      message_id: inserted.id,
      event_type: "send.success",
      payload: sendRes.data ?? {},
    });
    if (sendErr) {
      console.log("message_events insert failed (send_success)", sendErr.message);
    }

    return withCookies(
      NextResponse.json({ ok: true, message: mapMessage(updated ?? inserted) })
    );
  } catch (err: any) {
    const reason = err?.message || "send_failed";
    await db
      .from("messages")
      .update({ status: "failed", error_reason: reason })
      .eq("workspace_id", workspaceId)
      .eq("id", inserted.id);

    const { error: failErr } = await db.from("message_events").insert({
      message_id: inserted.id,
      event_type: "send.failed",
      payload: { error: reason },
    });
    if (failErr) {
      console.log("message_events insert failed (send_failed)", failErr.message);
    }

    return withCookies(NextResponse.json({ error: reason }, { status: 500 }));
  }
}
