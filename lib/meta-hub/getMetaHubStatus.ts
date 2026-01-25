import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type { MetaIntegrationStatus, IntegrationStatus, WebhookStatus, WhatsAppConnectorStatus, MetaPortfolioStatus } from "./types";

export async function getMetaHubStatus(workspaceId: string): Promise<MetaIntegrationStatus> {
  const supabase = await supabaseServer();
  
  // Query directly from tables with RLS (server context has proper session)
  // Avoid RPC with auth.uid() which may not propagate correctly in server context
  
  // Check WhatsApp connections
  const { data: waConnection } = await supabase
    .from('meta_whatsapp_connections')
    .select('id, verified_name, phone_number_id, waba_id, updated_at')
    .eq('workspace_id', workspaceId)
    .limit(1)
    .single();

  // Check Meta tokens
  const { data: metaToken } = await supabase
    .from('meta_tokens')
    .select('id, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('provider', 'meta_whatsapp')
    .limit(1)
    .single();

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
  const whatsappStatus: IntegrationStatus = waConnection?.id ? 'connected' : 'disconnected';
  
  let webhookStatus: WebhookStatus = 'not_configured';
  if ((events24h ?? 0) > 0) {
    webhookStatus = 'active';
  } else if (lastEvent?.received_at) {
    webhookStatus = 'inactive';
  }

  // Derive WhatsApp connector status
  let whatsappConnectorStatus: WhatsAppConnectorStatus = 'none';
  if (waConnection?.id) {
    const hasToken = !!metaToken?.id;
    const hasPhoneId = !!waConnection.phone_number_id;
    
    if (hasToken && hasPhoneId) {
      whatsappConnectorStatus = 'connected';
    } else {
      whatsappConnectorStatus = 'partial';
    }
  }

  // Derive Meta Portfolio status
  const metaPortfolioStatus: MetaPortfolioStatus = metaToken?.id ? 'linked' : 'none';

  return {
    workspace_id: workspaceId,
    whatsapp: {
      status: whatsappStatus,
      displayName: waConnection?.verified_name ?? null,
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
      metaPortfolio: metaPortfolioStatus,
      instagram: 'soon',
      messenger: 'soon',
    },
  };
}
