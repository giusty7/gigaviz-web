import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/layout/auth-layout";
import { AUTH_DISCLAIMER_LINES } from "@/lib/copy";
import { supabaseServer } from "@/lib/supabase/server";
import LoginForm from "./login-form";
import { loginAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps =
  | { searchParams?: { next?: string } }
  | { searchParams?: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const resolvedSearch = await Promise.resolve(searchParams ?? {});
  const nextParam =
    typeof (resolvedSearch as { next?: string })?.next === "string"
      ? (resolvedSearch as { next?: string }).next
      : undefined;
  const nextSafe = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";

  if (data.user) {
    const confirmed = data.user.email_confirmed_at || data.user.confirmed_at;
    if (!confirmed) {
      const emailParam = data.user.email
        ? `?email=${encodeURIComponent(data.user.email)}`
        : "";
      redirect(`/verify-email${emailParam}`);
    }
    redirect(nextSafe);
  }

  const t = await getTranslations("app");

  return (
    <AuthLayout
      title={t("enterImperium")}
      description={t("imperiumDesc")}
      disclaimerLines={AUTH_DISCLAIMER_LINES}
    >
      <LoginForm nextSafe={nextSafe} loginAction={loginAction} />
    </AuthLayout>
  );
}

