/**
 * Analytics Export API
 * GET /api/meta/whatsapp/analytics/export?workspaceId=...&startDate=...&endDate=...&format=csv
 */

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
import { getUsageStats } from '@/lib/meta/usage-tracker';
import { resolveWorkspaceId } from '@/lib/workspaces/resolve';

const exportSchema = z.object({
  workspaceId: z.string().min(1), // allow slug or uuid
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  format: z.enum(['csv', 'json']).default('csv'),
});

export const runtime = 'nodejs';

/**
 * GET /api/meta/whatsapp/analytics/export
 * Export analytics data as CSV or JSON
 */
export async function GET(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = getWorkspaceId(req, undefined, searchParams.get('workspaceId') ?? undefined);
  const startDate = searchParams.get('startDate') ?? undefined;
  const endDate = searchParams.get('endDate') ?? undefined;
  const format = searchParams.get('format') ?? 'csv';

  if (!workspaceId) {
    return workspaceRequiredResponse(withCookies);
  }

  // Validate params
  const parsed = exportSchema.safeParse({ workspaceId, startDate, endDate, format });
  if (!parsed.success) {
    return withCookies(
      NextResponse.json(
        { error: 'bad_request', reason: 'invalid_params', issues: parsed.error.flatten() },
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

  // Fetch stats
  const result = await getUsageStats({
    workspaceId: resolvedWorkspaceId,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
  });

  if (!result.ok) {
    return withCookies(
      NextResponse.json(
        { error: 'fetch_failed', reason: result.error },
        { status: 500 }
      )
    );
  }

  const stats = result.stats ?? [];

  // Aggregate stats by date (sum across event types)
  const aggregatedByDate = stats.reduce((acc, stat) => {
    const date = stat.event_date;
    if (!acc[date]) {
      acc[date] = {
        date,
        messages_received: 0,
        messages_sent: 0,
        templates_sent: 0,
        contacts_added: 0,
        tags_applied: 0,
        automations_executed: 0,
      };
    }

    // Map event types to aggregated fields
    switch (stat.event_type) {
      case 'message_sent':
        acc[date].messages_sent += stat.event_count;
        break;
      case 'template_sent':
        acc[date].templates_sent += stat.event_count;
        break;
      case 'tag_added':
        acc[date].tags_applied += stat.event_count;
        break;
      case 'automation_triggered':
        acc[date].automations_executed += stat.event_count;
        break;
      case 'note_created':
      case 'status_changed':
        // These don't map to export columns, skip
        break;
    }

    return acc;
  }, {} as Record<string, {
    date: string;
    messages_received: number;
    messages_sent: number;
    templates_sent: number;
    contacts_added: number;
    tags_applied: number;
    automations_executed: number;
  }>);

  const aggregatedStats = Object.values(aggregatedByDate).sort((a, b) => 
    b.date.localeCompare(a.date) // Descending order
  );

  // Generate export based on format
  if (parsed.data.format === 'csv') {
    // Generate CSV
    const headers = [
      'Date',
      'Messages Received',
      'Messages Sent',
      'Templates Sent',
      'Contacts Added',
      'Tags Applied',
      'Automations Executed',
    ];

    const rows = aggregatedStats.map(stat => [
      stat.date,
      stat.messages_received.toString(),
      stat.messages_sent.toString(),
      stat.templates_sent.toString(),
      stat.contacts_added.toString(),
      stat.tags_applied.toString(),
      stat.automations_executed.toString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const filename = `meta-hub-analytics-${startDate || 'all'}-to-${endDate || 'now'}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } else {
    // JSON format
    const filename = `meta-hub-analytics-${startDate || 'all'}-to-${endDate || 'now'}.json`;

    return withCookies(NextResponse.json(
      { stats: aggregatedStats },
      {
        headers: {
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      }
    ));
  }
}
