import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace, requireWorkspaceRole } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Full settings type
type HelperSettings = {
  workspace_id: string;
  allow_automation: boolean;
  monthly_cap: number;
  ai_provider: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  features: Record<string, boolean>;
  updated_at: string;
};

const settingsSchema = z.object({
  allow_automation: z.boolean().optional(),
  monthly_cap: z.number().min(0).optional(),
  ai_provider: z.enum(["openai", "anthropic", "google"]).optional(),
  model_name: z.string().min(1).max(100).optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(256).max(32000).optional(),
  system_prompt: z.string().max(10000).optional(),
  features: z.record(z.string(), z.boolean()).optional(),
});

export async function GET(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies } = guard;

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("helper_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  // Return default settings if none exist
  const settings: HelperSettings = data ?? {
    workspace_id: workspaceId,
    allow_automation: true,
    monthly_cap: 0,
    ai_provider: "openai",
    model_name: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 2048,
    system_prompt: "You are a helpful AI assistant for Gigaviz platform. Be concise, professional, and helpful.",
    features: {
      rag_enabled: true,
      memory_enabled: true,
      tools_enabled: true,
      streaming_enabled: true,
    },
    updated_at: new Date().toISOString(),
  };

  return withCookies(NextResponse.json({ ok: true, settings }));
}

export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, role, withCookies } = guard;

  if (!requireWorkspaceRole(role, ["owner", "admin"])) {
    return withCookies(NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }));
  }

  const body = await req.json().catch(() => ({}));
  const parsed = settingsSchema.safeParse(body);
  
  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ ok: false, error: "Invalid settings", details: parsed.error.flatten() }, { status: 400 })
    );
  }

  const updates: Record<string, unknown> = {
    workspace_id: workspaceId,
  };

  // Only include fields that are provided
  if (parsed.data.allow_automation !== undefined) updates.allow_automation = parsed.data.allow_automation;
  if (parsed.data.monthly_cap !== undefined) updates.monthly_cap = parsed.data.monthly_cap;
  if (parsed.data.ai_provider !== undefined) updates.ai_provider = parsed.data.ai_provider;
  if (parsed.data.model_name !== undefined) updates.model_name = parsed.data.model_name;
  if (parsed.data.temperature !== undefined) updates.temperature = parsed.data.temperature;
  if (parsed.data.max_tokens !== undefined) updates.max_tokens = parsed.data.max_tokens;
  if (parsed.data.system_prompt !== undefined) updates.system_prompt = parsed.data.system_prompt;
  if (parsed.data.features !== undefined) updates.features = parsed.data.features;

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("helper_settings")
    .upsert(updates, { onConflict: "workspace_id" })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return withCookies(
      NextResponse.json({ ok: false, error: error?.message ?? "failed" }, { status: 500 })
    );
  }

  return withCookies(NextResponse.json({ ok: true, settings: data }));
}
