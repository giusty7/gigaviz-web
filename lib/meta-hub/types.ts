export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'not_configured';
export type WebhookStatus = 'active' | 'inactive' | 'not_configured' | 'error';

export type MetaIntegrationStatus = {
  workspace_id: string;
  whatsapp: {
    status: IntegrationStatus;
    displayName: string | null;
    phoneId: string | null;
    wabaId: string | null;
    lastUpdated: string | null;
  };
  facebook: {
    status: IntegrationStatus;
    displayName: string | null;
    lastUpdated: string | null;
  };
  webhooks: {
    status: WebhookStatus;
    lastEventAt: string | null;
    events24h: number;
  };
  hasAccessToken: boolean;
  tokenLastUpdated: string | null;
  computedAt: string;
};

export type RealtimeConnectionState = 'CONNECTING' | 'SUBSCRIBED' | 'CLOSED' | 'ERROR';
