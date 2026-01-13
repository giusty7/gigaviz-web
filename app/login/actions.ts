"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/validation/auth";

type LoginActionResult = {
  ok: boolean;
  message?: string;
  needsVerify?: boolean;
  next?: string;
};

export async function loginAction(formData: FormData): Promise<LoginActionResult | void> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const rawNext = formData.get("next");

  const parsed = loginSchema.safeParse({
    email: typeof rawEmail === "string" ? rawEmail : "",
    password: typeof rawPassword === "string" ? rawPassword : "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Email or password is invalid.",
    };
  }

  const nextParam = typeof rawNext === "string" ? rawNext : undefined;
  const nextSafe = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieStore = (await cookies()) as unknown as {
    getAll: () => { name: string; value: string }[];
    set: (name: string, value: string, options?: Record<string, unknown>) => void;
  };

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { ok: false, message: error?.message || "Login failed." };
  }

  const confirmed = data.user.email_confirmed_at || data.user.confirmed_at;
  if (!confirmed) {
    await supabase.auth.signOut();
    return {
      ok: false,
      needsVerify: true,
      message: "Email is not verified yet. Check your inbox to continue.",
    };
  }

  redirect(nextSafe);
}
