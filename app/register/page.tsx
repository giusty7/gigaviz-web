import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/layout/auth-layout";
import { AUTH_DISCLAIMER_LINES } from "@/lib/copy";
import { supabaseServer } from "@/lib/supabase/server";
import RegisterForm from "./register-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RegisterPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/app");
  }

  const t = await getTranslations("app");

  return (
    <AuthLayout
      title={t("enterImperium")}
      description={t("imperiumDesc")}
      disclaimerLines={AUTH_DISCLAIMER_LINES}
    >
      <RegisterForm />
    </AuthLayout>
  );
}
