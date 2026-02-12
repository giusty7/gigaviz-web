import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrSupervisorWorkspace } from "@/lib/supabase/route";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const optInSchema = z.object({
  source: z.string().max(100).optional().default("manual"),
});

const paramSchema = z.object({ id: z.string().uuid() });

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: Ctx) => {
  const auth = await requireAdminOrSupervisorWorkspace(req);
  if (!auth.ok) return auth.res;

  const { db, withCookies, workspaceId, user } = auth;
  const rawParams = await ctx.params;
  const paramsParsed = paramSchema.safeParse(rawParams);
  if (!paramsParsed.success) {
    return withCookies(NextResponse.json({ error: "invalid_contact_id" }, { status: 400 }));
  }
  const contactId = paramsParsed.data.id;

  const body = await req.json().catch(() => ({}));
  const parsed = optInSchema.safeParse(body);
  const source = parsed.success ? parsed.data.source ?? "manual" : "manual";
  const nowIso = new Date().toISOString();

  const { data, error } = await db
    .from("contacts")
    .update({
      opted_in: true,
      opted_in_at: nowIso,
      opt_in_source: source,
      opted_out: false,
      opted_out_at: null,
      opt_out_reason: null,
      comms_status: "normal",
    })
    .eq("workspace_id", workspaceId)
    .eq("id", contactId)
    .select("id, opted_in, opted_in_at, opt_in_source, opted_out, opted_out_at, opt_out_reason")
    .single();

  if (error || !data) {
    return withCookies(
      NextResponse.json({ error: error?.message || "update_failed" }, { status: 500 })
    );
  }

  return withCookies(NextResponse.json({ ok: true, contact: data, updated_by: user?.id ?? null }));
});
