import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/auth-layout";
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

  return (
    <AuthLayout
      title="Create your account"
      description="Start with a verified email and a secure password."
    >
      <RegisterForm />
    </AuthLayout>
  );
}
