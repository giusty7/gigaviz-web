import { canAccess, type PlanId } from "@/lib/entitlements";
import { topLevelModules, type ModuleCatalogItem, type ModuleIcon } from "@/lib/modules/catalog";

export type ModuleRegistryStatus = "available" | "locked" | "coming_soon";

export type ModuleRegistryItem = {
  key: string;
  slug: string;
  name: string;
  description: string;
  status: ModuleRegistryStatus;
  icon: ModuleIcon;
  href?: string;
};

type BuildModuleRegistryInput = {
  workspaceSlug: string;
  planId: PlanId;
  isAdmin?: boolean | null;
};

function resolveModuleHref(module: ModuleCatalogItem, workspaceSlug: string) {
  if (module.hrefApp) {
    return module.hrefApp.replace("[workspaceSlug]", workspaceSlug);
  }
  return `/${workspaceSlug}/modules/${module.slug}`;
}

export function buildModuleRegistry({
  workspaceSlug,
  planId,
  isAdmin,
}: BuildModuleRegistryInput): ModuleRegistryItem[] {
  return topLevelModules.map((module) => {
    const comingSoon = module.status === "coming";
    const canUse =
      !comingSoon &&
      (!module.requiresEntitlement ||
        canAccess({ plan_id: planId, is_admin: isAdmin }, module.requiresEntitlement));
    const status: ModuleRegistryStatus = comingSoon
      ? "coming_soon"
      : canUse
        ? "available"
        : "locked";

    return {
      key: module.key,
      slug: module.slug,
      name: module.name,
      description: module.short || module.description,
      status,
      icon: module.icon,
      href: comingSoon ? undefined : resolveModuleHref(module, workspaceSlug),
    };
  });
}
