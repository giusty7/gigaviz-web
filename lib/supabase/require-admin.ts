import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
      setAll: () => {
        // route handler: kita dak perlu set cookie balik di sini,
        // middleware sudah ngurus refresh session
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { ok: false as const, reason: "not_logged_in" };

  const adminEmails = parseAdminEmails();
  const email = (user.email || "").toLowerCase();
  const isAdmin = adminEmails.length === 0 ? true : adminEmails.includes(email);
  if (!isAdmin) return { ok: false as const, reason: "not_admin" };

  return { ok: true as const, user };
}
