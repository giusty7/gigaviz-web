import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

const CHOOSER_EMAIL = "vg.gigaviz@gmail.com";

export default async function AdminHome() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {
        // middleware handles session refresh cookies
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/login?next=/admin");
  }

  const email = (user.email || "").toLowerCase();
  if (email !== CHOOSER_EMAIL) {
    redirect("/admin/leads");
  }

  return (
    <div className="min-h-[calc(100vh-0px)] w-full">
      <div className="mx-auto max-w-[1000px] px-4 py-10">
        <div className="mb-6">
          <div className="text-2xl font-semibold tracking-tight text-slate-100">
            Admin
          </div>
          <div className="text-sm text-slate-400">
            Choose where you want to work.
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/admin/leads"
            className="group rounded-2xl border border-slate-800 bg-slate-950/50 p-6 transition hover:border-slate-700 hover:bg-slate-900/50"
          >
            <div className="text-lg font-semibold text-slate-100">Open Leads</div>
            <div className="mt-2 text-sm text-slate-400">
              Manage incoming leads and follow-ups.
            </div>
            <div className="mt-4 text-xs text-slate-500">Go to /admin/leads</div>
          </Link>

          <Link
            href="/admin/inbox"
            className="group rounded-2xl border border-slate-800 bg-slate-950/50 p-6 transition hover:border-slate-700 hover:bg-slate-900/50"
          >
            <div className="text-lg font-semibold text-slate-100">Open Inbox</div>
            <div className="mt-2 text-sm text-slate-400">
              Reply to WhatsApp conversations.
            </div>
            <div className="mt-4 text-xs text-slate-500">Go to /admin/inbox</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
