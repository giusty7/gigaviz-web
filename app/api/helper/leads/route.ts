import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace, requireWorkspaceRole } from "@/lib/auth/guard";

export const runtime = "nodejs";

const createLeadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  source: z.enum(["whatsapp", "website", "import", "manual"]).optional(),
  contact_id: z.string().uuid().optional().nullable(),
  estimated_value: z.number().min(0).optional().nullable(),
  currency: z.string().max(3).optional(),
  tags: z.array(z.string()).optional(),
  custom_fields: z.record(z.string(), z.unknown()).optional(),
});

const updateLeadSchema = createLeadSchema.partial().extend({
  id: z.string().uuid(),
  score: z.number().min(0).max(100).optional(),
  temperature: z.enum(["hot", "warm", "cold"]).optional(),
  qualification_status: z.enum(["unqualified", "mql", "sql", "opportunity", "customer", "churned"]).optional(),
  status: z.enum(["active", "converted", "lost", "archived"]).optional(),
  assigned_to: z.string().uuid().optional().nullable(),
});

// Calculate lead score based on metrics
function calculateLeadScore(lead: {
  engagement_score?: number;
  total_interactions?: number;
  last_activity_at?: string | null;
  estimated_value?: number | null;
}): { score: number; temperature: "hot" | "warm" | "cold" } {
  let score = 0;

  // Engagement (0-30 points)
  const engagement = lead.engagement_score ?? 0;
  score += Math.min(30, Math.round(engagement * 0.3));

  // Interactions (0-25 points)
  const interactions = lead.total_interactions ?? 0;
  score += Math.min(25, interactions * 2);

  // Recency (0-25 points)
  if (lead.last_activity_at) {
    const daysSinceActivity = (Date.now() - new Date(lead.last_activity_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActivity < 1) score += 25;
    else if (daysSinceActivity < 7) score += 20;
    else if (daysSinceActivity < 14) score += 15;
    else if (daysSinceActivity < 30) score += 10;
    else if (daysSinceActivity < 60) score += 5;
  }

  // Value (0-20 points)
  if (lead.estimated_value) {
    if (lead.estimated_value >= 100000000) score += 20; // 100M+
    else if (lead.estimated_value >= 50000000) score += 15;
    else if (lead.estimated_value >= 10000000) score += 10;
    else if (lead.estimated_value >= 1000000) score += 5;
  }

  score = Math.min(100, Math.max(0, score));

  let temperature: "hot" | "warm" | "cold" = "cold";
  if (score >= 70) temperature = "hot";
  else if (score >= 40) temperature = "warm";

  return { score, temperature };
}

// GET - List leads
export async function GET(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "active";
  const temperature = url.searchParams.get("temperature");
  const assignedTo = url.searchParams.get("assigned_to");
  const search = url.searchParams.get("search");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  let query = db
    .from("helper_leads")
    .select("*", { count: "exact" })
    .eq("workspace_id", workspaceId)
    .order("score", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (temperature) {
    query = query.eq("temperature", temperature);
  }
  if (assignedTo) {
    query = query.eq("assigned_to", assignedTo);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ 
    ok: true, 
    leads: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  }));
}

// POST - Create lead
export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const body = await req.json().catch(() => ({}));
  const parsed = createLeadSchema.safeParse(body);

  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ ok: false, error: "Invalid lead data", details: parsed.error.flatten() }, { status: 400 })
    );
  }

  // Calculate initial score
  const { score, temperature } = calculateLeadScore({
    engagement_score: 0,
    total_interactions: 0,
    estimated_value: parsed.data.estimated_value,
  });

  const { data, error } = await db
    .from("helper_leads")
    .insert({
      workspace_id: workspaceId,
      name: parsed.data.name,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      company: parsed.data.company ?? null,
      title: parsed.data.title ?? null,
      source: parsed.data.source ?? "manual",
      contact_id: parsed.data.contact_id ?? null,
      estimated_value: parsed.data.estimated_value ?? null,
      currency: parsed.data.currency ?? "IDR",
      tags: parsed.data.tags ?? [],
      custom_fields: parsed.data.custom_fields ?? {},
      score,
      temperature,
      qualification_status: "unqualified",
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, lead: data }));
}

// PUT - Update lead
export async function PUT(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const body = await req.json().catch(() => ({}));
  const parsed = updateLeadSchema.safeParse(body);

  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ ok: false, error: "Invalid update data", details: parsed.error.flatten() }, { status: 400 })
    );
  }

  const { id, ...updates } = parsed.data;

  const { data, error } = await db
    .from("helper_leads")
    .update(updates)
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, lead: data }));
}

// DELETE - Delete lead
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
    return withCookies(NextResponse.json({ ok: false, error: "Lead ID required" }, { status: 400 }));
  }

  const { error } = await db
    .from("helper_leads")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true }));
}
