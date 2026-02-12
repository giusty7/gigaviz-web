import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import {
  forbiddenResponse,
  getWorkspaceId,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logging";
import { findConnectionById } from "@/lib/meta/wa-connections";
import { withErrorHandler } from "@/lib/api/with-error-handler";

const schema = z.object({
  workspaceSlug: z.string().min(1).optional(),
  workspaceId: z.string().uuid().optional(),
  connectionId: z.string().uuid(),
  templateId: z.string().uuid(),
  name: z.string().min(1).max(255),
  audience: z.object({
    tagIds: z.array(z.string()).optional(),
    contactIds: z.array(z.string().uuid()).optional(),
  }),
  globalValues: z.record(z.string(), z.string()).optional(), // e.g., { "1": "DefaultValue", "2": "Global" }
  paramMapping: z.array(
    z.object({
      paramIndex: z.number().int().min(1), // 1-based: {{1}}, {{2}}, ...
      sourceType: z.enum(["manual", "contact_field", "expression"]),
      sourceValue: z.string().optional(), // field name or expression
      defaultValue: z.string().optional(),
    })
  ).optional(),
  rateLimitPerMinute: z.number().int().min(1).max(200).optional().default(60),
});

export const runtime = "nodejs";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const {
    workspaceSlug,
    workspaceId: bodyWorkspaceId,
    connectionId,
    templateId,
    name,
    audience,
    globalValues,
    paramMapping,
    rateLimitPerMinute,
  } = parsed.data;

  const adminDb = supabaseAdmin();
  let workspaceId = getWorkspaceId(req, undefined, bodyWorkspaceId);

  // Resolve workspace from slug if provided
  if (!workspaceId && workspaceSlug) {
    const { data: ws } = await adminDb
      .from("workspaces")
      .select("id")
      .eq("slug", workspaceSlug)
      .maybeSingle();
    if (ws) workspaceId = ws.id;
  }

  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ["owner", "admin"])) {
    return forbiddenResponse(withCookies);
  }

  const limiter = rateLimit(`wa-job-create:${workspaceId}:${userData.user.id}`, {
    windowMs: 60_000,
    max: 10,
  });
  if (!limiter.ok) {
    return withCookies(
      NextResponse.json({ error: "rate_limited", resetAt: limiter.resetAt }, { status: 429 })
    );
  }

  // Validate connection belongs to workspace
  const connection = await findConnectionById(adminDb, connectionId);
  if (connection.error || !connection.data || connection.data.workspace_id !== workspaceId) {
    return withCookies(
      NextResponse.json(
        { error: "not_found", reason: "connection_not_found" },
        { status: 404 }
      )
    );
  }

  // Validate template belongs to workspace
  const { data: template, error: tplErr } = await adminDb
    .from("wa_templates")
    .select("id, workspace_id, name, language, variable_count, body, header, footer")
    .eq("id", templateId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (tplErr || !template) {
    return withCookies(
      NextResponse.json({ error: "not_found", reason: "template_not_found" }, { status: 404 })
    );
  }

  // Fetch contacts based on audience filters
  let contactQuery = adminDb
    .from("wa_contacts")
    .select("id, wa_id, name, phone, email, tags, data")
    .eq("workspace_id", workspaceId);

  if (audience.tagIds && audience.tagIds.length > 0) {
    contactQuery = contactQuery.overlaps("tags", audience.tagIds);
  }

  if (audience.contactIds && audience.contactIds.length > 0) {
    contactQuery = contactQuery.in("id", audience.contactIds);
  }

  const { data: contacts, error: contactsErr } = await contactQuery;

  if (contactsErr) {
    logger.error("[wa-job-create] contacts fetch failed", {
      workspaceId,
      message: contactsErr.message,
    });
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: "contacts_fetch_failed" },
        { status: 500 }
      )
    );
  }

  if (!contacts || contacts.length === 0) {
    return withCookies(
      NextResponse.json(
        { error: "bad_request", reason: "no_contacts_found" },
        { status: 400 }
      )
    );
  }

  // Save param mapping definitions (if provided)
  if (paramMapping && paramMapping.length > 0) {
    // Delete existing mappings for this template
    await adminDb
      .from("wa_template_param_defs")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("template_id", templateId);

    const mappingRows = paramMapping.map((m) => ({
      workspace_id: workspaceId,
      template_id: templateId,
      param_index: m.paramIndex,
      source_type: m.sourceType,
      source_value: m.sourceValue ?? null,
      default_value: m.defaultValue ?? null,
    }));

    const { error: mappingErr } = await adminDb
      .from("wa_template_param_defs")
      .insert(mappingRows);

    if (mappingErr) {
      logger.error("[wa-job-create] param mapping save failed", {
        workspaceId,
        message: mappingErr.message,
      });
      return withCookies(
        NextResponse.json(
          { error: "db_error", reason: "param_mapping_save_failed" },
          { status: 500 }
        )
      );
    }
  }

  // Helper: compute parameters for a contact
  function computeParams(
    contact: NonNullable<typeof contacts>[0],
    variableCount: number,
    paramDefs: typeof paramMapping
  ): string[] {
    const params: string[] = [];
    for (let i = 1; i <= variableCount; i++) {
      const def = paramDefs?.find((d) => d.paramIndex === i);
      let value = "";

      if (def) {
        if (def.sourceType === "manual") {
          value = (globalValues?.[i.toString()] ?? def.defaultValue ?? "") as string;
        } else if (def.sourceType === "contact_field") {
          const fieldName = def.sourceValue ?? "";
          // Check standard fields first
          if (fieldName === "name") value = contact.name ?? "";
          else if (fieldName === "phone") value = contact.phone ?? "";
          else if (fieldName === "email") value = contact.email ?? "";
          else if (fieldName === "wa_id") value = contact.wa_id ?? "";
          // Check custom data fields
          else if (contact.data && typeof contact.data === "object") {
            const dataValue = (contact.data as Record<string, unknown>)[fieldName];
            value = typeof dataValue === "string" ? dataValue : "";
          }
          if (!value) value = def.defaultValue ?? "";
        } else if (def.sourceType === "expression") {
          // Simple mustache-style replacement: {{contact.name}}, {{global.promo}}
          let expr = def.sourceValue ?? "";
          // Replace {{contact.field}}
          expr = expr.replace(/\{\{contact\.(\w+)\}\}/g, (_: string, field: string) => {
            if (field === "name") return contact.name ?? "";
            if (field === "phone") return contact.phone ?? "";
            if (field === "email") return contact.email ?? "";
            if (field === "wa_id") return contact.wa_id ?? "";
            if (contact.data && typeof contact.data === "object") {
              const dataValue = (contact.data as Record<string, unknown>)[field];
              return typeof dataValue === "string" ? dataValue : "";
            }
            return "";
          });
          // Replace {{global.key}}
          expr = expr.replace(/\{\{global\.(\w+)\}\}/g, (_: string, key: string) => {
            return (globalValues?.[key] ?? "") as string;
          });
          value = expr || def.defaultValue || "";
        }
      } else {
        // No mapping defined, use global value or empty
        value = (globalValues?.[i.toString()] ?? "") as string;
      }

      params.push(value);
    }
    return params;
  }

  // Fetch param definitions for this template (if any exist)
  const { data: existingParamDefs } = await adminDb
    .from("wa_template_param_defs")
    .select("param_index, source_type, source_value, default_value")
    .eq("workspace_id", workspaceId)
    .eq("template_id", templateId)
    .order("param_index");

  const paramDefs = paramMapping ?? existingParamDefs?.map((d) => ({
    paramIndex: d.param_index,
    sourceType: d.source_type as "manual" | "contact_field" | "expression",
    sourceValue: d.source_value ?? undefined,
    defaultValue: d.default_value ?? undefined,
  }));

  // Create job
  const { data: job, error: jobErr } = await adminDb
    .from("wa_send_jobs")
    .insert({
      workspace_id: workspaceId,
      connection_id: connectionId,
      template_id: templateId,
      name,
      status: "pending",
      total_count: contacts.length,
      queued_count: contacts.length,
      sent_count: 0,
      failed_count: 0,
      global_values: globalValues ?? {},
      rate_limit_per_minute: rateLimitPerMinute,
      created_by: userData.user.id,
    })
    .select("id, workspace_id, connection_id, template_id, name, status, total_count")
    .single();

  if (jobErr || !job) {
    logger.error("[wa-job-create] job insert failed", {
      workspaceId,
      message: jobErr?.message,
    });
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: "job_insert_failed" },
        { status: 500 }
      )
    );
  }

  // Create job items
  const jobItems = contacts.map((contact) => {
    const params = computeParams(contact, template.variable_count, paramDefs);
    const toPhone = contact.phone || contact.wa_id;

    return {
      job_id: job.id,
      workspace_id: workspaceId,
      contact_id: contact.id,
      to_phone: toPhone,
      params,
      status: "queued",
    };
  });

  const { error: itemsErr } = await adminDb.from("wa_send_job_items").insert(jobItems);

  if (itemsErr) {
    logger.error("[wa-job-create] job items insert failed", {
      workspaceId,
      jobId: job.id,
      message: itemsErr.message,
    });
    // Rollback job
    await adminDb.from("wa_send_jobs").delete().eq("id", job.id);
    return withCookies(
      NextResponse.json(
        { error: "db_error", reason: "job_items_insert_failed" },
        { status: 500 }
      )
    );
  }

  logger.info("[wa-job-create] job created", {
    workspaceId,
    jobId: job.id,
    totalCount: contacts.length,
  });

  return withCookies(
    NextResponse.json({
      ok: true,
      job: {
        id: job.id,
        name: job.name,
        status: job.status,
        totalCount: job.total_count,
      },
    })
  );
});
