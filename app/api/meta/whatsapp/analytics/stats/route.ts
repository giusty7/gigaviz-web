import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import {
  forbiddenResponse,
  getWorkspaceId,
  requireWorkspaceMember,
  requireWorkspaceRole,
  unauthorizedResponse,
  workspaceRequiredResponse,
} from '@/lib/auth/guard';
import { resolveWorkspaceId } from '@/lib/workspaces/resolve';
import { getUsageStats, getUsageSummary } from '@/lib/meta/usage-tracker';
import { withErrorHandler } from "@/lib/api/with-error-handler";

const statsSchema = z.object({
  workspaceId: z.string().min(1), // allow slug or uuid, resolve later
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const summarySchema = z.object({
  workspaceId: z.string().min(1),
});

export const runtime = 'nodejs';

/**
 * GET /api/meta/whatsapp/analytics/stats
 * Get detailed usage statistics for date range
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const { searchParams } = new URL(req.url);
  const workspaceIdOrSlug = getWorkspaceId(req, undefined, searchParams.get('workspaceId') ?? undefined);
  const startDate = searchParams.get('startDate') ?? undefined;
  const endDate = searchParams.get('endDate') ?? undefined;

  if (!workspaceIdOrSlug) {
    return workspaceRequiredResponse(withCookies);
  }

  // Validate params
  const parsed = statsSchema.safeParse({ workspaceId: workspaceIdOrSlug, startDate, endDate });
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: 'bad_request', reason: 'invalid_params', issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  // Resolve workspace (supports slug or UUID)
  const resolvedWorkspaceId = await resolveWorkspaceId(supabase, parsed.data.workspaceId);

  if (!resolvedWorkspaceId) {
    return withCookies(
      NextResponse.json(
        { error: 'workspace_not_found' },
        { status: 404 }
      )
    );
  }

  const membership = await requireWorkspaceMember(userData.user.id, resolvedWorkspaceId);
  if (!membership.ok || !requireWorkspaceRole(membership.role, ['owner', 'admin', 'member'])) {
    return forbiddenResponse(withCookies);
  }

  // Fetch stats
  const result = await getUsageStats({
    workspaceId: resolvedWorkspaceId,
    startDate,
    endDate,
  });

  if (!result.ok) {
    return withCookies(
      NextResponse.json(
        { error: 'fetch_failed', reason: result.error },
        { status: 500 }
      )
    );
  }

  return withCookies(NextResponse.json({ stats: result.stats ?? [] }));
});

/**
 * POST /api/meta/whatsapp/analytics/summary
 * Get real-time usage summary (today, last 7 days, last 30 days)
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const body = await req.json().catch(() => null);
  const parsed = summarySchema.safeParse(body);

  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: 'bad_request', reason: 'invalid_payload', issues: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const resolvedWorkspaceId = await resolveWorkspaceId(supabase, parsed.data.workspaceId);

  if (!resolvedWorkspaceId) {
    return withCookies(
      NextResponse.json(
        { error: 'workspace_not_found' },
        { status: 404 }
      )
    );
  }

  const membership = await requireWorkspaceMember(userData.user.id, resolvedWorkspaceId);
  
  if (!membership.ok || !requireWorkspaceRole(membership.role, ['owner', 'admin', 'member'])) {
    return forbiddenResponse(withCookies);
  }

  // Fetch summary
  const result = await getUsageSummary(resolvedWorkspaceId);

  if (!result.ok) {
    return withCookies(
      NextResponse.json(
        { error: 'fetch_failed', reason: result.error },
        { status: 500 }
      )
    );
  }

  return withCookies(NextResponse.json(result.summary));
});
