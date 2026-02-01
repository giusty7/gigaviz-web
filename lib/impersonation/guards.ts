import "server-only";
import type { ImpersonationContext } from "@/lib/impersonation/context";

/**
 * Check if action is blocked during impersonation
 */
export function isBlockedDuringImpersonation(
  action: string,
  impersonation: ImpersonationContext
): boolean {
  if (!impersonation.isImpersonating) return false;

  const blockedActions = [
    // Billing
    "subscription_change",
    "payment_method_add",
    "payment_method_update",
    "payment_method_delete",
    "invoice_download",

    // Ownership
    "workspace_transfer",
    "workspace_delete",
    "workspace_leave",

    // Platform admin
    "platform_admin_grant",
    "platform_admin_revoke",

    // Sensitive workspace settings
    "workspace_api_key_regenerate",
    "workspace_webhook_secret_regenerate",
  ];

  return blockedActions.includes(action);
}

/**
 * Assert action is not blocked during impersonation
 * Throws error if blocked
 */
export function assertNotBlocked(
  action: string,
  impersonation: ImpersonationContext
) {
  if (isBlockedDuringImpersonation(action, impersonation)) {
    throw new Error(
      `Action "${action}" is disabled during impersonation for security reasons`
    );
  }
}
