import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/auth-layout";
import VerifyEmailClient from "./verify-email-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      title="Verify your email"
      description="We sent a verification link to your inbox."
    >
      <VerifyEmailClient />
    </AuthLayout>
  );
}
