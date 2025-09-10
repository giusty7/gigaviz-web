import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function setAdminCookie(formData: FormData) {
  "use server";
  const token = process.env.ADMIN_TOKEN || "";
  const input = (formData.get("token") || "").toString();
  const next = (formData.get("next") || "/admin/contacts").toString();

  if (token && input === token) {
    (await cookies()).set("admin", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 hari
    });
    redirect(next);
  }

  redirect("/admin/login?err=1");
}

export default async function LoginPage({
  searchParams,
}: { searchParams: { next?: string; err?: string } }) {
  const next = searchParams?.next || "/admin/contacts";
  const err = searchParams?.err === "1";

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-bold">Admin Login</h1>
      {err && (
        <p className="mb-3 rounded bg-red-900/30 px-3 py-2 text-sm text-red-300">
          Token salah.
        </p>
      )}
      <form action={setAdminCookie} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <label className="block text-sm">
          <span className="mb-1 block">Token</span>
          <input
            name="token"
            type="password"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
            placeholder="Masukkan ADMIN_TOKEN"
            required
          />
        </label>
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
          type="submit"
        >
          Masuk
        </button>
      </form>
      <p className="mt-4 text-xs text-zinc-500">
        Tips: Bisa juga akses dengan header <code>Authorization: Bearer TOKEN</code>.
      </p>
    </main>
  );
}
