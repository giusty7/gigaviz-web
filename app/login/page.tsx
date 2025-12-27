import { Suspense } from "react";
import LoginClient from "./login-client";

// Biar Next.js ga maksa prerender statik untuk page login
export const dynamic = "force-dynamic";

export default function LoginPage() {
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
