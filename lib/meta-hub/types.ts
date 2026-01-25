export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'not_configured';
export type WebhookStatus = 'active' | 'inactive' | 'not_configured' | 'error';

// Multi-connector status types
export type WhatsAppConnectorStatus = 'connected' | 'partial' | 'none';
export type MetaPortfolioStatus = 'linked' | 'none';
export type FutureConnectorStatus = 'soon';

export type ConnectorStatuses = {
  whatsapp: WhatsAppConnectorStatus;
  metaPortfolio: MetaPortfolioStatus;
  instagram: FutureConnectorStatus;
  messenger: FutureConnectorStatus;
};

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
  // New connector model
  connectors: ConnectorStatuses;
};

export type RealtimeConnectionState = 'CONNECTING' | 'SUBSCRIBED' | 'CLOSED' | 'ERROR';
