import { AuthApiError, type SupabaseClient } from "@supabase/supabase-js";

const REFRESH_ERRORS = ["Refresh Token Not Found", "Invalid Refresh Token"];

export function isRefreshTokenError(err: unknown) {
  if (!err) return false;
  const message = err instanceof Error ? err.message : "";
  return REFRESH_ERRORS.some((needle) => message.includes(needle));
}

export async function getSafeUser<T>(supabase: SupabaseClient<T>) {
  const { data, error } = await supabase.auth.getUser();
  if (!error) return { user: data.user, error: null } as const;

  if (error instanceof AuthApiError && isRefreshTokenError(error)) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore sign out errors during cleanup
    }
    return { user: null, error: null } as const;
  }

  return { user: null, error } as const;
}
