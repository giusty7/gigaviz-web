import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/auth-layout";
import { AUTH_DISCLAIMER_LINES } from "@/lib/copy";
import ForgotPasswordForm from "./forgot-password-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      description="We'll email you a secure reset link."
      disclaimerLines={AUTH_DISCLAIMER_LINES}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
