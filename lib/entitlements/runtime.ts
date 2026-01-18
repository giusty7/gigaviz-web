export type RuntimePayload = {
  plan?: string;
  limits?: Record<string, number>;
  features?: Record<string, boolean | string | number | string[]>;
};

type EntitlementEntry =
  | { enabled?: boolean | null }
  | boolean
  | null
  | undefined;

type EntitlementsInput =
  | Record<string, EntitlementEntry>
  | Array<{ key: string; enabled?: boolean | null }>
  | null
  | undefined;

export function hasEntitlement(entitlements: EntitlementsInput, key: string): boolean {
  if (!entitlements) return false;
  if (Array.isArray(entitlements)) {
    const match = entitlements.find((entry) => entry?.key === key);
    return Boolean(match?.enabled);
  }

  const entry = entitlements[key];
  if (typeof entry === "boolean") return entry;
  if (entry && typeof entry === "object" && "enabled" in entry) {
    return Boolean(entry.enabled);
  }
  return false;
}

export function getPlan(payload: RuntimePayload | null | undefined): string {
  const plan = payload?.plan;
  return typeof plan === "string" && plan.length > 0 ? plan : "free";
}

export function getLimit(
  payload: RuntimePayload | null | undefined,
  name: string,
  defaultValue: number
): number {
  const value = payload?.limits?.[name];
  return typeof value === "number" && Number.isFinite(value) ? value : defaultValue;
}

export function hasFeature(
  payload: RuntimePayload | null | undefined,
  name: string,
  defaultValue = false
): boolean {
  const value = payload?.features?.[name];
  if (value === undefined) return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value > 0 : defaultValue;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return defaultValue;
}
