import { listContacts, countContacts, deleteContact } from "@gv/db";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function AdminContactsPage() {
  const [rows, total] = await Promise.all([listContacts(200), countContacts()]);

  async function onDelete(formData: FormData) {
    "use server";
    const id = (formData.get("id") || "").toString();
    if (!id) return;
    await deleteContact(id);
    revalidatePath("/admin/contacts");
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Contacts ({rows.length}/{total})</h1>

      <div className="overflow-x-auto rounded border border-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900">
            <tr>
              <th className="p-2 text-left">Waktu</th>
              <th className="p-2 text-left">Nama</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Via</th>
              <th className="p-2 text-left">IP</th>
              <th className="p-2 text-left">UA</th>
              <th className="p-2 text-left">Pesan</th>
              <th className="p-2 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t border-zinc-800 align-top">
                <td className="p-2 whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td className="p-2">{r.name}</td>
                <td className="p-2">{r.email}</td>
                <td className="p-2">{r.via}</td>
                <td className="p-2">{r.ip ?? "-"}</td>
                <td className="p-2 max-w-[18rem] truncate" title={r.ua ?? ""}>
                  {r.ua ?? "-"}
                </td>
                <td className="p-2 whitespace-pre-wrap">{r.message}</td>
                <td className="p-2">
                  <form action={onDelete}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500"
                      type="submit"
                    >
                      Hapus
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-center text-zinc-400" colSpan={8}>
                  Belum ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        Protected by cookie <code>admin</code>. Ubah token di <code>ADMIN_TOKEN</code>.
      </p>
    </main>
  );
}
