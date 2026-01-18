import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/auth-layout";
import { AUTH_DISCLAIMER_LINES } from "@/lib/copy";
import ResetPasswordForm from "./reset-password-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Set a new password"
      description="Choose a strong password to secure your account."
      disclaimerLines={AUTH_DISCLAIMER_LINES}
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
