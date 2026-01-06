import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import LoginClient from "./login-client";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/app");
  }

  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#070B18]">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <div className="animate-pulse space-y-3">
          <div className="h-7 w-40 rounded bg-white/10" />
          <div className="h-4 w-64 rounded bg-white/10" />
          <div className="h-10 w-full rounded-xl bg-white/10 mt-4" />
          <div className="h-10 w-full rounded-xl bg-white/10" />
          <div className="h-10 w-full rounded-xl bg-white/10" />
        </div>
      </div>
    </div>
  );
}
