/**
 * Workspace Context Hook
 * 
 * Extracts workspace from URL pathname (client-side)
 * For pages inside /(app)/(protected)/[workspaceSlug]/* routes
 */

'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

interface WorkspaceData {
  workspace: {
    id: string; // Workspace slug (API routes handle slug→UUID resolution)
    slug: string;
    name: string; // Placeholder, real name needs server fetch
  };
  workspaceId: string; // Same as workspace.id (slug format)
  workspaceSlug: string;
}

export function useWorkspace(): WorkspaceData {
  const pathname = usePathname();

  const workspaceSlug = useMemo(() => {
    // Extract workspaceSlug from pathname
    // Pattern: /[workspaceSlug]/meta-hub/... or /[workspaceSlug]/dashboard
    const segments = pathname?.split('/').filter(Boolean) || [];
    
    // First segment after root should be workspaceSlug
    if (segments.length > 0) {
      return segments[0];
    }
    
    return 'demo'; // Fallback for edge cases
  }, [pathname]);

  return {
    workspace: {
      id: workspaceSlug, // Note: This is slug, not UUID. API routes should resolve by slug.
      slug: workspaceSlug,
      name: workspaceSlug, // Placeholder - real name would need server fetch
    },
    workspaceId: workspaceSlug, // Same as above
    workspaceSlug,
  };
}
