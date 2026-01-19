import { canAccess, getPlanFeatures, type PlanId } from "@/lib/entitlements";
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
  accessLabel?: string;
};

type BuildModuleRegistryInput = {
  workspaceSlug: string;
  planId: PlanId;
  isAdmin?: boolean | null;
  effectiveEntitlements?: string[] | null;
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
  effectiveEntitlements,
}: BuildModuleRegistryInput): ModuleRegistryItem[] {
  const planFeatures = getPlanFeatures(planId);
  return topLevelModules.map((module) => {
    const comingSoon = module.status === "coming";
    const canUse =
      !comingSoon &&
      (!module.requiresEntitlement ||
        canAccess(
          {
            plan_id: planId,
            is_admin: isAdmin,
            effectiveEntitlements,
          },
          module.requiresEntitlement
        ));
    const status: ModuleRegistryStatus = comingSoon
      ? "coming_soon"
      : canUse
        ? "available"
        : "locked";
    const requires = module.requiresEntitlement;
    const ownerGranted = requires
      ? Boolean(effectiveEntitlements?.includes(requires))
      : false;
    const includedInPlan = requires ? planFeatures.includes(requires) : false;
    const accessLabel =
      status === "available" && requires
        ? ownerGranted && !includedInPlan
          ? "Granted (owner)"
          : includedInPlan
            ? "Included in plan"
            : undefined
        : undefined;

    return {
      key: module.key,
      slug: module.slug,
      name: module.name,
      description: module.short || module.description,
      status,
      icon: module.icon,
      href: comingSoon ? undefined : resolveModuleHref(module, workspaceSlug),
      accessLabel,
    };
  });
}
