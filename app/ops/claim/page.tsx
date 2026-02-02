import { redirect } from "next/navigation";
import { assertOpsEnabled } from "@/lib/ops/guard";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Helper function to check if email is in allowlist
function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = process.env.GIGAVIZ_OWNER_EMAILS ?? process.env.DEV_ADMIN_EMAILS ?? "";
  const parts = allowlist
    .split(",")
    .map((val) => val.trim().toLowerCase())
    .filter(Boolean);
  return parts.includes(email.toLowerCase());
}

export default async function OpsClaimPage() {
  assertOpsEnabled();

  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/login?next=/ops/claim");
  }

  const admin = await requirePlatformAdmin();
  
  // Already admin - redirect to dashboard
  if (admin.ok) {
    redirect("/ops");
  }

  const isAllowed = user.email && isEmailAllowed(user.email);
  const notAdmin = admin.reason === "not_platform_admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Ops Platform Setup</h1>
          <p className="text-slate-400 text-sm">
            Logged in as: <span className="text-purple-400 font-mono">{user.email}</span>
          </p>
        </div>

        {/* Status & Actions */}
        {!isAllowed ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">
              ❌ Email not whitelisted. Contact system administrator.
            </p>
          </div>
        ) : notAdmin ? (
          <>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm mb-2">
                ⚠️ You need to claim platform admin access.
              </p>
              <p className="text-slate-400 text-xs">
                Your email is whitelisted. Click below to activate ops access.
              </p>
            </div>

            <form action="/api/ops/claim-platform-admin" method="POST">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                🚀 Claim Platform Admin Access
              </button>
            </form>

            <p className="text-slate-500 text-xs text-center mt-4">
              This will grant you access to all ops tools
            </p>
          </>
        ) : (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm text-center">
              Status: {admin.reason || "unknown"}
            </p>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <Link
            href="/"
            className="text-slate-400 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
