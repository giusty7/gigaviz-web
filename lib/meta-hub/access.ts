import { canAccess, type PlanId } from "@/lib/entitlements";

export type MetaHubAccess = {
  metaHub: boolean;
  templates: boolean;
  send: boolean;
  webhooks: boolean;
};

type MetaHubAccessInput = {
  planId: PlanId;
  isAdmin?: boolean | null;
  effectiveEntitlements?: string[] | null;
};

export type MetaHubSetup = {
  whatsappConfigured: boolean;
  templatesSynced: boolean;
  webhooksConfigured: boolean;
};

export function getMetaHubAccess({
  planId,
  isAdmin,
  effectiveEntitlements,
}: MetaHubAccessInput): MetaHubAccess {
  const ctx = {
    plan_id: planId,
    is_admin: isAdmin ?? false,
    effectiveEntitlements,
  };
  return {
    metaHub: canAccess(ctx, "meta_hub"),
    templates: canAccess(ctx, "meta_templates"),
    send: canAccess(ctx, "meta_send"),
    webhooks: canAccess(ctx, "meta_webhooks"),
  };
}
