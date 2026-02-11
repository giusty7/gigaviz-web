import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace, requireWorkspaceRole } from "@/lib/auth/guard";

export const runtime = "nodejs";

const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  prompt: z.string().min(1).max(10000),
  category: z.string().max(50).optional(),
  variables: z.array(z.string()).optional(),
  icon: z.string().max(50).optional(),
  visibility: z.enum(["private", "workspace", "public"]).optional(),
});

const updateTemplateSchema = createTemplateSchema.partial().extend({
  id: z.string().uuid(),
  is_active: z.boolean().optional(),
});

// GET - List templates
export async function GET(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const activeOnly = url.searchParams.get("active") !== "false";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);
  let query = db
    .from("helper_templates")
    .select("id, workspace_id, name, description, prompt, category, variables, icon, visibility, use_count, is_active, created_at, updated_at, created_by")
    .eq("workspace_id", workspaceId)
    .order("use_count", { ascending: false })
    .limit(limit);

  if (category) {
    query = query.eq("category", category);
  }
  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, templates: data ?? [] }));
}

// POST - Create template
export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, user, withCookies, supabase: db } = guard;
  const userId = user.id;

  const body = await req.json().catch(() => ({}));
  const parsed = createTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ ok: false, error: "Invalid template data", details: parsed.error.flatten() }, { status: 400 })
    );
  }

  // Extract variables from prompt if not provided
  let variables = parsed.data.variables ?? [];
  if (variables.length === 0) {
    const matches = parsed.data.prompt.matchAll(/\{\{(\w+)\}\}/g);
    variables = [...new Set(Array.from(matches).map(m => m[1]))];
  }

  const { data, error } = await db
    .from("helper_templates")
    .insert({
      workspace_id: workspaceId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      prompt: parsed.data.prompt,
      initial_messages: [{ role: "user", content: parsed.data.prompt }],
      category: parsed.data.category ?? "general",
      variables,
      icon: parsed.data.icon ?? null,
      visibility: parsed.data.visibility ?? "workspace",
      created_by: userId,
      is_active: true,
      use_count: 0,
    })
    .select("*")
    .single();

  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, template: data }));
}

// PUT - Update template
export async function PUT(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const body = await req.json().catch(() => ({}));
  const parsed = updateTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ ok: false, error: "Invalid update data", details: parsed.error.flatten() }, { status: 400 })
    );
  }

  const { id, ...updates } = parsed.data;
  
  // Extract variables if prompt changed
  if (updates.prompt && !updates.variables) {
    const matches = updates.prompt.matchAll(/\{\{(\w+)\}\}/g);
    updates.variables = [...new Set(Array.from(matches).map(m => m[1]))];
  }

  // Update initial_messages if prompt changed
  const dbUpdates: Record<string, unknown> = { ...updates };
  if (updates.prompt) {
    dbUpdates.initial_messages = [{ role: "user", content: updates.prompt }];
  }

  const { data, error } = await db
    .from("helper_templates")
    .update(dbUpdates)
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, template: data }));
}

// DELETE - Delete template
export async function DELETE(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, role, withCookies, supabase: db } = guard;

  if (!requireWorkspaceRole(role, ["owner", "admin"])) {
    return withCookies(NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }));
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return withCookies(NextResponse.json({ ok: false, error: "Template ID required" }, { status: 400 }));
  }

  const { error } = await db
    .from("helper_templates")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true }));
}
