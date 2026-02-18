import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { MetaIntegrationStatus, IntegrationStatus, WebhookStatus, WhatsAppConnectorStatus, MetaPortfolioStatus } from "./types";

export async function getMetaHubStatus(workspaceId: string): Promise<MetaIntegrationStatus> {
  const supabase = supabaseAdmin();
  
  // Use admin client to bypass RLS - workspace_id is already validated by caller
  // This ensures consistent data source with WhatsApp Business Account card
  
  // Check WhatsApp connections from wa_phone_numbers (SAME source as WhatsApp Business Account card)
  const { data: waConnection } = await supabase
    .from('wa_phone_numbers')
    .select('phone_number_id, waba_id, display_name, status, updated_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Check Meta tokens
  const { data: metaToken } = await supabase
    .from('meta_tokens')
    .select('id, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('provider', 'meta_whatsapp')
    .limit(1)
    .maybeSingle();

  // Check recent webhook events (last 24h)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: events24h } = await supabase
    .from('meta_events_log')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('received_at', twentyFourHoursAgo);

  const { data: lastEvent } = await supabase
    .from('meta_events_log')
    .select('received_at')
    .eq('workspace_id', workspaceId)
    .order('received_at', { ascending: false })
    .limit(1)
    .single();

  // Determine statuses
  const whatsappStatus: IntegrationStatus = (waConnection?.phone_number_id && metaToken?.id) ? 'connected' : 'disconnected';
  
  let webhookStatus: WebhookStatus = 'not_configured';
  if ((events24h ?? 0) > 0) {
    webhookStatus = 'active';
  } else if (lastEvent?.received_at) {
    webhookStatus = 'inactive';
  }

  // Derive WhatsApp connector status using two-tier logic
  // Tier 1 (Configuration): Check if both token AND phone_number_id are present
  // Tier 2 (Health): Check verification status without downgrading base status
  const hasToken = !!metaToken?.id;
  const hasPhoneId = !!waConnection?.phone_number_id;
  const hasRecord = !!waConnection || !!metaToken?.id;
  
  let whatsappConnectorStatus: WhatsAppConnectorStatus = 'none';
  let whatsappConnectorHealth: 'ok' | 'needs_attention' | undefined;
  
  if (!hasRecord) {
    whatsappConnectorStatus = 'none';
  } else if (hasToken && hasPhoneId) {
    whatsappConnectorStatus = 'connected';
    // Tier 2: Check health (future: check is_valid/last_verified_at)
    whatsappConnectorHealth = 'ok';
  } else {
    // Missing either token or phone_number_id
    whatsappConnectorStatus = 'partial';
  }

  // Derive Meta Portfolio status
  const metaPortfolioStatus: MetaPortfolioStatus = metaToken?.id ? 'linked' : 'none';

  // Check Instagram connection status from instagram_accounts
  const { data: igAccount } = await supabase
    .from('instagram_accounts')
    .select('id, status')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  // Check Messenger connection status from messenger_pages
  const { data: msPage } = await supabase
    .from('messenger_pages')
    .select('id, status')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  // Derive Instagram / Messenger connector status
  const igStatus: import('./types').FutureConnectorStatus = igAccount ? 'connected' : 'available';
  const msStatus: import('./types').FutureConnectorStatus = msPage ? 'connected' : 'available';

  return {
    workspace_id: workspaceId,
    whatsapp: {
      status: whatsappStatus,
      displayName: waConnection?.display_name ?? null,
      phoneId: waConnection?.phone_number_id ?? null,
      wabaId: waConnection?.waba_id ?? null,
      lastUpdated: waConnection?.updated_at ?? null,
    },
    facebook: {
      status: 'disconnected' as IntegrationStatus,
      displayName: null,
      lastUpdated: null,
    },
    webhooks: {
      status: webhookStatus,
      lastEventAt: lastEvent?.received_at ?? null,
      events24h: events24h ?? 0,
    },
    hasAccessToken: !!metaToken?.id,
    tokenLastUpdated: metaToken?.updated_at ?? null,
    computedAt: new Date().toISOString(),
    connectors: {
      whatsapp: whatsappConnectorStatus,
      whatsappHealth: whatsappConnectorHealth,
      metaPortfolio: metaPortfolioStatus,
      instagram: igStatus,
      messenger: msStatus,
    },
  };
}
