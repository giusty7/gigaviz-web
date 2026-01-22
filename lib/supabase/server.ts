import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Cookie mutations are only allowed in Route Handlers / Server Actions.
        // In RSC contexts Next.js throws; we catch and ignore since middleware
        // handles token refresh for page routes.
        try {
          cookiesToSet.forEach((cookie) => {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          });
        } catch {
          // Next.js forbids cookie mutations in RSC – best-effort no-op
        }
      },
    },
  });
}
