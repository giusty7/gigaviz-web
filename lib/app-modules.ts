import { topLevelModules, type ModuleStatus } from "@/lib/modules/catalog";
import type { FeatureKey } from "@/lib/entitlements";

export type ModuleAvailability = "available" | "coming_soon";

export type AppModule = {
  key: string;
  slug: string;
  name: string;
  description: string;
  availability: ModuleAvailability;
  feature?: FeatureKey;
  lockedTitle?: string;
  lockedDescription?: string;
  summary?: string;
  note?: string;
  status?: ModuleStatus;
};

function availabilityFromStatus(status: ModuleStatus): ModuleAvailability {
  return status === "coming" ? "coming_soon" : "available";
}

export const appModules: AppModule[] = topLevelModules.map((module) => ({
  key: module.key,
  slug: module.slug,
  name: module.name,
  description: module.short || module.description,
  availability: availabilityFromStatus(module.status),
  feature: module.requiresEntitlement,
  lockedTitle: `${module.name} is locked`,
  lockedDescription: "Upgrade your plan to unlock this module.",
  summary: module.description,
  note: module.status === "beta" ? "Beta status: subject to change." : undefined,
  status: module.status,
}));

export function getAppModule(slug: string) {
  return appModules.find((module) => module.slug === slug);
}
