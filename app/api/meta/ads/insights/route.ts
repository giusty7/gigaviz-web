// Meta Ads Insights API
// GET /api/meta/ads/insights - Get ad campaign insights

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';

export async function GET(request: NextRequest) {
  try {
    const { supabase, withCookies } = createSupabaseRouteClient(request);
    const { searchParams } = new URL(request.url);

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return withCookies(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const workspaceId = searchParams.get('workspace_id');
    const dateRange = searchParams.get('date_range') || 'last_7_days';

    if (!workspaceId) {
      return withCookies(NextResponse.json(
        { error: 'workspace_id required' },
        { status: 400 }
      ));
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'yesterday':
        startDate = new Date(now.setDate(now.getDate() - 1));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last_7_days':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'last_30_days':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    // Get campaign insights aggregated
    const { data: insights, error } = await supabase
      .from('meta_ad_insights')
      .select(
        `
        *,
        meta_ad_campaigns!inner(campaign_id, campaign_name, status)
      `
      )
      .eq('workspace_id', workspaceId)
      .gte('date_start', startDate.toISOString());

    if (error) throw error;

    // Aggregate by campaign
    const campaignMap = new Map<string, {
      campaign_id: string;
      campaign_name: string;
      status: string;
      impressions: number;
      clicks: number;
      spend: number;
      reach: number;
      conversions: number;
    }>();
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;

    insights?.forEach((insight) => {
      const campaignId = insight.campaign_id;
      const campaign = insight.meta_ad_campaigns as { campaign_id: string; campaign_name: string; status: string };

      if (!campaignMap.has(campaignId)) {
        campaignMap.set(campaignId, {
          campaign_id: campaign.campaign_id,
          campaign_name: campaign.campaign_name,
          status: campaign.status,
          impressions: 0,
          clicks: 0,
          spend: 0,
          reach: 0,
          conversions: 0,
        });
      }

      const agg = campaignMap.get(campaignId);
      if (agg) {
        agg.impressions += insight.impressions || 0;
        agg.clicks += insight.clicks || 0;
        agg.spend += insight.spend || 0;
        agg.reach += insight.reach || 0;
        agg.conversions += insight.conversions || 0;
      }

      totalSpend += insight.spend || 0;
      totalImpressions += insight.impressions || 0;
      totalClicks += insight.clicks || 0;
      totalConversions += insight.conversions || 0;
    });

    // Calculate derived metrics
    const campaigns = Array.from(campaignMap.values()).map((c) => ({
      ...c,
      ctr: c.impressions > 0 ? c.clicks / c.impressions : 0,
      cpc: c.clicks > 0 ? c.spend / c.clicks : 0,
    }));

    const summary = {
      total_spend: totalSpend,
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      total_conversions: totalConversions,
      avg_ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
      avg_cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
    };

    return withCookies(NextResponse.json({
      campaigns,
      summary,
    }));
  } catch (error) {
    console.error('[Meta Ads] Error fetching insights:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(NextResponse.json(
      { error: message },
      { status: 500 }
    ));
  }
}
