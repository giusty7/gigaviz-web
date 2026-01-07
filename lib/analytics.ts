type AnalyticsParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;

  window.gtag("event", eventName, params);
}

export function trackCta(label: string, location: string, href?: string) {
  track("cta_click", {
    cta_label: label,
    cta_location: location,
    href,
  });
}

export function trackDownload(asset: string, location: string) {
  track("asset_download", {
    asset_name: asset,
    location,
  });
}
