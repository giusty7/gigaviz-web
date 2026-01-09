const toBool = (value: string | undefined, fallback = false) =>
  (value ?? "").toLowerCase() === "true" ? true : fallback;

export type MetaHubFlags = {
  waEnabled: boolean;
  igEnabled: boolean;
  msEnabled: boolean;
  adsEnabled: boolean;
  insightsEnabled: boolean;
};

export function getMetaHubFlags(): MetaHubFlags {
  return {
    waEnabled: toBool(process.env.META_HUB_WA_ENABLED, true),
    igEnabled: toBool(process.env.META_HUB_IG_ENABLED, false),
    msEnabled: toBool(process.env.META_HUB_MS_ENABLED, false),
    adsEnabled: toBool(process.env.META_HUB_ADS_ENABLED, false),
    insightsEnabled: toBool(process.env.META_HUB_INSIGHTS_ENABLED, false),
  };
}
