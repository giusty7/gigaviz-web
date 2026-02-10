import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSafeUser } from "@/lib/supabase/safe-user";

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookies) {
        cookies.forEach((cookie) => {
          cookieStore.set(cookie.name, cookie.value, cookie.options);
        });
      },
    },
  });

  const { user } = await getSafeUser(supabase);
  if (!user) return { ok: false as const, reason: "not_logged_in" };

  const adminEmails = parseAdminEmails();
  const email = (user.email || "").toLowerCase();
  // SECURITY: default to false when ADMIN_EMAILS is empty (never grant admin to all)
  const isAdmin = adminEmails.length > 0 && adminEmails.includes(email);
  if (!isAdmin) return { ok: false as const, reason: "not_admin" };

  return { ok: true as const, user };
}
