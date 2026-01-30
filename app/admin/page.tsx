import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * DEPRECATED: /admin route is legacy personal tool architecture
 * All admin routes now use workspace-based paths: /[workspaceSlug]/[product]/
 * 
 * Redirecting to dashboard where user can select their workspace
 */
export default async function AdminDeprecatedPage() {
  redirect("/dashboard");
}
