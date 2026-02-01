import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import { getImpersonationContext } from "@/lib/impersonation/context";
import { getAppContextImpersonated } from "@/lib/app-context";
import ImpersonationBanner from "@/components/app/ImpersonationBanner";

export const dynamic = "force-dynamic";

export default async function AppRootLayout({ children }: { children: ReactNode }) {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  // Check for active impersonation (cookie-based)
  const impersonation = await getImpersonationContext();

  // If impersonating, build context as target user via service role
  if (impersonation.isImpersonating && impersonation.impersonationId) {
    const ctx = await getAppContextImpersonated(
      impersonation.impersonationId,
      impersonation.workspaceSlug
    );

    if (!ctx.user || !ctx.currentWorkspace) {
      redirect("/login");
    }

    return (
      <>
        <ImpersonationBanner
          actorEmail={impersonation.actorEmail!}
          targetEmail={impersonation.targetEmail!}
          workspaceSlug={impersonation.workspaceSlug!}
          expiresAt={impersonation.expiresAt!}
          impersonationId={impersonation.impersonationId!}
        />
        {children}
      </>
    );
  }

  // Fallback: normal user context already enforced by protected layout
  return <>{children}</>;
}

