// Meta Ads Sync API
// POST /api/meta/ads/sync - Sync campaigns from Meta Marketing API

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { resolveWorkspaceId } from '@/lib/workspaces/resolve';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { recordAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logging';
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { z } from "zod";

const adsSyncSchema = z.object({
  workspace_id: z.string().min(1, "workspace_id is required"),
  date_range: z.enum(["today", "yesterday", "last_7_days", "last_30_days", "last_90_days"]).default("last_7_days"),
});

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0';

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time: string;
  updated_time: string;
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    const { supabase, withCookies } = createSupabaseRouteClient(request);

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return withCookies(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const body = await request.json();
    const parsed = adsSyncSchema.safeParse(body);
    if (!parsed.success) {
      return withCookies(NextResponse.json(
        { error: 'workspace_id required', fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      ));
    }
    const { workspace_id: workspaceIdOrSlug, date_range } = parsed.data;

    const workspaceId = await resolveWorkspaceId(supabase, workspaceIdOrSlug);
    if (!workspaceId) {
      return withCookies(NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      ));
    }

    // Verify admin access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return withCookies(NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ));
    }

    // Get Meta token
    const db = supabaseAdmin();
    const { data: tokenRow } = await db
      .from('meta_tokens')
      .select('access_token_encrypted, ad_account_id')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'meta_ads')
      .maybeSingle();

    if (!tokenRow?.access_token_encrypted || !tokenRow?.ad_account_id) {
      return withCookies(NextResponse.json({
        synced: false,
        campaigns_count: 0,
        message: 'No Meta Ads account connected. Connect your account first.',
      }));
    }

    // Decrypt token (simplified - in production use proper encryption)
    const accessToken = tokenRow.access_token_encrypted;
    const adAccountId = tokenRow.ad_account_id;

    // Calculate date range
    const now = new Date();
    let sinceDays = 7;
    switch (date_range) {
      case 'today': sinceDays = 0; break;
      case 'yesterday': sinceDays = 1; break;
      case 'last_7_days': sinceDays = 7; break;
      case 'last_30_days': sinceDays = 30; break;
      case 'last_90_days': sinceDays = 90; break;
    }

    const sinceDate = new Date(now.getTime() - sinceDays * 24 * 60 * 60 * 1000);
    const since = sinceDate.toISOString().split('T')[0];
    const until = now.toISOString().split('T')[0];

    // Fetch campaigns from Meta
    const campaignsUrl = `${META_GRAPH_URL}/act_${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time&access_token=${accessToken}`;
    
    const campaignsRes = await fetch(campaignsUrl);
    const campaignsData = await campaignsRes.json();

    if (campaignsData.error) {
      logger.error('[Meta Ads] API error fetching campaigns:', { error: campaignsData.error });
      return withCookies(NextResponse.json(
        { error: campaignsData.error.message || 'Meta API error' },
        { status: 500 }
      ));
    }

    const campaigns: MetaCampaign[] = campaignsData.data || [];
    let syncedCampaigns = 0;
    let syncedInsights = 0;

    // Upsert campaigns
    for (const campaign of campaigns) {
      const { error } = await db
        .from('meta_ad_campaigns')
        .upsert({
          workspace_id: workspaceId,
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          daily_budget_cents: campaign.daily_budget ? parseInt(campaign.daily_budget) : null,
          lifetime_budget_cents: campaign.lifetime_budget ? parseInt(campaign.lifetime_budget) : null,
          synced_at: new Date().toISOString(),
        }, {
          onConflict: 'workspace_id,campaign_id',
        });

      if (!error) syncedCampaigns++;
    }

    // Fetch insights for each campaign
    for (const campaign of campaigns) {
      const insightsUrl = `${META_GRAPH_URL}/${campaign.id}/insights?fields=impressions,clicks,spend,reach,ctr,cpc,actions&time_range={'since':'${since}','until':'${until}'}&access_token=${accessToken}`;
      
      try {
        const insightsRes = await fetch(insightsUrl);
        const insightsData = await insightsRes.json();

        if (insightsData.data?.[0]) {
          const insight = insightsData.data[0];
          
          // Extract conversions from actions
          const conversions = insight.actions?.find(
            (a: { action_type: string }) => a.action_type === 'lead' || a.action_type === 'purchase'
          )?.value || 0;

          const { error } = await db
            .from('meta_ad_insights')
            .upsert({
              workspace_id: workspaceId,
              campaign_id: campaign.id,
              date_start: since,
              date_end: until,
              impressions: parseInt(insight.impressions || '0'),
              clicks: parseInt(insight.clicks || '0'),
              spend_cents: Math.round(parseFloat(insight.spend || '0') * 100),
              reach: parseInt(insight.reach || '0'),
              ctr: parseFloat(insight.ctr || '0'),
              cpc_cents: Math.round(parseFloat(insight.cpc || '0') * 100),
              conversions: parseInt(conversions),
              synced_at: new Date().toISOString(),
            }, {
              onConflict: 'workspace_id,campaign_id,date_start,date_end',
            });

          if (!error) syncedInsights++;
        }
      } catch (insightError) {
        logger.warn('[Meta Ads] Error fetching insights for campaign:', {
          campaignId: campaign.id,
          error: insightError,
        });
      }
    }

    await recordAuditEvent({
      workspaceId,
      actorUserId: user.id,
      action: 'meta_ads_synced',
      meta: {
        campaigns_synced: syncedCampaigns,
        insights_synced: syncedInsights,
        date_range,
      },
    });

    logger.info('[Meta Ads] Sync completed:', {
      workspaceId,
      campaigns: syncedCampaigns,
      insights: syncedInsights,
    });

    return withCookies(NextResponse.json({
      synced: true,
      campaigns_count: syncedCampaigns,
      insights_count: syncedInsights,
      message: `Synced ${syncedCampaigns} campaigns and ${syncedInsights} insight records`,
    }));
  } catch (error) {
    logger.error('[Meta Ads] Sync error:', { error });
    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(NextResponse.json(
      { error: message },
      { status: 500 }
    ));
  }
});
