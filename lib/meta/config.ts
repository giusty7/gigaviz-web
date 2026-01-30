/**
 * Meta Graph API Configuration
 * Centralized config for Instagram, Messenger, WhatsApp, and Ads
 */

export const META_CONFIG = {
  /**
   * Graph API Version
   * Used across all Meta services (Instagram DM, Messenger, WhatsApp, Ads)
   */
  GRAPH_VERSION: process.env.META_GRAPH_VERSION || process.env.META_GRAPH_API_VERSION || 'v21.0',

  /**
   * Graph API Base URL
   */
  GRAPH_API_URL: 'https://graph.facebook.com',

  /**
   * Get full Graph API URL for a specific endpoint
   */
  getGraphUrl: (endpoint: string) => {
    const version = META_CONFIG.GRAPH_VERSION;
    const base = META_CONFIG.GRAPH_API_URL;
    return `${base}/${version}${endpoint}`;
  },

  /**
   * Worker Configuration
   */
  WORKER: {
    BATCH_SIZE: Number(process.env.WORKER_BATCH_SIZE) || 20,
    MAX_ATTEMPTS: Number(process.env.WORKER_MAX_ATTEMPTS) || 5,
    POLL_INTERVAL_MS: Number(process.env.WORKER_POLL_INTERVAL_MS) || 2000,
  },

  /**
   * Rate Limiting
   */
  RATE_LIMIT: {
    CAP_PER_MIN: Number(process.env.RATE_CAP_PER_MIN) || 20,
    DELAY_MIN_MS: Number(process.env.RATE_DELAY_MIN_MS) || 800,
    DELAY_MAX_MS: Number(process.env.RATE_DELAY_MAX_MS) || 2200,
  },
} as const;

export type MetaConfig = typeof META_CONFIG;
