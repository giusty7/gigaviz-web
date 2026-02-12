/**
 * Worker Health Check API
 * GET /api/health/workers
 * 
 * Monitors the health of background workers (outbox, jobs, etc.)
 * Returns status, last run times, and queue depths
 */

import { logger } from "@/lib/logging";
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type WorkerHealth = {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  lastRunAt?: string;
  queueDepth?: number;
  details?: Record<string, unknown>;
};

export const GET = withErrorHandler(async () => {
  try {
    // Create service role client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const health: WorkerHealth[] = [];
    const now = new Date();

    // Check Outbox Worker
    const { data: outboxStats, error: outboxError } = await supabase
      .from('outbox_messages')
      .select('status, created_at, retry_count')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!outboxError && outboxStats) {
      const pendingCount = outboxStats.filter(m => m.status === 'pending' || m.status === 'retrying').length;
      const oldestPending = outboxStats.find(m => m.status === 'pending' || m.status === 'retrying');
      const minutesOld = oldestPending 
        ? (now.getTime() - new Date(oldestPending.created_at).getTime()) / 60000 
        : 0;

      let status: WorkerHealth['status'] = 'healthy';
      if (pendingCount > 50 || minutesOld > 30) status = 'warning';
      if (pendingCount > 100 || minutesOld > 60) status = 'critical';

      health.push({
        name: 'outbox_worker',
        status,
        queueDepth: pendingCount,
        details: {
          total_messages: outboxStats.length,
          oldest_pending_minutes: Math.round(minutesOld),
          failed_count: outboxStats.filter(m => m.status === 'failed').length,
        },
      });
    }

    // Check Send Jobs Worker
    const { data: jobStats, error: jobError } = await supabase
      .from('wa_send_jobs')
      .select('status, created_at, items_total, items_sent, items_failed')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!jobError && jobStats) {
      const processingCount = jobStats.filter(j => j.status === 'processing').length;
      const stuckJobs = jobStats.filter(j => {
        if (j.status !== 'processing') return false;
        const minutesOld = (now.getTime() - new Date(j.created_at).getTime()) / 60000;
        return minutesOld > 60;
      });

      let status: WorkerHealth['status'] = 'healthy';
      if (processingCount > 10 || stuckJobs.length > 0) status = 'warning';
      if (processingCount > 20 || stuckJobs.length > 3) status = 'critical';

      health.push({
        name: 'send_jobs_worker',
        status,
        queueDepth: processingCount,
        details: {
          processing_jobs: processingCount,
          stuck_jobs: stuckJobs.length,
          completed_jobs: jobStats.filter(j => j.status === 'completed').length,
          failed_jobs: jobStats.filter(j => j.status === 'failed').length,
        },
      });
    }

    // Check Automation Engine (recent executions)
    const { data: automationStats, error: automationError } = await supabase
      .from('automation_executions')
      .select('status, executed_at')
      .gte('executed_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .order('executed_at', { ascending: false })
      .limit(100);

    if (!automationError && automationStats) {
      const failedCount = automationStats.filter(a => a.status === 'failed').length;
      const totalCount = automationStats.length;
      const failureRate = totalCount > 0 ? (failedCount / totalCount) * 100 : 0;

      let status: WorkerHealth['status'] = 'healthy';
      if (failureRate > 20) status = 'warning';
      if (failureRate > 50) status = 'critical';

      health.push({
        name: 'automation_engine',
        status,
        details: {
          executions_24h: totalCount,
          failed_executions: failedCount,
          failure_rate_percent: Math.round(failureRate * 10) / 10,
        },
      });
    }

    // Check Analytics Refresh (last materialized view refresh)
    const { data: refreshStats } = await supabase
      .from('usage_stats_daily')
      .select('event_date')
      .order('event_date', { ascending: false })
      .limit(1);

    if (refreshStats && refreshStats.length > 0) {
      const lastRefreshDate = new Date(refreshStats[0].event_date);
      const daysOld = (now.getTime() - lastRefreshDate.getTime()) / (24 * 60 * 60 * 1000);

      let status: WorkerHealth['status'] = 'healthy';
      if (daysOld > 2) status = 'warning';
      if (daysOld > 7) status = 'critical';

      health.push({
        name: 'analytics_refresh',
        status,
        details: {
          last_refresh_date: refreshStats[0].event_date,
          days_old: Math.round(daysOld * 10) / 10,
        },
      });
    }

    // Overall status
    const overallStatus = health.some(h => h.status === 'critical')
      ? 'critical'
      : health.some(h => h.status === 'warning')
      ? 'warning'
      : 'healthy';

    return NextResponse.json({
      status: overallStatus,
      timestamp: now.toISOString(),
      workers: health,
    });

  } catch (error) {
    logger.error('[Health Check] Unexpected error:', error);
    return NextResponse.json(
      {
        status: 'critical',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
});
