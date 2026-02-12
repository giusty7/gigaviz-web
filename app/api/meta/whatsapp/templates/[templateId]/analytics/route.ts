/**
 * Template Performance Analytics API
 * GET /api/meta/whatsapp/templates/[templateId]/analytics
 * 
 * Returns performance metrics for a specific template
 */

import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) => {
  try {
    const { supabase } = createSupabaseRouteClient(request);
    const { templateId } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Auth check
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify workspace access
    const { data: membership } = await supabase
      .from('workspace_memberships')
      .select('workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userData.user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      );
    }

    // Get template info
    const { data: template } = await supabase
      .from('wa_templates')
      .select('*')
      .eq('id', templateId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Get send logs for this template
    const { data: sendLogs } = await supabase
      .from('wa_send_logs')
      .select('*')
      .eq('template_id', templateId)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    const totalSent = sendLogs?.length || 0;
    const delivered = sendLogs?.filter(log => log.status === 'delivered').length || 0;
    const failed = sendLogs?.filter(log => log.status === 'failed').length || 0;
    const pending = sendLogs?.filter(log => log.status === 'pending' || log.status === 'sent').length || 0;

    // Get jobs using this template
    const { data: jobs } = await supabase
      .from('wa_send_jobs')
      .select('*')
      .eq('template_id', templateId)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    const totalJobs = jobs?.length || 0;
    const completedJobs = jobs?.filter(job => job.status === 'completed').length || 0;
    const failedJobs = jobs?.filter(job => job.status === 'failed').length || 0;

    // Calculate metrics
    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
    const failureRate = totalSent > 0 ? (failed / totalSent) * 100 : 0;

    // Group by date for trend analysis
    const sendsByDate: Record<string, number> = {};
    sendLogs?.forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      sendsByDate[date] = (sendsByDate[date] || 0) + 1;
    });

    const trend = Object.entries(sendsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        category: template.category,
        language: template.language,
      },
      metrics: {
        total_sent: totalSent,
        delivered,
        failed,
        pending,
        delivery_rate: Math.round(deliveryRate * 10) / 10,
        failure_rate: Math.round(failureRate * 10) / 10,
      },
      jobs: {
        total: totalJobs,
        completed: completedJobs,
        failed: failedJobs,
      },
      trend,
    });

  } catch (error) {
    logger.error('[Template Analytics] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
