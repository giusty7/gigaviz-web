/**
 * Cron Job: Refresh Analytics Materialized Views
 * 
 * Refreshes the usage_stats_daily materialized view
 * Should run once per hour via Vercel Cron
 */

import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (REQUIRED in production)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

    if (!cronSecret) {
      logger.error('[Cron] CRON_SECRET not configured - blocking request');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.error('[Cron] Unauthorized request to materialized view refresh');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create service role client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    logger.info('[Cron] Starting materialized view refresh...');
    const startTime = Date.now();

    // Refresh the materialized view
    const { error } = await supabase.rpc('refresh_usage_stats_daily');

    if (error) {
      logger.error('[Cron] Failed to refresh materialized view:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    logger.info(`[Cron] Materialized view refreshed successfully in ${duration}ms`);

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      message: 'Materialized view usage_stats_daily refreshed successfully',
    });

  } catch (error) {
    logger.error('[Cron] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
